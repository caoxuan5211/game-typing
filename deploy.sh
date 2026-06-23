#!/bin/bash

# 部署脚本 - 在服务器上运行

set -e

echo "🚀 开始部署 Code Typing Game..."

# 检查是否在服务器上
if [ ! -d "/var/www" ]; then
    echo "❌ 错误：这个脚本应该在服务器上运行"
    exit 1
fi

# 设置变量
DOMAIN="type.mineguai.com"
APP_DIR="/var/www/game-typing"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"

# 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p $APP_DIR

# 克隆或更新仓库
if [ -d "$APP_DIR/.git" ]; then
    echo "🔄 更新现有仓库..."
    cd $APP_DIR
    sudo git pull origin main
else
    echo "📥 克隆仓库..."
    sudo git clone https://github.com/caoxuan5211/game-typing.git $APP_DIR
fi

# 设置权限
echo "🔐 设置文件权限..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# 创建Nginx配置
echo "⚙️  创建Nginx配置..."
sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $APP_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
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
EOF

# 启用站点
echo "✅ 启用Nginx站点..."
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# 测试Nginx配置
echo "🔍 测试Nginx配置..."
sudo nginx -t

# 重启Nginx
echo "🔄 重启Nginx..."
sudo systemctl reload nginx

echo ""
echo "✨ 部署完成！"
echo ""
echo "📝 后续步骤："
echo "1. 确保DNS已配置："
echo "   类型: A"
echo "   主机记录: type"
echo "   记录值: $(curl -s ifconfig.me)"
echo ""
echo "2. 配置HTTPS证书（推荐）："
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "3. 访问你的网站："
echo "   http://$DOMAIN"
echo ""
