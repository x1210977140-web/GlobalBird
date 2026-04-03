# GlobalBird 国内 ECS + 家里电脑同步行动路线

## 1. 结论先说

当前阶段我不建议把前端也一起放到云端。

技术上更合理的方案是：

- 前端继续留在本机开发
- 后端放到单台中国大陆阿里云 ECS
- 家里电脑只负责下载、整理和同步静态数据包
- ECS 上用 Docker Compose 跑 `nginx + api + worker + postgres + redis`

理由不是“省事”，而是当前仓库的技术现实决定的：

1. `apps/web` 现在是典型的本地 Vite 开发流，核心价值是 HMR 和高频 UI 调试，而不是远程托管。
2. `apps/web/vite.config.ts` 当前就是本地 `5173 -> 127.0.0.1:3000` 代理模型，最小改动路线是把代理目标改成 ECS，而不是把整个前端部署流也一起搬走。
3. 当前后端还处在 `mock API -> 真 worker/DB` 的切换期，后端部署形态会频繁变化；如果此时把前端也上云，会把两套发布节奏耦合在一起。
4. 你现在又明确说“暂时不要域名，但未来会用”，这意味着如果今天把前端也上云，大概率只能先走 `IP + HTTP` 的临时形态，过一阵还要再经历一次“域名 + HTTPS + 静态资源分发”的迁移，价值不高。
5. 单台 ECS 的资源应该优先让给 API、Worker、Postgres 和 Redis，不应该优先消耗在前端开发服务器上。
6. 你对外网资源的主要难点是“获取”，不是“服务”。把采集动作放在家里电脑，把服务动作放在国内 ECS，职责划分更清晰，也更便宜。

因此，当前最优拓扑不是“前后端都上云”，而是：

```text
本机浏览器
  -> 本机 Vite Dev Server (127.0.0.1:5173)
  -> Vite 代理 /api 到 ECS 公网 IP:80
  -> ECS Nginx
  -> ECS 内部 api:3000
  -> ECS 内部 postgres:5432 / redis:6379

家里电脑
  -> 下载/整理外部资源
  -> 通过 SSH / rsync / Tailscale 同步到 ECS
  -> ECS 本地磁盘
  -> worker 导入 Postgres

worker 仅在 ECS 内部运行，不对公网暴露
```

## 2. 当前阶段目标

这份路线文档只覆盖当前阶段的目标：

- 让后端最小骨架稳定跑在阿里云单机 ECS
- 让本地前端可以稳定连到 ECS 上的 API
- 让家里电脑成为“数据同步节点”，而不是“线上源站”
- 为后续真实 worker、DB schema、数据导入和正式域名切换留好结构

这份文档不追求一步到位解决：

- 正式生产高可用
- RDS / Tair 拆分
- 域名和 HTTPS
- OSS + CDN 静态前端分发

这些后面都会做，但不应该阻塞当前阶段。

## 3. 推荐部署形态

### 3.1 当前推荐

当前阶段推荐单机 ECS 跑 5 个服务：

- `nginx`
- `api`
- `worker`
- `postgres`
- `redis`

其中：

- 对公网只暴露 `80`
- `3000`、`5432`、`6379` 不对公网开放
- `worker` 不开公网端口

### 3.2 数据获取方式

当前阶段的数据获取方式不要设计成：

- ECS 运行时穿透回家里电脑取文件
- ECS 每次导入都依赖家庭网络在线可用

正确路线是单向同步：

```text
家里电脑
  -> 产出数据快照
  -> 上传到 ECS 指定目录
  -> ECS worker 从本地目录导入
```

也就是说：

- 家里电脑是采集机
- ECS 是服务机
- ECS 不把家里电脑当运行时依赖

### 3.3 为什么要加 nginx

不要把 `api:3000` 直接暴露到公网。

当前阶段加一层 `nginx` 的价值很高：

- 只开放 `80`，减少公网暴露面
- 后面切域名和 HTTPS 时，不需要改 API 应用本身，只改入口层
- 本机前端只需要代理到一个稳定入口：`http://<ecs-ip>/api`
- 以后如果要加静态前端、健康检查、限流、访问日志，也能继续复用

## 4. 前端到底该留本机还是上云

我的明确建议：**现在继续留本机**。

### 4.1 现在不建议上云的原因

