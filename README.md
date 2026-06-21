
  # 试衣服小程序

  This is a code bundle for 试衣服小程序. The original project is available at https://www.figma.com/design/4I5Qd0dRn1TnM8anb7HFf1/%E8%AF%95%E8%A1%A3%E6%9C%8D%E5%B0%8F%E7%A8%8B%E5%BA%8F.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## 微信小程序版本

  可发布的 Taro + 微信云开发版本位于 [`miniapp/`](./miniapp/README.md)。原 Vite 工程继续作为视觉参考。

  自建服务器后端位于 [`server/`](./server/README.md)，使用 PostgreSQL、Redis、MinIO 和 Docker Compose。

  ## 手机网页版（PWA）

  根目录现为连接真实后端的 React PWA，支持资料上传、服装图/商品链接、异步试穿、历史记录和数据删除。

  ```bash
  npm install
  npm run dev
  ```

  生产环境需将 `/api/*` 反向代理至后端，并通过 HTTPS 提供网页。Nginx 示例位于 [`deploy/nginx.conf`](./deploy/nginx.conf)。
  
