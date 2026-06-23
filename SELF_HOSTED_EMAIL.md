# 自建邮件发送服务方案

## 方案对比

### 方案1: Postfix（仅发送）⭐推荐
- ✅ 简单易配置
- ✅ 只需要发送功能
- ✅ 轻量级
- ⚠️ 需要配置 DNS 记录

### 方案2: 完整邮件服务器（Postfix + Dovecot）
- ✅ 功能完整
- ✅ 可收可发
- ❌ 配置复杂
- ❌ 资源占用高

### 方案3: 使用免费 SMTP 中转
- ✅ 零成本
- ✅ 配置简单
- ⚠️ 有发送限制

---

## 🚀 推荐方案：Postfix 仅发送模式

### 第一步：安装 Postfix

```bash
# 登录服务器
ssh vps1

# 安装 Postfix
sudo apt update
sudo apt install postfix mailutils

# 安装时选择：Internet Site
# System mail name: mineguai.com
```

### 第二步：配置 Postfix

```bash
sudo nano /etc/postfix/main.cf
```

**修改配置：**

```conf
# 基本配置
myhostname = mail.mineguai.com
mydomain = mineguai.com
myorigin = $mydomain

# 监听地址
inet_interfaces = loopback-only
inet_protocols = ipv4

# 发送邮件设置
relayhost =
mydestination = $myhostname, localhost.$mydomain, localhost
mynetworks = 127.0.0.0/8

# 邮箱大小限制
mailbox_size_limit = 0
message_size_limit = 10240000
```

### 第三步：配置 DNS 记录 ⭐重要

在你的域名 DNS 管理面板添加以下记录：

#### 1. SPF 记录（防止被识别为垃圾邮件）

```
类型：TXT
主机记录：@
值：v=spf1 a mx ip4:你的服务器IP ~all
TTL：600
```

#### 2. DKIM 记录（可选，但推荐）

```bash
# 安装 OpenDKIM
sudo apt install opendkim opendkim-tools

# 生成密钥
sudo opendkim-genkey -t -s mail -d mineguai.com -D /etc/opendkim/keys/

# 查看公钥
sudo cat /etc/opendkim/keys/mail.txt
```

添加 DNS 记录：
```
类型：TXT
主机记录：mail._domainkey
值：（从 mail.txt 中复制）
TTL：600
```

#### 3. DMARC 记录（可选）

```
类型：TXT
主机记录：_dmarc
值：v=DMARC1; p=none; rua=mailto:admin@mineguai.com
TTL：600
```

#### 4. MX 记录（如果需要接收邮件）

```
类型：MX
主机记录：@
值：mail.mineguai.com
优先级：10
TTL：600
```

### 第四步：重启 Postfix

```bash
sudo systemctl restart postfix
sudo systemctl enable postfix
```

### 第五步：测试发送

```bash
# 测试发送邮件
echo "Test email from server" | mail -s "Test Subject" your@email.com

# 查看邮件队列
mailq

# 查看日志
sudo tail -f /var/log/mail.log
```

### 第六步：更新 API 配置

```bash
cd ~/api
nano .env
```

**修改为：**

```env
# 使用本地 Postfix（不需要密码）
EMAIL_HOST=localhost
EMAIL_PORT=25
EMAIL_USER=noreply@mineguai.com
EMAIL_PASS=
EMAIL_FROM=Code Typing Lab <noreply@mineguai.com>
```

### 第七步：更新 Nodemailer 配置

编辑 `api/services/email.js`：

```javascript
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false, // 本地不需要 SSL
    auth: process.env.EMAIL_PASS ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    } : undefined, // 本地 Postfix 不需要认证
    tls: {
        rejectUnauthorized: false
    }
});
```

---

## ⚠️ 重要提示

### 防止被标记为垃圾邮件

1. **配置反向 DNS（PTR 记录）**
   - 联系你的 VPS 提供商
   - 设置 IP 反向解析到 mail.mineguai.com

2. **配置 SPF 记录**（必须）
   - 告诉收件服务器你的 IP 有权发送邮件

3. **配置 DKIM**（强烈推荐）
   - 邮件签名，提高可信度

4. **使用真实域名**
   - 不要用 no-reply@localhost

5. **避免触发垃圾邮件规则**
   - 不要在短时间内发送大量邮件
   - 邮件内容不要太像广告

### 测试邮件到达率

发送测试邮件到：
- Gmail
- QQ邮箱
- 163邮箱
- Outlook

检查是否进入垃圾箱。

---

## 🔧 故障排查

### 问题1: 邮件发送失败

```bash
# 查看日志
sudo tail -100 /var/log/mail.log

# 查看邮件队列
mailq

# 清空队列
sudo postsuper -d ALL
```

### 问题2: 邮件进入垃圾箱

**检查 SPF 记录：**
```bash
dig TXT mineguai.com +short
```

**检查 DKIM：**
```bash
dig TXT mail._domainkey.mineguai.com +short
```

**在线检测工具：**
- https://mxtoolbox.com/spf.aspx
- https://www.mail-tester.com/

### 问题3: 端口 25 被封

某些云服务商封禁端口 25，使用端口 587：

```bash
sudo nano /etc/postfix/master.cf
```

取消注释 submission 段：
```
submission inet n       -       y       -       -       smtpd
  -o smtpd_tls_security_level=encrypt
```

---

## 🎯 快速开始（最简配置）

如果你只想快速测试，最简单的方式：

```bash
# 1. 安装
sudo apt install postfix

# 2. 配置为 Internet Site

# 3. 添加 SPF 记录
# TXT @ v=spf1 a mx ip4:你的IP ~all

# 4. 测试
echo "Test" | mail -s "Test" your@email.com

# 5. 更新 API 配置使用 localhost:25
```

---

## 💡 其他替代方案

### 使用 Sendmail

```bash
sudo apt install sendmail
```

### 使用 msmtp（更轻量）

```bash
sudo apt install msmtp msmtp-mta

# 配置文件
sudo nano /etc/msmtprc
```

### 使用免费邮件服务

- **Mailgun**: 每月 5000 封免费
- **SendGrid**: 每月 100 封免费
- **Amazon SES**: 每月 62000 封免费（需AWS账号）

---

## ✅ 总结

**最简单的方案：**
1. 安装 Postfix（仅发送模式）
2. 配置 DNS SPF 记录
3. 本地使用不需要密码
4. 完全免费

**需要你做的：**
1. 在 DNS 添加 SPF 记录
2. （可选）配置 DKIM
3. 测试发送到各大邮箱
4. 检查是否进垃圾箱

要我帮你配置吗？告诉我你的域名，我可以生成具体的 DNS 记录值。