- 前端现在本质上还是“开发环境”，不是“可长期托管的产物环境”。
- 你当前没有域名，也没有 HTTPS；前端上云后，访问路径会先变成 `http://公网IP`，很快又要再迁到域名。
- 当前前端最需要的是快速改 UI、快速联调，不是远程分发。
- 后端才是现在的核心瓶颈。真正的未知数在 worker、DB schema、导入链路、API 数据层，不在前端托管。

### 4.2 什么时候再把前端放云上

满足下面 4 条中的至少 3 条时，再迁前端更合理：

- API 路径和返回结构基本稳定
- 已经准备好域名
- 已经准备好 HTTPS 证书
- 需要给非开发人员做远程演示或验收

### 4.3 到那时怎么放更合理

到“前端也上云”的阶段，推荐顺序是：

1. 先把前端构建产物挂到 ECS 上的 `nginx`
2. 再迁移到 `OSS + CDN`
3. 域名和 HTTPS 稳定后，再做静态资源加速和缓存优化

不要把长期方案定成“云上跑 Vite dev server”。

## 5. 云资源建议

### 5.1 ECS 规格

当前阶段建议：

- CPU：`2 vCPU` 起步，最好 `4 vCPU`
- 内存：`4 GiB` 起步，最好 `8 GiB`
- 系统盘：`40-80 GiB`
- 操作系统：Ubuntu 22.04 LTS 或 Debian 12

如果你要在这台机器上同时跑：

- `postgres`
- `redis`
- `worker`
- 少量导入任务

那我更建议直接上 `4 vCPU / 8 GiB`，避免很快被导入和构建挤爆。

### 5.2 地域选择

既然你已经决定采用“国内 ECS + 家里电脑同步”，那当前推荐就是直接使用中国大陆 ECS。

这样做的前提是：

- 外部资源抓取主要由家里电脑承担
- 国内 ECS 主要承担导入、查询和对外服务
- 未来要上域名时，提前进入 ICP 备案流程

这条路线在成本上更合理，但要接受两个现实：

1. 未来正式通过域名对外提供网站或 API 时，需要走 ICP 备案。
2. 国内 ECS 不应该承担“强依赖外网抓取”的职责，否则稳定性会变差。

所以这里的关键不是“国内 ECS 能不能用”，而是“不要把外网采集职责放在国内 ECS 身上”。

## 6. 安全组与端口策略

根据阿里云官方文档，安全组默认是状态化规则系统，且官方明确建议按最小权限原则配置，不要在高风险场景直接放开 `0.0.0.0/0`。因此当前阶段建议这样配：

### 6.1 入站规则

| 端口 | 来源 | 是否开放 | 说明 |
|---|---|---|---|
| `22` | 你的固定公网 IP | 是 | SSH 管理 |
| `80` | 你的公网 IP；需要外部联调时可临时放宽 | 是 | Nginx 入口 |
| `443` | 暂不开 | 否 | 等域名和证书后再开 |
| `3000` | 不开公网 | 否 | API 只允许内网和容器网络访问 |
| `5432` | 不开公网 | 否 | Postgres 禁止公网直连 |
| `6379` | 不开公网 | 否 | Redis 禁止公网直连 |

### 6.2 出站规则

- 默认允许即可
- 后续如果要做更严安全策略，再对白名单域名/网络做收敛

### 6.3 原则

- 不要为了“方便调试”直接暴露 `5432`、`6379`
- 不要直接暴露 `3000`
- 所有公网流量都应该先经过 `nginx`

## 7. ECS 首次初始化路线

### 7.1 基础操作系统初始化

拿到 ECS 后，先做这几件事：

1. 创建普通部署用户，例如 `deploy`
2. 配置 SSH 公钥登录
3. 关闭 root 直登
4. 更新系统软件包
5. 安装 Docker Engine 和 Docker Compose Plugin
6. 创建部署目录

建议目录：

```text
/opt/globalbird/
  app/          # 仓库代码
  data/         # 持久化数据
  logs/         # 可选日志目录
  env/          # 环境变量文件
```

### 7.2 数据持久化目录

建议至少规划两个持久化目录：

```text
/opt/globalbird/data/postgres
/opt/globalbird/data/redis
```

如果后面要同步数据包和导入中间产物，再加：

