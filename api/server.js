require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

// 安全中间件
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        const allowedOrigins = new Set([
            process.env.FRONTEND_URL || 'https://type.mineguai.com',
            'http://localhost:8000',
            'http://127.0.0.1:8000'
        ]);

        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// 限流
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    skip: req => req.path.startsWith('/api/admin')
});
app.use(limiter);

// 验证码限流（更严格）
const codeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 3 // 每分钟最多3次
});

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 15
});

// 路由
app.use('/api/auth/send-code', codeLimiter);
app.use(['/api/auth/login', '/api/auth/register'], loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// 初始化数据库并启动服务器
db.init();

app.listen(PORT, () => {
    console.log(`🚀 Code Typing Lab API running on port ${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_HOST}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    db.close();
    process.exit(0);
});
