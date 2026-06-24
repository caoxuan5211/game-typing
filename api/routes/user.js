const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

function getPublicUser(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.display_name || user.email.split('@')[0],
        avatar: user.avatar || ''
    };
}

/**
 * GET /api/user/profile
 * 获取个人资料
 */
router.get('/profile', (req, res) => {
    try {
        const db = getDb();
        const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ user: getPublicUser(user) });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: '获取个人资料失败' });
    }
});

/**
 * PATCH /api/user/profile
 * 更新昵称和头像
 */
router.patch('/profile', (req, res) => {
    try {
        const displayName = String(req.body.displayName || '').trim().replace(/\s+/g, ' ').slice(0, 32);
        const avatar = String(req.body.avatar || '').trim();

        if (!displayName) {
            return res.status(400).json({ error: '昵称不能为空' });
        }

        if (avatar && avatar.length > 600000) {
            return res.status(400).json({ error: '头像文件过大' });
        }

        if (avatar && !/^data:image\/(png|jpeg|webp);base64,/.test(avatar)) {
            return res.status(400).json({ error: '头像格式仅支持 PNG/JPEG/WebP' });
        }

        const db = getDb();
        db.prepare(`
            UPDATE users
            SET display_name = ?, avatar = ?
            WHERE id = ?
        `).run(displayName, avatar, req.user.userId);

        const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.userId);
        res.json({ success: true, user: getPublicUser(user) });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: '更新个人资料失败' });
    }
});

/**
 * GET /api/user/stats
 * 获取用户统计数据
 */
router.get('/stats', (req, res) => {
    try {
        const db = getDb();
        const userId = req.user.userId;

        const stats = db.prepare(`
            SELECT * FROM user_stats WHERE user_id = ?
        `).get(userId);

        if (!stats) {
            return res.status(404).json({ error: '用户统计不存在' });
        }

        // 解析 JSON 字段
        stats.earned_badges = JSON.parse(stats.earned_badges || '[]');
        stats.modes_played = JSON.parse(stats.modes_played || '[]');

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: '获取统计数据失败' });
    }
});

/**
 * POST /api/user/sync
 * 同步训练数据
 */
router.post('/sync', (req, res) => {
    try {
        const db = getDb();
        const userId = req.user.userId;
        const { stats, history } = req.body;

        if (!stats) {
            return res.status(400).json({ error: '数据不能为空' });
        }

        // 更新用户统计
        db.prepare(`
            UPDATE user_stats SET
                total_xp = ?,
                level = ?,
                total_runs = ?,
                best_wpm = ?,
                best_accuracy = ?,
                best_combo = ?,
                day_streak = ?,
                earned_badges = ?,
                modes_played = ?,
                last_played_day = ?
            WHERE user_id = ?
        `).run(
            stats.totalXP || 0,
            stats.level || 1,
            stats.totalRuns || 0,
            stats.bestWpm || 0,
            stats.bestAccuracy || 0,
            stats.bestCombo || 0,
            stats.dayStreak || 0,
            JSON.stringify(stats.earnedBadges || []),
            JSON.stringify(stats.modesPlayed || []),
            stats.lastPlayedDay || null,
            userId
        );

        // 可选：同步训练历史记录
        if (history && Array.isArray(history)) {
            const insertStmt = db.prepare(`
                INSERT INTO training_sessions
                (user_id, wpm, accuracy, time, mode, chars, grade, xp, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const record of history.slice(0, 10)) {
                insertStmt.run(
                    userId,
                    record.wpm,
                    record.accuracy,
                    record.time,
                    record.mode,
                    record.chars,
                    record.grade,
                    record.xp || 0,
                    new Date(record.createdAt).toISOString()
                );
            }
        }

        res.json({ success: true, message: '数据同步成功' });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: '数据同步失败' });
    }
});

/**
 * GET /api/user/history
 * 获取训练历史记录
 */
router.get('/history', (req, res) => {
    try {
        const db = getDb();
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit || '20');
        const offset = parseInt(req.query.offset || '0');

        const history = db.prepare(`
            SELECT * FROM training_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).all(userId, limit, offset);

        const total = db.prepare(`
            SELECT COUNT(*) as count FROM training_sessions WHERE user_id = ?
        `).get(userId);

        res.json({
            history,
            total: total.count,
            limit,
            offset
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: '获取历史记录失败' });
    }
});

/**
 * DELETE /api/user/data
 * 删除用户所有数据
 */
router.delete('/data', (req, res) => {
    try {
        const db = getDb();
        const userId = req.user.userId;

        // 删除训练记录
        db.prepare(`DELETE FROM training_sessions WHERE user_id = ?`).run(userId);

        // 重置统计数据
        db.prepare(`
            UPDATE user_stats SET
                total_xp = 0,
                level = 1,
                total_runs = 0,
                best_wpm = 0,
                best_accuracy = 0,
                best_combo = 0,
                day_streak = 0,
                earned_badges = '[]',
                modes_played = '[]',
                last_played_day = NULL
            WHERE user_id = ?
        `).run(userId);

        res.json({ success: true, message: '数据已清空' });
    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({ error: '删除数据失败' });
    }
});

module.exports = router;