```text
/opt/globalbird/data/worker
/opt/globalbird/data/inbox
/opt/globalbird/data/archive
/opt/globalbird/data/releases
```

## 8. 仓库内需要新增的内容

为了让“本机前端 + ECS 后端”模式顺利跑起来，仓库内建议按下面顺序补齐。

### 8.1 第 1 批：部署骨架

- `deploy/ecs/docker-compose.yml`
- `deploy/ecs/nginx/default.conf`
- `deploy/ecs/.env.example`
- `infra/sql/001_init.sql`
- `docs/阿里云ECS单机后端行动路线.md`
- `docs/家里电脑同步数据包约定.md`

### 8.2 第 2 批：应用配置

- `apps/api` 支持从环境变量读取：
  - `HOST`
  - `PORT`
  - `DATABASE_URL`
  - `REDIS_URL`
- `apps/worker` 支持从环境变量读取：
  - `DATABASE_URL`
  - `REDIS_URL`
  - `GBIF_USERNAME`
  - `GBIF_PASSWORD`
- `apps/web/vite.config.ts` 支持从环境变量读取 API 代理目标，例如：
  - `VITE_API_PROXY_TARGET=http://<ecs-ip>`

### 8.3 第 3 批：部署脚本

- `scripts/deploy-ecs.sh`
- `scripts/migrate.sh`
- `scripts/backup-postgres.sh`
- `scripts/import-release.sh`
- `scripts/push-release.sh`

当前阶段不是必须一次全做完，但方向应该是这个。

## 9. 推荐的 Compose 结构

建议 ECS 上最终先落这样的 Compose 拓扑：

```yaml
services:
  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      HOST: 0.0.0.0
      PORT: 3000
      DATABASE_URL: postgresql://globalbird:***@postgres:5432/globalbird
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    environment:
      DATABASE_URL: postgresql://globalbird:***@postgres:5432/globalbird
      REDIS_URL: redis://redis:6379
      GBIF_USERNAME: ${GBIF_USERNAME}
      GBIF_PASSWORD: ${GBIF_PASSWORD}
      IMPORT_MODE: local-release
    depends_on:
      - postgres
      - redis
    volumes:
      - /opt/globalbird/data/inbox:/data/inbox
      - /opt/globalbird/data/archive:/data/archive
      - /opt/globalbird/data/releases:/data/releases

  postgres:
    image: postgis/postgis:18-3.6
    environment:
      POSTGRES_DB: globalbird
      POSTGRES_USER: globalbird
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - /opt/globalbird/data/postgres:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - /opt/globalbird/data/redis:/data
```

说明：

- `postgres` 和 `redis` 不映射公网端口
- `api` 也不直接映射公网端口
- `nginx` 才是唯一公网入口

## 10. 第一次上线的正确顺序

### 阶段 A：先把“机器”准备好

完成标准：

- 能 SSH 登录
- 安全组已配置
- Docker / Compose 可用
- 目录结构已创建

### 阶段 B：先把“容器框架”跑起来

完成标准：

- `nginx` 可以启动
- `postgres` 数据卷持久化正常
- `redis` 持久化正常
- `api` 能启动并对内监听
- `worker` 能启动并打印健康日志

### 阶段 C：再把“数据库骨架”打进去

完成标准：

- `gbs` schema 创建成功
- `postgis`、`pg_trgm` 启用成功
- 核心表建表成功

当前阶段最小推荐表：

- `gbs.download`
- `gbs.occurrence_staging`
- `gbs.species`
- `gbs.occurrence`
- `gbs.h3_index`
- `gbs.h3_agg`

### 阶段 D：再把“同步链路”打通

完成标准：

- 家里电脑能产出一份版本化数据包
- 数据包能被上传到 ECS 的 `inbox` 目录
- ECS worker 能从本地目录读取并导入
- 导入完成后，数据包可归档到 `archive`

推荐目录语义：

```text
/opt/globalbird/data/inbox
  待导入数据包

/opt/globalbird/data/archive
  已导入归档

/opt/globalbird/data/releases
  当前保留的版本化快照
```

### 阶段 E：再接本机前端

完成标准：

- 本机 `apps/web` 可以通过 Vite 代理访问 ECS 上的 `/api/v1`
- 页面打开后，所有 API 请求都走 ECS
- 不需要在浏览器里直接配置 CORS

这里的关键点是：

