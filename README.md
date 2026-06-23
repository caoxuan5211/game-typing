# Code Typing Game - 代码打字练习游戏

一个专门用于练习编程符号和代码片段打字速度的网页游戏。

## 功能特性

- 🎯 **代码片段模式** - 真实的代码片段练习
- 🔣 **符号练习模式** - 专注于编程符号 `(){}[]<>;:,."'/\|` 等
- 🎲 **混合模式** - 代码和注释混合练习
- ⚡ **实时统计** - WPM速度、准确率、计时器
- 🎨 **现代UI设计** - 简洁优雅的界面
- 📱 **响应式设计** - 支持移动端和桌面端

## 本地运行

直接在浏览器中打开 `index.html` 即可，无需安装任何依赖。

```bash
# 或使用简单的HTTP服务器
python -m http.server 8000
# 或
npx serve
```

然后访问 `http://localhost:8000`

## 部署到服务器

### 1. 克隆仓库到服务器

```bash
# SSH连接到服务器
ssh vps1

# 克隆仓库
cd /var/www
git clone https://github.com/caoxuan5211/game-typing.git
cd game-typing
```

### 2. 配置Nginx

创建Nginx配置文件 `/etc/nginx/sites-available/type.mineguai.com`:

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
    gzip_types text/css application/javascript application/json;
    
    # 缓存静态资源
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点并重启Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/type.mineguai.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置DNS

在你的域名管理面板添加A记录：

```
类型: A
主机记录: type
记录值: [你的服务器IP]
TTL: 600
```

### 4. 配置HTTPS（推荐）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d type.mineguai.com
```

## 技术栈

- 纯HTML/CSS/JavaScript
- 无框架依赖
- 使用现代CSS Grid和Flexbox布局
- 响应式设计

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
