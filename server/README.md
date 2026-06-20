# 自建服务器后端

技术栈：Fastify、PostgreSQL、Prisma、Redis/BullMQ、MinIO、Docker Compose。

## 本地开发

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

另开终端启动任务 Worker：

```bash
npm run worker
```

本地需要 PostgreSQL、Redis 和 MinIO。也可以在仓库根目录使用 Docker Compose。

## Docker 部署

1. 复制 `server/.env.docker.example` 为 `server/.env`。
2. 修改数据库密码、MinIO 密钥、JWT 密钥、域名和微信 AppSecret。
3. 在仓库根目录执行：

```bash
docker compose up -d --build
```

API 默认监听 `3000`，MinIO 控制台映射到 `9001`。生产环境应由 Nginx/Caddy 提供 HTTPS，只将 API 暴露给公网，不要暴露 PostgreSQL、Redis 和 MinIO API。

## 微信登录

- 开发构建可设置 `ALLOW_DEV_LOGIN=true`，客户端使用本地设备 ID 创建测试账号。
- 生产构建必须设置 `ALLOW_DEV_LOGIN=false`，并配置 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`。
- 小程序的 request/uploadFile 合法域名必须添加你的 HTTPS API 域名。

## AI Provider

`TRYON_PROVIDER=mock` 会在约 5 秒后生成带 Mock 水印的结果，便于演示完整异步链路。

生产环境默认推荐阿里云百炼 AI 试衣：

```env
TRYON_PROVIDER=aliyun
DASHSCOPE_API_KEY=sk-你的北京地域API-Key
ALIYUN_TRYON_MODEL=aitryon
```

- `aitryon` 为基础版；如需更清晰的纹理和 Logo 还原，可改为 `aitryon-plus`。
- API Key 必须来自阿里云百炼中国内地（北京）地域。
- 人像和服装签名 URL 必须能被阿里云公网访问。
- 当前商品数据未记录服装品类，统一按上装/连衣裙提交。若要准确支持裤子、半裙等下装，需要增加品类字段并提交为 `bottom_garment_url`。

其他遵循通用“创建任务 + 查询状态”协议的服务仍可设置：

- `TRYON_PROVIDER`: 自定义服务商标识。
- `AI_CREATE_URL`: 创建异步任务地址。
- `AI_STATUS_URL`: 查询任务状态地址。
- `AI_API_KEY`: 服务密钥。

Claude 的密钥预留为 `ANTHROPIC_API_KEY`，适合后续增加图片质量检测、服装分类和搭配建议；真正的换装图片仍由专用试衣模型生成。

## API

- `POST /api/auth/wechat`
- `POST /api/auth/dev`
- `POST /api/files/profile-photo`
- `GET|PUT /api/profile`
- `POST /api/products/parse`
- `GET|POST /api/tasks`
- `GET|DELETE /api/tasks/:id`
- `DELETE /api/user/data`
- `GET /health`
