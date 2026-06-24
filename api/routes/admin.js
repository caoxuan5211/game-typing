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

router.use(requireAdmin);

router.get('/overview', (req, res) => {
    try {
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

        res.json({
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
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: '读取监控信息失败' });
    }
});

module.exports = router;
