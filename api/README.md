# Code Typing Lab - 用户系统后端

## 功能
- 邮箱验证码登录
- 用户数据存储
- 训练记录同步
- JWT 认证

## 技术栈
- Node.js + Express
- SQLite 数据库
- Nodemailer 邮件发送
- JWT 认证

## 安装

```bash
cd api
npm install
```

## 配置

创建 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥
JWT_SECRET=your-random-secret-key-change-this

# 邮件配置（使用阿里云企业邮箱或其他SMTP）
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=Code Typing Lab <noreply@yourdomain.com>

# 前端域名（用于CORS）
FRONTEND_URL=https://type.mineguai.com
```

## 邮件服务配置选项

### 选项1: 阿里云企业邮箱（推荐）
```env
EMAIL_HOST=smtp.mxhichina.com
EMAIL_PORT=465
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
```

### 选项2: 腾讯企业邮箱
```env
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=465
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
```

### 选项3: Gmail（需要应用专用密码）
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
```

## 启动

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API 端点

### 认证
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/verify-code` - 验证码登录
- `GET /api/auth/me` - 获取当前用户信息

### 用户数据
- `GET /api/user/stats` - 获取用户统计
- `POST /api/user/sync` - 同步训练数据
- `GET /api/user/history` - 获取训练历史

## PM2 部署

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