- 不要让浏览器直接请求 `http://<ecs-ip>:3000`
- 应该让本机 Vite 继续代理 `/api`
- 只是把代理目标从 `127.0.0.1:3000` 改为 `http://<ecs-ip>`

这样你仍然保留本地前端开发体验，同时后端已经切到远程。

## 11. 家里电脑同步策略

### 11.1 允许的形态

当前阶段允许：

- 家里电脑下载外部资源
- 家里电脑整理成静态快照
- 家里电脑用 `rsync`、`scp`、`sftp` 或 Tailscale SSH 推送到 ECS
- ECS 从本地目录导入

### 11.2 不建议的形态

不建议：

- 线上 API 请求到来时，ECS 再实时回源你家里电脑
- 把家里电脑通过公开隧道直接暴露成线上资源服务器
- 把家庭网络稳定性变成线上 SLA 的一部分

### 11.3 推荐的数据包约定

如果数据包总量不大，建议统一做“版本化发布包”。

推荐目录结构：

```text
release-YYYYMMDD-HHMM/
  manifest.json
  birds.sqlite
  media/
  source/
```

其中：

- `manifest.json` 记录版本号、生成时间、数据来源、记录数、文件 hash
- `birds.sqlite` 作为小规模静态快照
- `media/` 放允许随包同步的静态资源
- `source/` 放原始压缩包或中间文件

如果后面仍然要保留 GBIF 主链路，也可以把 `birds.sqlite` 替换成：

- `dwca.zip`
- `occurrence.txt`
- `multimedia.txt`
- `citations.txt`
- `rights.txt`

### 11.4 推荐的同步方式

优先级建议：

1. `rsync + SSH`
2. `scp/sftp`
3. `Tailscale SSH`

不建议把“内网穿透”本身当成运行时数据访问协议。它最多只应该承担“同步通道”的职责。

### 11.5 推荐的导入策略

worker 第一版不要先写成“在线抓取型”。

应该优先支持两类输入：

1. 从 `release` 目录导入静态快照
2. 从 `inbox` 目录导入原始压缩包

这样后续即使要恢复 GBIF 在线下载能力，也只是多加一种入口，而不是推翻现有设计。

## 12. 当前阶段的最小数据库策略

你已经决定单机 ECS 自带 Postgres/Redis，那就接受一个现实：

- 当前阶段的目标是“联调和开发效率”
- 不是“数据库运维最佳实践”

因此现在正确路线不是上来就做复杂 HA，而是：

1. 先把单机 Postgres 用起来
2. 先把 schema 和导入链路跑通
3. 先让 API 能查真数据
4. 再评估何时拆到 RDS / Tair

### 11.1 当前必须做的底线

- 数据目录挂宿主机持久化
- 至少有每日 `pg_dump`
- 每次大改 schema 前先备份
- 不开放公网数据库端口

### 11.2 当前不必过早做的事

- 主从复制
- 自动故障切换
- 多 ECS
- 复杂服务网格

## 13. 监控与日志的最低要求

哪怕还是开发阶段，也建议立刻具备下面这些最低能力：

- API 日志可查看
- Worker 日志可查看
- Postgres 容器日志可查看
- Redis 容器日志可查看
- 至少有一个 `/api/v1/health`

当前仓库已经有健康检查路由基础，后面要做的是把它变成远程部署可用的入口。

## 14. 未来切域名和 HTTPS 的迁移路线

你已经说明“现在不要域名，但未来会用”，所以当前就要按“未来可平滑切换”来设计。

### 14.1 未来应该怎么切

顺序建议：

1. 域名准备完成
2. 如果 ECS 在中国大陆，完成 ICP 备案
3. 申请或上传证书
4. 给 `nginx` 增加 `443`
5. 开启 HTTP -> HTTPS 跳转
6. 把本机前端代理目标从 `http://<ecs-ip>` 换成 `https://api.<your-domain>`
7. 再决定前端是否迁移到云端静态托管

### 14.2 为什么现在就要保留 nginx 入口

因为一旦未来切域名和 HTTPS：

- 你不需要重做 API 容器拓扑
- 不需要让应用自己处理证书
- 不需要重新暴露新端口

入口层替换最小。

### 14.3 如果未来要把前端也上云

推荐顺序：

