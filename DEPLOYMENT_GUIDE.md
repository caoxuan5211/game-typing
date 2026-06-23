# 🚀 部署指南

## 📋 前置要求

### 本地环境
- Git 已安装
- SSH 密钥已配置（连接服务器）
- Python 或 Node.js（用于本地测试）

### 服务器环境
- 已配置 SSH 别名 `vps1`
- Web 服务器（如 Nginx/Apache）
- 项目路径：`/var/www/html/game-typing`

---

## 🔄 完整部署流程

### 步骤 1: 合并到主分支

当前代码在 `feature/v1.0.0-rewrite` 分支，需要合并到 `main`：

```bash
# 切换到 main 分支
git checkout main

# 合并功能分支
git merge feature/v1.0.0-rewrite

# 推送到远程（需要权限）
git push origin main
```

> ⚠️ **注意**: 如果直接推送到 main 分支受限，请创建 Pull Request：
> 1. 访问: https://github.com/caoxuan5211/game-typing/pulls
> 2. 点击 "New Pull Request"
> 3. 选择 `feature/v1.0.0-rewrite` -> `main`
> 4. 审核并合并

---

### 步骤 2: 部署到服务器

#### 方式一：使用部署脚本（推荐）

```bash
# 确保脚本有执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

脚本会自动完成：
1. ✅ 检查 Git 状态
2. ✅ 提交未保存的更改（可选）
3. ✅ 推送到 GitHub
4. ✅ SSH 连接服务器
5. ✅ 拉取最新代码
6. ✅ 设置文件权限

#### 方式二：手动部署

```bash
# 1. 连接到服务器
ssh vps1

# 2. 进入项目目录
cd /var/www/html/game-typing

# 3. 拉取最新代码
git pull origin main

# 4. 设置权限
chmod -R 755 .

# 5. 退出服务器
exit
```

---

### 步骤 3: 验证部署

#### 检查文件结构

```bash
ssh vps1 "cd /var/www/html/game-typing && ls -la"
```

应该看到：
- index.html
- src/ 目录
- package.json
- README.md
- 等等...

#### 检查版本

```bash
ssh vps1 "cd /var/www/html/game-typing && git log -1 --oneline"
```

应该显示最新的提交信息。

#### 浏览器测试

访问你的域名或服务器IP，例如：
- `http://your-domain.com`
- `http://your-server-ip/game-typing`

测试清单：
- [ ] 页面正常加载
- [ ] 主题切换正常
- [ ] 音效工作
- [ ] 统计保存
- [ ] 所有模式可用
- [ ] 移动端适配

---

## 🔧 Web 服务器配置

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/html/game-typing;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 缓存静态资源
    location ~* \.(css|js|jpg|png|gif|ico|svg)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

应用配置：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Apache 配置示例

在 `/var/www/html/game-typing/.htaccess` 添加：

```apache
# 重写规则
RewriteEngine On
RewriteBase /game-typing/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /game-typing/index.html [L]

# 缓存静态资源
<FilesMatch "\.(css|js|jpg|png|gif|ico|svg)$">
    Header set Cache-Control "max-age=604800, public"
</FilesMatch>

# Gzip 压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

---

## 🎯 快速命令参考

### 本地测试
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# 访问
open http://localhost:8000
```

### 更新服务器
```bash
# 一键部署
./deploy.sh

# 或手动
ssh vps1 "cd /var/www/html/game-typing && git pull"
```

### 查看服务器日志
```bash
# Nginx
ssh vps1 "tail -f /var/log/nginx/access.log"

# Apache
ssh vps1 "tail -f /var/log/apache2/access.log"
```

### 重启 Web 服务器
```bash
# Nginx
ssh vps1 "sudo systemctl restart nginx"

# Apache
ssh vps1 "sudo systemctl restart apache2"
```

---

## ❓ 故障排除

### 问题 1: SSH 连接失败

```bash
# 测试连接
ssh -vvv vps1

# 检查配置
cat ~/.ssh/config
```

### 问题 2: Git 权限问题

```bash
# 检查远程仓库
git remote -v

# 重新配置
git remote set-url origin https://github.com/caoxuan5211/game-typing.git
```

### 问题 3: 文件权限问题

```bash
ssh vps1
cd /var/www/html/game-typing
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

### 问题 4: 页面404

检查：
- Web 服务器配置
- 文件路径是否正确
- index.html 是否存在

### 问题 5: JavaScript 模块加载失败

确保服务器支持 MIME 类型：
```bash
# Nginx
grep "application/javascript" /etc/nginx/mime.types

# Apache
grep "application/javascript" /etc/mime.types
```

---

## 🔄 回滚到之前版本

```bash
ssh vps1 "cd /var/www/html/game-typing && \
  git log --oneline -5 && \
  git checkout <commit-hash> && \
  sudo systemctl reload nginx"
```

---

## 📊 监控和维护

### 性能监控
```bash
# 查看访问量
ssh vps1 "grep 'GET /game-typing' /var/log/nginx/access.log | wc -l"

# 查看错误
ssh vps1 "grep 'ERROR' /var/log/nginx/error.log"
```

### 定期更新
```bash
# 每周运行
./deploy.sh
```

---

## ✅ 部署检查清单

部署前：
- [ ] 所有代码已提交
- [ ] 代码已推送到 GitHub
- [ ] 本地测试通过
- [ ] 文档已更新

部署中：
- [ ] 代码合并到 main
- [ ] 服务器代码已更新
- [ ] 文件权限已设置
- [ ] Web 服务器已重启（如需要）

部署后：
- [ ] 网站可访问
- [ ] 所有功能正常
- [ ] 移动端测试通过
- [ ] 性能达标

---

## 📞 需要帮助？

- GitHub Issues: https://github.com/caoxuan5211/game-typing/issues
- 项目文档: README.md
- 快速指南: QUICKSTART.md

---

**祝部署顺利！ 🎉**
