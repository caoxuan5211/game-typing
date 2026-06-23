# Code Typing Game v1.0.0

专业的代码打字练习工具，提升编程速度和准确性。

## ✨ 特性

- 🎯 **多种练习模式**
  - 代码片段练习
  - 符号练习
  - 混合模式
  - 自定义文本

- 📊 **详细统计**
  - 实时WPM（每分钟单词数）
  - 准确率跟踪
  - 历史记录
  - 高分榜

- 🎨 **丰富主题**
  - 5种精美配色主题
  - 流畅动画效果
  - 响应式设计

- 🔊 **音效反馈**
  - 实时按键反馈
  - 完成音效
  - 成就解锁音效

- 🏆 **成就系统**
  - 速度恶魔
  - 完美主义者
  - 马拉松选手
  - 稳定发挥
  - 夜猫子

## 🚀 快速开始

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/caoxuan5211/game-typing.git
cd game-typing

# 启动开发服务器
npm run dev
# 或使用 Python
python -m http.server 8000

# 浏览器访问
open http://localhost:8000
```

### 部署到服务器

```bash
# 使用部署脚本
./deploy.sh

# 或手动部署
ssh vps1
cd /var/www/html/game-typing
git pull
# 重启web服务器（如果需要）
```

## 📁 项目结构

```
game-typing/
├── index.html              # 主HTML文件
├── src/
│   ├── css/
│   │   ├── main.css       # 主样式
│   │   ├── components.css # 组件样式
│   │   └── animations.css # 动画样式
│   └── js/
│       ├── main.js        # 入口文件
│       ├── game.js        # 游戏核心逻辑
│       ├── data.js        # 练习文本数据
│       ├── ui.js          # UI渲染
│       ├── stats.js       # 统计计算
│       ├── sound.js       # 音效管理
│       ├── storage.js     # 本地存储
│       ├── config.js      # 配置文件
│       └── modal.js       # 模态框管理
├── package.json           # 项目配置
├── deploy.sh             # 部署脚本
└── README.md             # 项目说明
```

## 🎮 使用说明

1. **选择模式**：点击顶部的模式按钮选择练习类型
2. **选择难度**：选择简单、中等或困难难度
3. **开始练习**：点击"开始练习"按钮
4. **输入文本**：根据显示的文本进行输入
5. **查看结果**：完成后查看详细统计数据

### 快捷键

- `Ctrl/Cmd + Enter`: 开始练习
- `ESC`: 暂停/关闭模态框

## 🎨 主题

- 紫罗兰（默认）
- 海洋蓝
- 日落橙
- 森林绿
- 午夜黑

## 📊 统计指标

- **WPM (Words Per Minute)**: 每分钟单词数
- **准确率**: 正确字符占总输入字符的百分比
- **CPM (Characters Per Minute)**: 每分钟字符数
- **稳定性**: 击键准确性，考虑修正次数
- **修正次数**: 回退删除的次数

## 🔧 技术栈

- 原生 JavaScript (ES6+)
- CSS3 (Grid, Flexbox, Animations)
- Web Audio API (音效)
- LocalStorage (数据持久化)

## 📝 版本历史

### v1.0.0 (2024-06-23)
- ✨ 完全重构，模块化架构
- 🎨 新增5种主题
- 📊 增强统计功能
- 🏆 添加成就系统
- 🔊 音效反馈
- 📱 响应式设计优化
- ⚡ 性能优化

### v0.0.1
- 基础打字功能
- 简单统计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

## 👨‍💻 作者

caoxuan5211

## 🔗 链接

- [GitHub仓库](https://github.com/caoxuan5211/game-typing)
- [在线体验](https://your-domain.com) (部署后)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者。
