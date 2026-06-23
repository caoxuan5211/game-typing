# Code Typing Lab

面向程序员的代码打字训练游戏，重点训练代码片段、符号密集输入、长段节奏和真实缩进。

## 当前版本

v2.0.0 是一次完整重做：

- 单屏训练台：设置、目标文本、输入区、反馈和成绩都在同一屏。
- 键盘优先：`Enter` 开始、继续、下一题；`Esc` 暂停；输入区里的 `Tab` 插入真实缩进。
- 训练激励：实时 WPM、准确率、连击、评级、今日字符目标、历史成绩。
- 错误复盘：错误键位热区会标出当前训练的弱项。
- 可靠主题：主题切换统一走 `data-theme` token，避免旧版换色异常。
- 本地持久化：成绩、今日目标、连续天数、自定义文本和主题会保存到 LocalStorage。

## 本地运行

```bash
npm run dev
```

然后打开：

```text
http://localhost:8000
```

## 部署

项目是静态站点。线上域名：

```text
https://type.mineguai.com
```

服务器入口：

```bash
ssh vps1
```

常规部署流程是提交并推送代码，然后在服务器站点目录拉取最新版本。

## 技术栈

- 原生 JavaScript ES modules
- CSS custom properties / OKLCH tokens
- LocalStorage
- Web Audio API
- 静态 HTML 托管
