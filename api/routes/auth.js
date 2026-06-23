const express = require('express');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { sendVerificationCode, generateCode } = require('../services/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CODE_EXPIRY_MINUTES = 10;

/**
 * POST /api/auth/send-code
 * 发送验证码
 */
router.post('/send-code', async (req, res) => {
    try {
        const { email } = req.body;

        // 验证邮箱格式
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        const db = getDb();
        const code = generateCode();
        const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

        // 保存验证码到数据库
        const stmt = db.prepare(`
            INSERT INTO verification_codes (email, code, expires_at)
            VALUES (?, ?, ?)
        `);
        stmt.run(email, code, expiresAt.toISOString());

        // 发送邮件
        await sendVerificationCode(email, code);

        res.json({
            success: true,
            message: '验证码已发送，请查收邮件',
            expiresIn: CODE_EXPIRY_MINUTES * 60
        });
    } catch (error) {
        console.error('Send code error:', error);
        res.status(500).json({ error: '发送验证码失败，请稍后重试' });
    }
});

/**
 * POST /api/auth/verify-code
 * 验证码登录
 */
router.post('/verify-code', (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: '邮箱和验证码不能为空' });
        }

        const db = getDb();

        // 查找有效的验证码
        const verification = db.prepare(`
            SELECT * FROM verification_codes
            WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
            ORDER BY created_at DESC
            LIMIT 1
        `).get(email, code);

        if (!verification) {
            return res.status(400).json({ error: '验证码无效或已过期' });
        }

        // 标记验证码为已使用
        db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(verification.id);

        // 查找或创建用户
        let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

        if (!user) {
            // 创建新用户
            const result = db.prepare(`
                INSERT INTO users (email, last_login)
                VALUES (?, datetime('now'))
            `).run(email);

            user = { id: result.lastInsertRowid, email };

            // 初始化用户统计
            db.prepare(`
                INSERT INTO user_stats (user_id)
                VALUES (?)
            `).run(user.id);
        } else {
            // 更新最后登录时间
            db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);
        }

        // 生成 JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user.userId,
            email: req.user.email
        }
    });
});

/**
 * JWT 认证中间件
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '未授权' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '无效的令牌' });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
