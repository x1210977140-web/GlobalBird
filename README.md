# GlobalBird

当前仓库已经生成 monorepo 骨架，并实现了一个可单机运行的前端演示版本。

## 目录

```text
apps/
  web/       # Vue + Vite 前端，内置本地 mock 数据
  api/       # REST API 服务骨架
  worker/    # ETL 与后台任务骨架
packages/
  contracts/ # 共享 DTO、schema、错误码
docs/        # 文档目录
```

## 前端单机运行

推荐直接在前端目录运行：

1. `cd apps/web`
2. `npm install`
3. `npm run dev -- --host 127.0.0.1`
4. 打开 `http://127.0.0.1:5173/`

如果你的环境已经装了 `pnpm`，也可以在仓库根目录执行：

1. `pnpm install`
2. `pnpm dev:web`

当前前端版本不依赖后端联调，使用本地 mock API 模拟：

- `/api/v1/cells`
- `/api/v1/cells/{h3}/occurrences`
- `/api/v1/species/{speciesKey}`
- `/api/v1/species/{speciesKey}/media`
- `/api/v1/compliance/downloads/{downloadKey}`

## 后续建议

1. 把 `apps/api` 补成最小可启动的 Fastify 服务
2. 把 `apps/worker` 补成 GBIF 下载与解析链路
3. 把设计文档逐步迁移到 `docs/`
