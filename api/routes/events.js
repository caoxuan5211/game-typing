const express = require('express');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function optionalUserId(req) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return null;

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload.userId || null;
    } catch {
        return null;
    }
}

function cleanText(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
}

function getClientIp(req) {
    return req.headers['cf-connecting-ip']
        || req.headers['x-real-ip']
        || String(req.headers['x-forwarded-for'] || '').split(',')[0]
        || req.ip;
}

router.post('/visit', (req, res) => {
    try {
        const db = getDb();
        db.prepare(`
            INSERT INTO site_events
                (user_id, event_type, path, title, referrer, ip, user_agent)
            VALUES (?, 'page_view', ?, ?, ?, ?, ?)
        `).run(
            optionalUserId(req),
            cleanText(req.body.path, 240) || '/',
            cleanText(req.body.title, 160),
            cleanText(req.body.referrer, 240),
            cleanText(getClientIp(req), 80),
            cleanText(req.headers['user-agent'], 300)
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Track visit error:', error);
        res.status(500).json({ error: '访问记录失败' });
    }
});

module.exports = router;
