# 服务器部署完整指南

## 📋 部署步骤总览

1. SSH连接服务器
2. 克隆仓库到服务器
3. 配置Nginx（支持多个子域名）
4. 配置DNS解析
5. 配置HTTPS证书

---

## 1️⃣ 连接到服务器

```bash
ssh vps1
```

---

## 2️⃣ 在服务器上克隆仓库

```bash
# 创建网站根目录（如果不存在）
sudo mkdir -p /var/www

# 克隆仓库
cd /var/www
sudo git clone https://github.com/caoxuan5211/game-typing.git

# 设置权限
sudo chown -R www-data:www-data /var/www/game-typing
sudo chmod -R 755 /var/www/game-typing
```

---

## 3️⃣ 配置Nginx

### 关于多子域名的说明

一个服务器IP可以托管**多个子域名**，每个子域名对应不同的网站。你已经有 `game.mineguai.com`，现在添加 `type.mineguai.com` 完全没问题。

### 创建Nginx配置文件

```bash
sudo nano /etc/nginx/sites-available/type.mineguai.com
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name type.mineguai.com;
    
    root /var/www/game-typing;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json text/plain;
    
    # 缓存静态资源
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 启用站点

```bash
# 创建符号链接启用站点
sudo ln -s /etc/nginx/sites-available/type.mineguai.com /etc/nginx/sites-enabled/

# 测试Nginx配置
sudo nginx -t

# 如果测试通过，重新加载Nginx
sudo systemctl reload nginx
```

---

## 4️⃣ 配置DNS解析

在你的域名管理面板（阿里云、腾讯云、Cloudflare等）添加DNS记录：

```
类型: A
主机记录: type
记录值: [你的服务器IP地址]
TTL: 600（或默认）
```

### 查看服务器IP

如果不确定服务器IP，在服务器上运行：

```bash
curl ifconfig.me
```

### DNS传播时间

- DNS配置后需要等待 **5-30分钟** 才能生效
- 可以用以下命令检查DNS是否生效：

```bash
nslookup type.mineguai.com
# 或
dig type.mineguai.com
```

---

## 5️⃣ 配置HTTPS证书（强烈推荐）

### 安装Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 获取SSL证书

```bash
sudo certbot --nginx -d type.mineguai.com
```

按照提示操作：
1. 输入邮箱地址
2. 同意服务条款
3. 选择是否重定向HTTP到HTTPS（推荐选择2自动重定向）

### 自动续期

Certbot会自动配置续期任务。检查续期配置：

```bash
sudo certbot renew --dry-run
```

---

## 6️⃣ 验证部署

### 检查Nginx状态

```bash
sudo systemctl status nginx
```

### 检查网站访问

在浏览器中访问：
- HTTP: `http://type.mineguai.com`
- HTTPS: `https://type.mineguai.com` （配置SSL后）

---

## 🔄 更新网站

当你更新代码后，在服务器上运行：

```bash
cd /var/www/game-typing
sudo git pull origin main
```

无需重启Nginx，刷新浏览器即可看到更新。

---

## 🐛 故障排查

### 问题1：无法访问网站

```bash
# 检查Nginx是否运行
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 问题2：DNS未生效

```bash
# 检查DNS解析
nslookup type.mineguai.com

# 清除本地DNS缓存（在你的电脑上，不是服务器）
# Windows:
ipconfig /flushdns

# Mac/Linux:
sudo dscacheutil -flushcache
```

### 问题3：文件权限错误

```bash
# 重新设置权限
sudo chown -R www-data:www-data /var/www/game-typing
sudo chmod -R 755 /var/www/game-typing
```

---

## 📊 查看访问日志

```bash
# 实时查看访问日志
sudo tail -f /var/log/nginx/access.log

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 关于多子域名的补充说明

你提到担心服务器IP已经被 `game.mineguai.com` 使用了，这完全不是问题！

### 一个IP可以托管多个子域名

一个服务器IP地址可以托管**无数个**子域名，原理如下：

1. **DNS解析**：`game.mineguai.com` 和 `type.mineguai.com` 都解析到同一个IP
2. **Nginx虚拟主机**：Nginx通过 `server_name` 区分不同的域名
3. **请求分发**：当浏览器访问不同域名时，Nginx根据域名分发到不同的目录

### 你的服务器配置

```
服务器IP: xxx.xxx.xxx.xxx
    ├── game.mineguai.com  → /var/www/game-old (或其他目录)
    └── type.mineguai.com  → /var/www/game-typing
```

两个域名指向同一个IP，但Nginx会根据 `server_name` 返回不同的内容。

### 不需要给服务器加前缀

服务器不需要任何改动或前缀，只需要：
1. DNS添加新的A记录指向同一个IP
2. Nginx添加新的虚拟主机配置

就这么简单！

---

## ✅ 快速部署命令汇总

在服务器上依次执行：

```bash
# 1. 克隆仓库
cd /var/www
sudo git clone https://github.com/caoxuan5211/game-typing.git
sudo chown -R www-data:www-data game-typing

# 2. 创建Nginx配置
sudo nano /etc/nginx/sites-available/type.mineguai.com
# （粘贴上面的Nginx配置）

# 3. 启用站点
sudo ln -s /etc/nginx/sites-available/type.mineguai.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. 配置HTTPS
sudo certbot --nginx -d type.mineguai.com
```

完成！🎉
