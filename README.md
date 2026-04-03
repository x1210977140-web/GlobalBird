# GlobalBird

当前仓库已经完成一条“本地联调”主链路：

- `apps/web` 前端通过 HTTP 调用本地 `apps/api`
- `apps/api` 提供 Fastify mock API
- `packages/contracts` 提供前后端共享 DTO 与错误结构

当前仍然是开发态演示实现，不包含真实数据库、GBIF 下载链路或 H3/bbox 在线查询。

## 目录

```text
apps/
  web/       # Vue + Vite 前端，调用本地 API 联调
  api/       # Fastify mock API 服务
  worker/    # ETL 与后台任务骨架
packages/
  contracts/ # 共享 DTO、错误码、错误响应结构
docs/        # 文档目录
```

## 当前已完成

- 前后端共享 DTO 已建立
- `apps/api` 已提供本地联调接口：
  - `/api/v1/health`
  - `/api/v1/cells`
  - `/api/v1/cells/{h3}/occurrences`
  - `/api/v1/species/{speciesKey}`
  - `/api/v1/species/{speciesKey}/media`
  - `/api/v1/compliance/downloads/{downloadKey}`
- `apps/web` 已从本地函数 mock 切换为 HTTP API client

## 本地运行

默认以根目录 `pnpm workspace` 运行。需要本机已安装 `pnpm` 10。
如果当前机器还没装 `pnpm`，可以先用 `npx --yes pnpm@10.0.0 install` 完成首次依赖安装。

1. `pnpm install`
2. 启动 API：`pnpm dev:api`
3. 新开一个终端，启动前端：`pnpm dev:web`
4. 打开 `http://127.0.0.1:5173/`

默认端口：

- Web: `127.0.0.1:5173`
- API: `127.0.0.1:3000`

如果 `5173` 已被占用，前端现在会直接启动失败，不会再静默切到别的端口。

开发态前端通过 Vite 代理把 `/api/*` 转发到本地 API 服务。

## 当前不包含

- 真实 `bbox` / `h3Res` 查询参数
- 分页 cursor
- 数据库与缓存
- GBIF 下载、解析、聚合 worker
- Three.js 正式场景
- signed-url、音频、AI

## 后续建议

1. 实现 `apps/worker` 的 GBIF 下载、解析和聚合链路
2. 将 `/api/v1/cells` 扩展为真实 `bbox` / `h3Res` 查询模型
3. 将 API mock 数据替换为数据库与真实聚合结果
4. 在联调稳定后推进 Three.js 正式场景