1. 先把前端构建后交给 `nginx`
2. 再切到 `OSS + CDN`
3. 再做缓存策略和静态资源域名

原因：

- 当前阶段前端还在快速开发
- 等 UI 稳定以后，静态托管才有意义
- 阿里云官方文档也明确指出，OSS + CDN 更适合静态资源分发；如果加速区域在中国大陆，还需要域名和 ICP 备案

## 15. 分阶段行动清单

### 第 0 步：先做决策冻结

- [ ] 确认当前前端继续留本机
- [ ] 确认当前后端部署模式为单机 ECS + Docker Compose
- [ ] 确认当前数据来源模式为“家里电脑单向同步到 ECS”
- [ ] 确认公网只开放 `80` 和 `22`
- [ ] 确认当前不启用域名和 HTTPS

### 第 1 步：准备 ECS

- [ ] 购买 ECS
- [ ] 绑定公网 IP
- [ ] 配置安全组
- [ ] 完成 SSH 登录
- [ ] 安装 Docker 与 Compose
- [ ] 创建 `inbox/archive/releases` 目录

### 第 2 步：补仓库部署文件

- [ ] 增加 `deploy/ecs/docker-compose.yml`
- [ ] 增加 `deploy/ecs/nginx/default.conf`
- [ ] 增加 `.env.example`
- [ ] 增加初始化 SQL
- [ ] 增加同步与导入脚本

### 第 3 步：补应用配置

- [ ] `api` 支持 `HOST=0.0.0.0`
- [ ] `api` 支持 `DATABASE_URL`
- [ ] `api` 支持 `REDIS_URL`
- [ ] `worker` 支持远程运行所需环境变量
- [ ] `worker` 支持从本地发布包导入
- [ ] `web` 支持从环境变量读取远程代理目标

### 第 4 步：第一次部署

- [ ] 把代码传到 ECS
- [ ] 填写 ECS 上的环境变量文件
- [ ] 启动 Compose
- [ ] 执行建表 SQL
- [ ] 确认 `health` 可访问

### 第 5 步：打通家里电脑同步

- [ ] 在家里电脑准备首个版本化数据包
- [ ] 把数据包上传到 ECS `inbox`
- [ ] 执行导入脚本
- [ ] 确认导入完成后归档

### 第 6 步：接本机前端

- [ ] 修改本机 Vite 代理目标到 ECS
- [ ] 浏览器打开本地前端
- [ ] 确认请求已转到 ECS
- [ ] 确认不需要开放 `3000`

### 第 7 步：进入真后端开发

- [ ] 补 worker 本地导入骨架
- [ ] 补 staging 表导入
- [ ] 补 occurrence 正式表写入
- [ ] 补 `/api/v1/cells` 真查询

## 16. 你接下来最值得先做的三件事

如果只看接下来 1 到 2 天，我建议按下面顺序推进：

1. 先把 ECS 和安全组准备好
2. 再把仓库里的 `compose + nginx + env + SQL init + import` 骨架补出来
3. 然后先打通“家里电脑 -> ECS -> worker 导入”，最后再把本机前端代理切到 ECS

不要先做：

- 域名
- HTTPS
- 前端云上部署
- 运行时回源家里电脑
- 复杂内网穿透源站

这些都是真需求，但都不是当前关键路径。

## 17. 官方参考

以下是这条路线中最关键的阿里云官方文档：

- ECS 安全组：https://www.alibabacloud.com/help/en/ecs/user-guide/start-using-security-groups
- ICP 备案流程：https://www.alibabacloud.com/help/en/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview
- ICP 备案概念与限制：https://www.alibabacloud.com/help/en/icp-filing/basic-icp-service/product-overview/what-is-an-icp-filing
- OSS + CDN 加速：https://www.alibabacloud.com/help/en/oss/user-guide/use-cdn-to-accelerate-access-to-oss
- 证书上传与部署：https://www.alibabacloud.com/help/en/ssl-certificate/upload-an-ssl-certificate

## 18. 最终建议

一句话总结：

**当前最合理的方向是“前端继续本机，后端放在国内单台 ECS，家里电脑只做单向同步，ECS 不把家庭网络当运行时依赖；等后端主链路稳定后再引入域名、HTTPS 和前端云端静态托管”。**

这条路线不是最花哨的，但它最符合你这个仓库当前的成熟度，也最不容易把后续演进路线做死。
