const crypto = require('crypto');
const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

function safeCompare(a, b) {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res, next) {
    const expected = process.env.ADMIN_TOKEN;
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const provided = req.headers['x-admin-token'] || bearer;

    if (!expected) {
        return res.status(503).json({ error: '管理接口未启用' });
    }

    if (!provided || !safeCompare(provided, expected)) {
        return res.status(401).json({ error: '未授权' });
    }

    next();
}

router.get('/monitor', (req, res) => {
    res.set('Content-Security-Policy', "default-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'");
    res.type('html').send(renderMonitorPage());
});

router.use(requireAdmin);

router.get('/overview', (req, res) => {
    try {
        res.json(buildOverview());
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: '读取监控信息失败' });
    }
});

function buildOverview() {
    const db = getDb();
    const totals = {
        users: db.prepare(`SELECT COUNT(*) AS value FROM users`).get().value,
        activeUsers: db.prepare(`SELECT COUNT(*) AS value FROM users WHERE is_active = 1`).get().value,
        trainingSessions: db.prepare(`SELECT COUNT(*) AS value FROM training_sessions`).get().value,
        pageViews: db.prepare(`SELECT COUNT(*) AS value FROM site_events WHERE event_type = 'page_view'`).get().value,
        pageViews24h: db.prepare(`
            SELECT COUNT(*) AS value
            FROM site_events
            WHERE event_type = 'page_view' AND created_at >= datetime('now', '-1 day')
        `).get().value,
        uniqueVisitors24h: db.prepare(`
            SELECT COUNT(DISTINCT COALESCE(CAST(user_id AS TEXT), ip)) AS value
            FROM site_events
            WHERE event_type = 'page_view' AND created_at >= datetime('now', '-1 day')
        `).get().value
    };

    const recentUsers = db.prepare(`
        SELECT
            u.id,
            u.email,
            u.display_name AS displayName,
            CASE WHEN COALESCE(u.avatar, '') = '' THEN 0 ELSE 1 END AS hasAvatar,
            u.created_at AS createdAt,
            u.last_login AS lastLogin,
            COALESCE(s.total_runs, 0) AS totalRuns,
            COALESCE(s.best_wpm, 0) AS bestWpm,
            COALESCE(s.total_xp, 0) AS totalXP
        FROM users u
        LEFT JOIN user_stats s ON s.user_id = u.id
        ORDER BY COALESCE(u.last_login, u.created_at) DESC
        LIMIT 20
    `).all();

    const recentEvents = db.prepare(`
        SELECT
            e.created_at AS createdAt,
            e.path,
            e.title,
            e.ip,
            u.email,
            u.display_name AS displayName
        FROM site_events e
        LEFT JOIN users u ON u.id = e.user_id
        ORDER BY e.created_at DESC
        LIMIT 50
    `).all();

    const recentSessions = db.prepare(`
        SELECT
            t.created_at AS createdAt,
            t.mode,
            t.wpm,
            t.accuracy,
            t.chars,
            t.grade,
            u.email,
            u.display_name AS displayName
        FROM training_sessions t
        LEFT JOIN users u ON u.id = t.user_id
        ORDER BY t.created_at DESC
        LIMIT 30
    `).all();

    const topUsers = db.prepare(`
        SELECT
            u.email,
            u.display_name AS displayName,
            COALESCE(s.total_runs, 0) AS totalRuns,
            COALESCE(s.best_wpm, 0) AS bestWpm,
            COALESCE(s.total_xp, 0) AS totalXP
        FROM users u
        LEFT JOIN user_stats s ON s.user_id = u.id
        ORDER BY COALESCE(s.total_runs, 0) DESC, COALESCE(s.best_wpm, 0) DESC
        LIMIT 10
    `).all();

    return {
        server: {
            now: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        totals,
        recentUsers,
        recentEvents,
        recentSessions,
        topUsers
    };
}

function renderMonitorPage() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Typing Lab 监控</title>
    <style>
        :root { --bg:#f6f8fb; --surface:#fff; --line:#d8e1ec; --panel:#edf3fa; --ink:#101828; --muted:#526173; --accent:#2563eb; --danger:#b42318; --ok:#047857; }
        * { box-sizing:border-box; }
        body { margin:0; background:var(--bg); color:var(--ink); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.5; }
        .shell { max-width:1280px; margin:0 auto; padding:28px; }
        header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
        h1 { margin:0; font-size:28px; letter-spacing:0; }
        .muted { color:var(--muted); }
        .auth { display:flex; gap:8px; align-items:center; margin:14px 0 18px; }
        input { min-height:40px; width:min(420px, 100%); padding:0 12px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--ink); font:inherit; }
        button { min-height:40px; padding:0 14px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--ink); font:inherit; font-weight:700; cursor:pointer; }
        button:hover { border-color:var(--accent); }
        .status { margin-bottom:16px; color:var(--muted); font-size:14px; }
        .live { display:inline-flex; align-items:center; gap:8px; font-weight:800; color:var(--ok); }
        .dot { width:8px; height:8px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 4px rgba(4,120,87,.12); }
        .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:12px; margin-bottom:18px; }
        .metric,.panel { background:var(--surface); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
        .metric { padding:16px; }
        .metric strong { display:block; font-size:30px; line-height:1.1; }
        .metric span { display:block; margin-top:6px; color:var(--muted); font-size:13px; }
        .grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:18px; }
        .wide { grid-column:1/-1; }
        .panel-head { display:flex; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid var(--line); background:var(--panel); }
        .panel h2 { margin:0; font-size:15px; }
        .panel small { color:var(--muted); }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th,td { padding:10px 12px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
        th { color:var(--muted); font-size:12px; font-weight:800; }
        tr:last-child td { border-bottom:none; }
        .error { color:var(--danger); font-weight:800; }
        @media (max-width:860px) { .shell{padding:18px;} header,.auth{flex-direction:column; align-items:stretch;} .grid{grid-template-columns:1fr;} .panel{overflow-x:auto;} }
    </style>
</head>
<body>
    <main class="shell">
        <header>
            <div>
                <h1>Code Typing Lab 监控</h1>
                <div class="muted">服务器实时面板，每 3 秒自动刷新。</div>
            </div>
            <button id="refreshBtn" type="button">立即刷新</button>
        </header>
        <div class="auth">
            <input id="tokenInput" type="password" autocomplete="current-password" placeholder="输入 ADMIN_TOKEN">
            <button id="saveTokenBtn" type="button">连接</button>
            <button id="clearTokenBtn" type="button">清除</button>
        </div>
        <div class="status" id="status">请输入管理员令牌。</div>
        <section class="metrics" id="metrics"></section>
        <section class="grid">
            <div class="panel"><div class="panel-head"><h2>最近用户</h2><small>按最近登录排序</small></div><div id="recentUsers"></div></div>
            <div class="panel"><div class="panel-head"><h2>活跃排行</h2><small>按训练次数排序</small></div><div id="topUsers"></div></div>
            <div class="panel wide"><div class="panel-head"><h2>最近访问</h2><small>页面打开记录</small></div><div id="recentEvents"></div></div>
            <div class="panel wide"><div class="panel-head"><h2>最近训练</h2><small>登录用户同步后的训练记录</small></div><div id="recentSessions"></div></div>
        </section>
    </main>
    <script>
        const tokenInput = document.getElementById('tokenInput');
        const statusEl = document.getElementById('status');
        const refreshBtn = document.getElementById('refreshBtn');
        const metricsEl = document.getElementById('metrics');
        tokenInput.value = localStorage.getItem('ctl_admin_token') || '';
        document.getElementById('saveTokenBtn').addEventListener('click', () => { localStorage.setItem('ctl_admin_token', tokenInput.value.trim()); load(); });
        document.getElementById('clearTokenBtn').addEventListener('click', () => { localStorage.removeItem('ctl_admin_token'); tokenInput.value = ''; statusEl.textContent = '管理员令牌已清除。'; });
        refreshBtn.addEventListener('click', load);
        setInterval(load, 3000);
        if (tokenInput.value) load();
        async function load() {
            const token = tokenInput.value.trim() || localStorage.getItem('ctl_admin_token') || '';
            if (!token) return;
            refreshBtn.disabled = true;
            try {
                const response = await fetch('/api/admin/overview', { headers: { 'x-admin-token': token }, cache: 'no-store' });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || '读取失败');
                render(data);
                statusEl.innerHTML = '<span class="live"><span class="dot"></span>实时连接</span> · 服务器时间 ' + fmt(data.server.now) + ' · 运行 ' + Math.round(data.server.uptimeSeconds / 60) + ' 分钟 · RSS ' + data.server.memoryMB + ' MB';
            } catch (error) {
                statusEl.innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
            } finally {
                refreshBtn.disabled = false;
            }
        }
        function render(data) {
            const metrics = [['用户数',data.totals.users],['活跃账号',data.totals.activeUsers],['总访问',data.totals.pageViews],['24h 访问',data.totals.pageViews24h],['24h 访客',data.totals.uniqueVisitors24h],['训练记录',data.totals.trainingSessions]];
            metricsEl.innerHTML = metrics.map(([label,value]) => '<div class="metric"><strong>' + value + '</strong><span>' + label + '</span></div>').join('');
            table('recentUsers', ['账号','昵称','登录','训练','最佳'], data.recentUsers, item => [item.email, item.displayName || '-', fmt(item.lastLogin || item.createdAt), item.totalRuns, item.bestWpm]);
            table('topUsers', ['账号','昵称','训练','最佳','XP'], data.topUsers, item => [item.email, item.displayName || '-', item.totalRuns, item.bestWpm, item.totalXP]);
            table('recentEvents', ['时间','页面','用户','IP'], data.recentEvents, item => [fmt(item.createdAt), item.path || '-', item.email || item.displayName || '未登录', item.ip || '-']);
            table('recentSessions', ['时间','用户','模式','WPM','准确率','字符'], data.recentSessions, item => [fmt(item.createdAt), item.email || item.displayName || '-', item.mode, item.wpm, item.accuracy + '%', item.chars]);
        }
        function table(id, headers, rows, mapRow) {
            const target = document.getElementById(id);
            if (!rows.length) { target.innerHTML = '<div style="padding:16px;color:var(--muted)">暂无数据</div>'; return; }
            target.innerHTML = '<table><thead><tr>' + headers.map(item => '<th>' + escapeHtml(item) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(item => '<tr>' + mapRow(item).map(cell => '<td>' + escapeHtml(cell) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
        }
        function fmt(value) { return value ? new Date(value).toLocaleString('zh-CN', { hour12:false }) : '-'; }
        function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
    </script>
</body>
</html>`;
}

module.exports = router;
