# 🚀 用户登录系统部署指南

## 📋 概述

你的 Code Typing Lab 现在支持用户登录和云端数据同步！

**功能特性：**
- ✉️ 邮箱验证码登录（无需密码）
- 🔐 JWT 令牌认证
- ☁️ 云端数据同步
- 📊 跨设备访问训练记录
- 🎮 等级、徽章、经验值云端保存

---

## 🛠️ 部署步骤

### 1. 上传后端代码到服务器

```bash
# 在本地
cd F:/game-typing
scp -r api vps1:~/

# 登录服务器
ssh vps1
cd ~/api
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置邮件服务

你需要一个 SMTP 邮件服务来发送验证码。以下是几个选项：

#### 选项A: 阿里云企业邮箱（推荐）

1. 购买阿里云企业邮箱或使用免费版
2. 登录企业邮箱管理后台
3. 创建一个账号如 `noreply@yourdomain.com`
4. 记录 SMTP 信息

**配置：**
```env
EMAIL_HOST=smtp.mxhichina.com
EMAIL_PORT=465
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
```

#### 选项B: 腾讯企业邮箱

```env
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=465
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
```

#### 选项C: QQ邮箱（测试用）

1. 登录 QQ 邮箱
2. 设置 -> 账户 -> 开启 SMTP 服务
3. 生成授权码

```env
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=465
EMAIL_USER=your@qq.com
EMAIL_PASS=授权码（不是QQ密码）
```

#### 选项D: Gmail（需科学上网）

1. 开启两步验证
2. 生成应用专用密码

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your@gmail.com
EMAIL_PASS=应用专用密码
```

### 4. 创建配置文件

```bash
cd ~/api
cp .env.example .env
nano .env
```

**编辑 .env 文件：**

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥（改成随机字符串）
JWT_SECRET=请改成一个随机的长字符串-比如用uuid生成器生成

# 邮件配置（根据你选择的服务填写）
EMAIL_HOST=smtp.mxhichina.com
EMAIL_PORT=465
EMAIL_USER=noreply@mineguai.com
EMAIL_PASS=你的邮箱密码
EMAIL_FROM=Code Typing Lab <noreply@mineguai.com>

# 前端域名
FRONTEND_URL=https://type.mineguai.com
```

**生成安全的 JWT_SECRET：**
```bash
# 方法1: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2: 使用 OpenSSL
openssl rand -hex 32
```

### 5. 创建必要的目录

```bash
mkdir -p data logs
```

### 6. 启动后端服务

#### 方法A: 使用 PM2（推荐）

```bash
# 全局安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs code-typing-api

# 开机自启动
pm2 startup
pm2 save
```

#### 方法B: 直接运行

```bash
npm start
```

### 7. 配置 Nginx 反向代理

编辑 Nginx 配置：

```bash
sudo nano /etc/nginx/sites-available/type.mineguai.com
```

**添加 API 代理配置：**

```nginx
server {
    listen 443 ssl http2;
    server_name type.mineguai.com;

    # SSL 证书配置...

    # 前端静态文件
    location / {
        root /var/www/html/game-typing;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**重启 Nginx：**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8. 测试后端

```bash
# 健康检查
curl https://type.mineguai.com/api/health

# 应该返回: {"status":"ok","timestamp":"..."}
```

---

## 🧪 测试流程

### 1. 测试邮件发送

```bash
# 在服务器上
cd ~/api
node -e "
const email = require('./services/email');
email.sendVerificationCode('your@email.com', '123456')
  .then(() => console.log('✅ Email sent'))
  .catch(err => console.error('❌ Error:', err));
"
```

### 2. 测试完整登录流程

1. 访问 https://type.mineguai.com/login.html
2. 输入你的邮箱
3. 点击"获取验证码"
4. 检查邮箱收到验证码
5. 输入验证码登录
6. 登录成功后跳转到训练页面

---

## 🔍 故障排查

### 问题1: 邮件发送失败

**检查日志：**
```bash
pm2 logs code-typing-api --lines 50
```

**常见原因：**
- SMTP 配置错误
- 密码错误（QQ邮箱要用授权码，不是QQ密码）
- 防火墙阻止 465 端口
- 邮箱服务商限流

**解决方法：**
```bash
# 测试 SMTP 连接
telnet smtp.mxhichina.com 465
```

### 问题2: API 无法访问

**检查端口：**
```bash
sudo netstat -tlnp | grep 3001
```

**检查 PM2 状态：**
```bash
pm2 status
pm2 logs code-typing-api
```

### 问题3: CORS 错误

确保 `.env` 中的 `FRONTEND_URL` 正确：
```env
FRONTEND_URL=https://type.mineguai.com
```

---

## 📊 数据管理

### 查看数据库

```bash
cd ~/api/data
sqlite3 typing-lab.db

# 查看用户
SELECT * FROM users;

# 查看统计
SELECT * FROM user_stats;

# 退出
.exit
```

### 备份数据库

```bash
# 创建备份
cp ~/api/data/typing-lab.db ~/api/data/typing-lab.db.backup-$(date +%Y%m%d)

# 定时备份（添加到 crontab）
crontab -e

# 添加这一行（每天凌晨3点备份）
0 3 * * * cp ~/api/data/typing-lab.db ~/api/data/typing-lab.db.backup-$(date +\%Y\%m\%d)
```

---

## 🔐 安全建议

1. **强 JWT 密钥**：使用至少 32 字节的随机字符串
2. **HTTPS**：确保前端和 API 都使用 HTTPS
3. **限流**：已内置，防止暴力破解
4. **邮箱验证**：验证码10分钟过期，用后即废
5. **定期备份**：设置自动备份任务

---

## 📝 下一步

部署完成后，你需要：

1. ✅ 提交前端代码到 GitHub
2. ✅ 部署前端到服务器
3. ✅ 测试完整登录流程
4. ✅ 更新 README 说明用户登录功能

---

## 🆘 需要帮助？

如果遇到问题，提供以下信息：

1. PM2 日志: `pm2 logs code-typing-api --lines 50`
2. Nginx 错误日志: `sudo tail -50 /var/log/nginx/error.log`
3. 邮件服务商类型
4. 具体错误信息

**我已经创建了所有必要的文件，现在需要你：**

1. 选择一个邮件服务商（推荐阿里云企业邮箱）
2. 按照上面的步骤配置和部署
3. 告诉我遇到的任何问题

准备好开始部署了吗？
