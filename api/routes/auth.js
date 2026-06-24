const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { sendVerificationCode, generateCode } = require('../services/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CODE_EXPIRY_MINUTES = 10;
const PASSWORD_MIN_LENGTH = 8;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeDisplayName(value, email) {
    const fallback = email.split('@')[0];
    const name = String(value || fallback).trim().replace(/\s+/g, ' ').slice(0, 32);
    return name || fallback;
}

function getPublicUser(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.display_name || user.email.split('@')[0],
        avatar: user.avatar || ''
    };
}

function issueToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
}

function ensureUserStats(db, userId) {
    db.prepare(`
        INSERT OR IGNORE INTO user_stats (user_id)
        VALUES (?)
    `).run(userId);
}

function consumeVerificationCode(db, email, code) {
    const verification = db.prepare(`
        SELECT * FROM verification_codes
        WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
        ORDER BY created_at DESC
        LIMIT 1
    `).get(email, code);

    if (!verification) return false;
    db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(verification.id);
    return true;
}

/**
 * POST /api/auth/send-code
 * 发送验证码
 */
router.post('/send-code', async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        // 验证邮箱格式
        if (!email || !isValidEmail(email)) {
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
 * POST /api/auth/register
 * 验证码注册 / 为旧验证码账号设置密码
 */
router.post('/register', async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const code = String(req.body.code || '').trim();
        const password = String(req.body.password || '');
        const displayName = sanitizeDisplayName(req.body.displayName, email);

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ error: '请输入6位验证码' });
        }

        if (password.length < PASSWORD_MIN_LENGTH) {
            return res.status(400).json({ error: `密码至少需要 ${PASSWORD_MIN_LENGTH} 位` });
        }

        const db = getDb();
        if (!consumeVerificationCode(db, email, code)) {
            return res.status(400).json({ error: '验证码无效或已过期' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

        if (user) {
            db.prepare(`
                UPDATE users
                SET password_hash = ?, display_name = COALESCE(display_name, ?), last_login = datetime('now')
                WHERE id = ?
            `).run(passwordHash, displayName, user.id);
        } else {
            const result = db.prepare(`
                INSERT INTO users (email, password_hash, display_name, last_login)
                VALUES (?, ?, ?, datetime('now'))
            `).run(email, passwordHash, displayName);

            user = { id: result.lastInsertRowid, email, display_name: displayName, avatar: '' };
        }

        ensureUserStats(db, user.id);
        user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id);

        res.json({
            success: true,
            token: issueToken(user),
            user: getPublicUser(user)
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
});

/**
 * POST /api/auth/login
 * 邮箱密码登录
 */
router.post('/login', async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }

        const db = getDb();
        const user = db.prepare(`SELECT * FROM users WHERE email = ? AND is_active = 1`).get(email);

        if (!user || !user.password_hash) {
            return res.status(401).json({ error: '账号不存在或尚未设置密码' });
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);
        ensureUserStats(db, user.id);

        res.json({
            success: true,
            token: issueToken(user),
            user: getPublicUser(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});

/**
 * POST /api/auth/verify-code
 * 验证码登录
 */
router.post('/verify-code', (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const code = String(req.body.code || '').trim();

        if (!email || !code) {
            return res.status(400).json({ error: '邮箱和验证码不能为空' });
        }

        const db = getDb();

        if (!consumeVerificationCode(db, email, code)) {
            return res.status(400).json({ error: '验证码无效或已过期' });
        }

        // 查找或创建用户
        let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

        if (!user) {
            // 创建新用户
            const result = db.prepare(`
                INSERT INTO users (email, display_name, last_login)
                VALUES (?, ?, datetime('now'))
            `).run(email, sanitizeDisplayName('', email));

            user = { id: result.lastInsertRowid, email, display_name: sanitizeDisplayName('', email), avatar: '' };

            ensureUserStats(db, user.id);
        } else {
            // 更新最后登录时间
            db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);
            ensureUserStats(db, user.id);
        }

        user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id);

        res.json({
            success: true,
            token: issueToken(user),
            user: getPublicUser(user)
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
    const db = getDb();
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.userId);

    if (!user) {
        return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
        user: getPublicUser(user)
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
