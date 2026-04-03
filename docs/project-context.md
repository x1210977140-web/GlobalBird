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
  api/       后端 API 骨架
  worker/    ETL / 后台任务骨架
packages/
  contracts/ 前后端共享 DTO、schema、错误码
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
- `apps/web` 已有一个可单机试运行版本
- 前端当前不依赖后端，使用本地 mock 数据
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
- 真正的 `/api/v1` 后端联调
- 数据库存储
- GBIF 下载链路
- H3 聚合构建

## 4. 当前前端实现说明

当前前端是“单机可演示版”，目的是先验证主链路和交互，不是最终技术形态。

实现特征：

- 使用 Vue + Vite
- 用 Canvas 绘制球面投影视图
- 使用本地 mock API 模拟后端返回
- 数据结构已经按未来 `/api/v1` 接口风格组织

关键文件：

- `apps/web/src/pages/HomePage.vue`
- `apps/web/src/components/GlobeCanvas.vue`
- `apps/web/src/components/InfoPanel.vue`
- `apps/web/src/core/mock-api.ts`
- `apps/web/src/core/mock-data.ts`

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

当前前端单机版运行方式：

```bash
cd apps/web
npm install
npm run dev -- --host 127.0.0.1
```

访问地址：

```text
http://127.0.0.1:5173/
```

已验证通过的命令：

- `npm install`
- `npm run build`

## 7. 下一步优先级

推荐的后续开发顺序：

1. 继续完善前端体验
   - 球面交互手感
   - 选中态
   - 面板信息层级
   - 更接近最终视觉方向
2. 把 `apps/api` 补成最小可启动服务
   - 先提供 mock 版 `/api/v1`
   - 再逐步替换为真实实现
3. 把前端 mock API 替换成真实 API client
4. 补 `apps/worker`
   - 下载
   - 解压
   - 解析
   - 聚合

## 8. 后续维护要求

后面如果继续长期开发，建议每次做完关键变更后同步更新这个文件，尤其是：

- 范围变化
- 架构变化
- 新增约束
- 已完成阶段
- 下一步重点

这样即使换对话，也能快速恢复项目上下文。
