# Super System Chat

一个灵感来自 QQ 的极简即时通讯应用，使用 Node.js 原生模块构建后端，前端基于原生 HTML/CSS/JavaScript 实现。项目通过 Server-Sent Events (SSE) 实现实时群聊功能，无需额外依赖即可运行在受限环境中。

## 功能特点

- 📡 **实时群聊**：所有连接的用户都会即时收到新消息。
- 💬 **昵称身份**：支持设置和修改昵称，自动保存到本地浏览器。
- 🕒 **历史记录**：新连接的用户会自动加载最近消息。
- 🧭 **状态提示**：清晰的在线/离线状态指示与错误反馈。
- 🧱 **零依赖部署**：后端只使用 Node.js 内置模块，适合网络受限环境。

## 快速开始

1. 安装依赖（本项目不需要额外 npm 依赖）。
2. 启动服务：

   ```bash
   npm start
   ```

3. 打开浏览器访问 [http://localhost:3000](http://localhost:3000) 开始聊天。

如果需要在开发时自动重载，可以运行：

```bash
npm run dev
```

> `npm run dev` 使用 Node.js 自带的 `--watch` 功能，如果本地 Node 版本不支持，可改用其他热重载方案。

## 项目结构

```
.
├── public
│   ├── app.js         # 前端逻辑（SSE 连接、UI 交互、昵称管理等）
│   ├── index.html     # 前端页面模板
│   └── styles.css     # 页面样式
├── server.js          # Node.js 原生 HTTP 服务与 SSE 消息推送
├── package.json       # 项目脚本配置
└── README.md
```

## 技术说明

- 使用 HTTP 长连接 + Server-Sent Events 推送消息，避免 WebSocket 依赖。
- 消息在内存中保存最近 200 条，可根据需要调整 `MAX_MESSAGES` 常量。
- 所有请求和响应均采用 UTF-8 编码，支持中文聊天内容。
- 提供 `/health` 探针接口便于监控与部署。

## 许可证

本项目基于 [MIT License](./LICENSE) 授权（如无单独 LICENSE，可根据需要调整许可说明）。
