# spp-indexer 构建与部署指南

本文档说明从本地修改、构建镜像、推送到 GHCR，到服务器部署并与 `os-backend` 联调的完整流程。

---

## 一、前置条件

- 本地已安装 Docker、Node.js、yarn
- 拥有 GitHub Container Registry（`ghcr.io`）读写权限
- 服务器已安装 Docker，可访问 PostgreSQL
- 已申请 Alchemy 付费 RPC（Ethereum + Polygon 各一个 App）

---

## 二、本地配置修改

### 2.1 RPC 配置（`conf.json`）

`conf.json` 已加入 `.gitignore`，**不会提交到 Git**。首次配置：

```bash
cp conf.json.example conf.json
```

编辑 `conf.json`，将所有 `chainRPC` 替换为 Alchemy URL：

| 链 | 使用 URL 的合约 |
|----|----------------|
| **Ethereum** | `SEED`、`NODE`（共 2 处） |
| **Polygon** | `SCR`、`CityHallMembers`、`SmallCommittee`、SNS、Resolver、ScoreLend（共 6 处） |

示例：

```json
"chainRPC": "https://eth-mainnet.g.alchemy.com/v2/<ETH_KEY>"
"chainRPC": "https://polygon-mainnet.g.alchemy.com/v2/<POLYGON_KEY>"
```

> **注意**：`conf.json` 在 `docker build` 时会打入镜像。修改 RPC 后需重新 build 并部署。CI 构建不会包含本地 `conf.json`，生产环境请使用本地 build 推送，或运行时挂载配置文件。

### 2.2 BATCH_SIZE（`src/events/index.ts`）

付费 RPC 下将历史扫描批次调大：

```typescript
// src/events/index.ts
const BATCH_SIZE = 2000;  // 免费 RPC 使用 10
```

若改回免费 Ankr 等 RPC，需改回 `10`。

### 2.3 构建前检查

```bash
grep chainRPC conf.json          # 确认是 alchemy.com
grep BATCH_SIZE src/events/index.ts
```

---

## 三、本地构建镜像

在项目根目录执行：

```bash
cd /path/to/spp-indexer

docker build -t ghcr.io/seedao-devops/spp-indexer:main .
```

验证镜像内配置（可选）：

```bash
docker run --rm ghcr.io/seedao-devops/spp-indexer:main cat /app/conf.json | grep chainRPC
```

应看到 `alchemy.com`，而非 `ankr.com`。

---

## 四、推送到 GHCR

### 4.1 登录（首次或 token 过期）

```bash
echo "<GITHUB_PAT>" | docker login ghcr.io -u <GitHub用户名> --password-stdin
```

PAT 需包含 `write:packages` 权限。

### 4.2 推送

```bash
docker push ghcr.io/seedao-devops/spp-indexer:main
```

---

## 五、服务器部署

### 5.1 登录 GHCR（服务器）

```bash
echo "<GITHUB_PAT>" | docker login ghcr.io -u <GitHub用户名> --password-stdin
```

### 5.2 拉取镜像

```bash
docker pull ghcr.io/seedao-devops/spp-indexer:main
```

### 5.3 数据库连通性测试

Postgres 在宿主机时，从容器网络测试：

```bash
docker run --rm -it --add-host=host.docker.internal:host-gateway postgres:15 \
  psql "postgresql://spp_prod_user:<密码>@host.docker.internal:5432/spp_indexer_prod" -c "SELECT 1;"
```

### 5.4 查 os-backend 所在 Docker 网络

```bash
docker inspect <os-backend容器名> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'
```

记下网络名（例如 `os_default`），下面用 `<网络名>` 代替。

### 5.5 停止旧容器并启动

容器名必须为 **`spp-indexer`**，以便 `os-backend` 通过 `http://spp-indexer:3000` 访问。

```bash
docker stop spp-indexer seedao-spp-indexer 2>/dev/null
docker rm spp-indexer seedao-spp-indexer 2>/dev/null

docker run -d \
  --name spp-indexer \
  --network <网络名> \
  --restart unless-stopped \
  --add-host=host.docker.internal:host-gateway \
  -p 9094:3000 \
  -e DATABASE_URL="postgresql://spp_prod_user:<密码>@host.docker.internal:5432/spp_indexer_prod" \
  ghcr.io/seedao-devops/spp-indexer:main
```

说明：

| 参数 | 作用 |
|------|------|
| `--name spp-indexer` | 与 os-backend 的 DNS 名一致 |
| `--network <网络名>` | 与 os-backend 同一 Docker 网络 |
| `--add-host=host.docker.internal:host-gateway` | 容器访问宿主机 Postgres |
| `-p 9094:3000` | 外部 9094 → 容器内 3000 |
| `DATABASE_URL` | 不要用 `127.0.0.1`（在容器内指向容器自身） |

### 5.6 可选：挂载 conf.json（免 rebuild 改 RPC）

