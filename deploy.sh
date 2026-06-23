#!/bin/bash

# 部署脚本 - Code Typing Game v1.0.0
# 用于将项目部署到远程服务器

set -e

echo "🚀 开始部署 Code Typing Game..."

# 配置
REMOTE_HOST="vps1"
REMOTE_PATH="/var/www/html/game-typing"
BRANCH="main"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查git状态
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  检测到未提交的更改${NC}"
    read -p "是否继续部署? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ 部署已取消${NC}"
        exit 1
    fi
fi

# 提交更改（可选）
echo -e "${YELLOW}📝 准备提交更改...${NC}"
read -p "输入提交信息 (留空跳过): " commit_msg

if [[ -n "$commit_msg" ]]; then
    git add .
    git commit -m "$commit_msg"
    echo -e "${GREEN}✅ 更改已提交${NC}"
fi

# 推送到远程仓库
echo -e "${YELLOW}📤 推送到 GitHub...${NC}"
git push origin $BRANCH

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ 推送成功${NC}"
else
    echo -e "${RED}❌ 推送失败${NC}"
    exit 1
fi

# 部署到服务器
echo -e "${YELLOW}🔄 连接到服务器并更新...${NC}"

ssh $REMOTE_HOST << EOF
    set -e

    echo "📂 进入项目目录..."
    cd $REMOTE_PATH || exit 1

    echo "🔄 拉取最新代码..."
    git pull origin $BRANCH

    echo "🔧 设置文件权限..."
    chmod -R 755 .

    echo "✅ 部署完成!"

    echo "📊 当前版本信息:"
    git log -1 --pretty=format:"%h - %s (%cr)" --abbrev-commit
EOF

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}🎉 部署成功!${NC}"
    echo -e "访问: ${GREEN}http://your-domain.com${NC}"
else
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi

echo -e "${GREEN}✨ 所有操作完成!${NC}"
