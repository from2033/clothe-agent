# 智能虚拟试衣微信小程序

这是从仓库内 Vite 移动端原型迁移出的独立 Taro 4 + React + TypeScript 微信小程序工程。原 Web 原型仍保留在仓库根目录。

## 本地运行

1. 在 `miniapp/` 执行 `npm install`。
2. 复制 `project.private.config.json.example` 为 `project.private.config.json`，填写真实 AppID。
3. 执行 `npm run dev:weapp`。
4. 在微信开发者工具中导入 `miniapp/`，小程序目录为 `dist/`，云函数目录为 `cloudfunctions/`。

## 自建 API

小程序已改为调用仓库根目录的 `server/`，不再依赖微信云开发。开发时设置：

```bash
API_BASE_URL=http://局域网可访问的电脑IP:3000 npm run dev:weapp
```

微信开发者工具可在开发阶段关闭合法域名校验；真机和正式版必须使用已备案并配置到微信公众平台的 HTTPS 域名。

## AI Provider

默认 `TRYON_PROVIDER=mock`。服务器 Worker 会创建异步任务并生成带 Mock 水印的结果，用于验证完整业务链路。

生产环境设置：

- `TRYON_PROVIDER`: 服务商标识。
- `AI_CREATE_URL`: 创建异步任务的 HTTPS 地址。
- `AI_STATUS_URL`: 查询任务状态的 HTTPS 地址。
- `AI_API_KEY`: 仅配置在云函数环境变量中。
- `AI_CALLBACK_URL`: 可选；当前客户端仍使用轮询。

通用适配协议：

- 创建接口接收 `person_image_url`、`garment_image_url`、`measurements`，返回 `task_id` 或 `id`。
- 查询接口接收查询参数 `task_id`，返回 `status`，成功时返回 `result_url`、`output.url` 或 `image_url`。

如果目标厂商字段不同，只需调整 `server/src/providers/tryon.ts`，客户端和数据结构无需改变。

使用 `providers.example.json` 创建不提交到版本库的 `providers.local.json`，填入 2–3 家候选服务和固定测试图，然后运行：

```bash
node scripts/evaluate-providers.mjs providers.local.json
```

脚本输出成功率和平均耗时。只有成功率至少 90% 的服务进入质量和单次成本比较。

## 发布前检查

- 将 `project.config.json` 中的游客 AppID 替换为正式 AppID。
- 选定真实 AI 服务商并完成固定测试集评估。
- 在产品隐私页写明服务商、数据处理区域和实际删除周期。
- 在微信公众平台配置并提交《小程序隐私保护指引》。
- 配置合法域名、服务器环境变量、HTTPS、内容安全策略和数据库索引。
- 使用体验版真机验证拍照、相册、保存图片、后台恢复和数据清空。

## 验证

```bash
npm run typecheck
npm test
npm run build:weapp
```