```bash
# 宿主机上必须是文件，不能是目录
sudo mkdir -p /opt/spp-indexer
sudo cp conf.json /opt/spp-indexer/conf.json

docker run -d \
  --name spp-indexer \
  --network <网络名> \
  --restart unless-stopped \
  --add-host=host.docker.internal:host-gateway \
  -p 9094:3000 \
  -v /opt/spp-indexer/conf.json:/app/conf.json:ro \
  -e DATABASE_URL="postgresql://spp_prod_user:<密码>@host.docker.internal:5432/spp_indexer_prod" \
  ghcr.io/seedao-devops/spp-indexer:main
```

---

## 六、部署验证

### 6.1 本机 API

```bash
curl -sS http://127.0.0.1:9094/computenodesbt
```

### 6.2 os-backend 网络连通

```bash
docker exec <os-backend容器名> nslookup spp-indexer
docker exec <os-backend容器名> wget -qO- "http://spp-indexer:3000/computenodesbt"
```

### 6.3 索引进度

```bash
docker logs spp-indexer 2>&1 | grep -E "\[history\]|query NODE's|failed" | tail -20
```

NODE 应从 initdata 最大区块继续，例如：

```
query NODE's TransferSingle event from block[18035210] to block[...]
```

完成时出现：

```
[history] done: contract=NODE
```

### 6.4 数据库进度

```bash
psql -h 127.0.0.1 -p 5432 -U spp_prod_user -d spp_indexer_prod -c \
  "SELECT COUNT(*), MAX(\"blockNumber\") FROM \"ERC1155TokenTransferSingleTx\"
   WHERE \"contractAddress\" = '0x9d34D407D8586478b3e4c39BE633ED3D7be1c80C';"
```

---

## 七、日志查看（过滤噪音）

```bash
# 只看错误，屏蔽 Processing batch
docker logs --tail 3000 spp-indexer 2>&1 \
  | grep -v 'Processing batch' \
  | grep -iE 'failed|error|fatal|Unauthorized|prisma|database|timeout|\[history\]'
```

实时跟踪：

```bash
docker logs -f spp-indexer 2>&1 \
  | grep --line-buffered -vE 'Processing batch|save block\['
```

---

## 八、数据库 initdata 导入（空库恢复）

若数据库为空，可先导入历史快照再启动 indexer：

```bash
npx prisma migrate deploy

psql -h 127.0.0.1 -p 5432 -U spp_prod_user -d spp_indexer_prod \
  -f prisma/initdata_202311081438/ERC1155TokenTransferSingleTx.sql
psql -h 127.0.0.1 -p 5432 -U spp_prod_user -d spp_indexer_prod \
  -f prisma/initdata_202311081438/ERC1155TokenTransferBatchTx.sql
psql -h 127.0.0.1 -p 5432 -U spp_prod_user -d spp_indexer_prod \
  -f prisma/initdata_202311081438/ext.sql
```

导入后 NODE 数据到约 block `18035209`，indexer 会从 `18035210` 继续补数。

---

## 九、发版流程速查

```bash
# === 本地 ===
vim conf.json                              # 改 RPC（如需）
vim src/events/index.ts                    # 改 BATCH_SIZE（如需）
docker build -t ghcr.io/seedao-devops/spp-indexer:main .
docker push ghcr.io/seedao-devops/spp-indexer:main

# === 服务器 ===
docker login ghcr.io
docker pull ghcr.io/seedao-devops/spp-indexer:main
docker stop spp-indexer && docker rm spp-indexer
docker run -d --name spp-indexer --network <网络名> \
  --restart unless-stopped \
  --add-host=host.docker.internal:host-gateway \
  -p 9094:3000 \
  -e DATABASE_URL="postgresql://..." \
  ghcr.io/seedao-devops/spp-indexer:main

# === 验证 ===
curl http://127.0.0.1:9094/computenodesbt
docker exec <os-backend> wget -qO- http://spp-indexer:3000/computenodesbt
```

---

## 十、常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| `lookup spp-indexer: no such host` | os-backend 与 indexer 不同网或容器名不对 | `--name spp-indexer` + 同一 `--network` |
| `Can't reach database at host.docker.internal` | 未加 `--add-host` 或 Postgres 未监听 | 加 host-gateway；检查 `ss -lntp \| grep 5432` |
| `401 Unauthorized` | 镜像内仍是旧 Ankr RPC | 本地改 conf.json 后重新 build push |
| `mount conf.json: not a directory` | 宿主机路径是目录不是文件 | 删除目录，创建真实 json 文件 |
| 外部 API 慢/超时 | 历史补数占用资源 | 等补数完成或调大 Nginx 超时 |
| `count=0` 长期不变 | RPC 限流或全量扫描失败 | 换付费 RPC；查 `[history] failed` 日志 |

---

## 十一、费用参考（Alchemy PAYG）

| 阶段 | 约计 |
|------|------|
| 历史补数（BATCH_SIZE=2000，有 initdata） | 一次性 $5～20 |
| 稳态运行（补数完成后） | $5～15 / 月 |

在 Alchemy Dashboard 设置用量告警（如月 50M CU）。
