# GlobalBird 项目长期上下文

## 1. 项目定位

GlobalBird 是一个以鸟类观测数据为核心的 Web 可视化项目。

当前阶段目标不是一次性完成“完整产品”，而是先把 `V1` 主链路做通：

- 3D / 球面可视化主视图
- 聚合 cell 展示
- cell 明细面板
- 物种详情
- 图片媒体展示
- 合规与引用信息展示

明确不在 `V1` 范围内的内容：

- AI 对话
- 音频播放
- 视频媒体
- GraphQL
- 移动端高性能适配

## 2. 当前仓库结构

当前仓库采用 monorepo 结构：

```text
apps/
  web/       前端应用（Vue + Vite）
  api/       本地联调用 Fastify mock API
  worker/    ETL / 后台任务骨架
packages/
  contracts/ 前后端共享 DTO、错误码、错误响应结构
docs/
  项目文档与长期上下文
```

关键目录职责：

- `apps/web`：前端 UI、球面交互、筛选、详情面板、媒体展示
- `apps/api`：未来承接 `/api/v1/*` 在线接口
- `apps/worker`：未来承接 GBIF 下载、DWCA 解析、H3 聚合、媒体处理
- `packages/contracts`：前后端共享类型和契约

## 3. 当前开发状态

当前已经完成的内容：

- monorepo 基础骨架已生成
- `apps/web` 已切换为通过 HTTP 调用本地 `apps/api`
- `apps/api` 已提供最小可启动的 Fastify mock 服务
- `packages/contracts` 已提供前后端共享 DTO、错误码和错误响应结构
- 已完成基础交互：
  - 球面画布视图
  - 横向 / 纵向拖动旋转
  - 缩放
  - cell 点击
  - 详情面板
  - 物种信息
  - 图片媒体
  - 合规信息

当前还未完成的内容：

- 真正的 Three.js 场景
- 真实 `bbox` / `h3Res` 查询参数
- 数据库存储与缓存
- GBIF 下载链路
- H3 聚合构建
- worker 主链路

## 4. 当前前端实现说明

当前前端是“本地 API 联调版”，目的是先验证 HTTP 契约、主链路和交互，不是最终技术形态。

实现特征：

- 使用 Vue + Vite
- 用 Canvas 绘制球面投影视图
- 前端通过 `fetch` 调用本地 `/api/v1`
- 本地 API 由 Fastify + 内存 mock repository 提供
- 数据结构由 `packages/contracts` 统一提供

关键文件：

- `apps/web/src/pages/HomePage.vue`
- `apps/web/src/components/GlobeCanvas.vue`
- `apps/web/src/components/InfoPanel.vue`
- `apps/web/src/core/api-client.ts`
- `apps/api/src/routes/api-v1.ts`
- `apps/api/src/mock/repository.ts`
- `packages/contracts/src/dto/api.ts`

## 5. 当前约定

### 文档约定

- 后续新增和修改的文档默认使用中文

### 架构约定

- 前后端代码分目录，不混写
- worker 不混进 api
- 共享契约统一放在 `packages/contracts`

### 接口约定

未来正式联调以 `/api/v1` 为准，核心接口目标包括：

- `/api/v1/cells`
- `/api/v1/cells/{h3}/occurrences`
- `/api/v1/species/{speciesKey}`
- `/api/v1/species/{speciesKey}/media`
- `/api/v1/compliance/downloads/{downloadKey}`

`/api/v1/media/{mediaId}/signed-url` 只有在鉴权和媒体镜像策略明确后才启用。

### 媒体约定

`V1` 只处理图片媒体。

媒体分发策略采用：

- allowlist 镜像
- 来源链接兜底

如果来源许可、用途边界、归属字段不明确，则不默认镜像到自有存储。

## 6. 本地运行方式

当前联调版运行方式：

```bash
pnpm install
pnpm dev:api
pnpm dev:web
```

访问地址与端口：

```text
Web: http://127.0.0.1:5173/
API: http://127.0.0.1:3000/api/v1/health
```

说明：

- 前端开发服务器固定绑定 `127.0.0.1:5173`
- 如果 `5173` 已被占用，会直接报错，不会静默切到其他端口

本次已验证的检查项：

- `contracts` TypeScript typecheck 通过
- `api` TypeScript typecheck 通过
- `web` TypeScript typecheck 与 `vite build` 通过
- 使用 Fastify `inject()` 验证了 `200 / 400 / 404` 基本接口行为

说明：

- 当前实现环境未预装全局 `pnpm`
- 依赖已通过 `npx --yes pnpm@10.0.0 install` 完成初始化
- 日常运行方式仍以 `pnpm workspace` 为准

## 7. 下一步优先级

推荐的后续开发顺序：

1. 补 `apps/worker`
   - 下载
   - 解压
   - 解析
   - 聚合
2. 将 `apps/api` 的 mock repository 替换为真实数据访问层
   - 引入数据库
   - 实现真实 `bbox` / `h3Res`
   - 补缓存与分页
3. 在真实 API 稳定后，再推进 Three.js 正式场景

## 8. 后续维护要求

后面如果继续长期开发，建议每次做完关键变更后同步更新这个文件，尤其是：

- 范围变化
- 架构变化
- 新增约束
- 已完成阶段
- 下一步重点

这样即使换对话，也能快速恢复项目上下文。
