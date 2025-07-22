# GPT-Vis SSR 图片生成服务

基于 GPT-Vis SSR 包的 Node.js Express 图表图片生成服务，支持本地存储、AWS S3 和 MinIO 云存储。

## 安装

```bash
npm install
```

## 配置

### 本地存储（默认）
默认情况下，图片存储在 `./images` 目录中。

### S3 兼容存储（可选）
支持 AWS S3、MinIO 和其他 S3 兼容服务。配置以下环境变量：

#### AWS S3 配置
```bash
# AWS S3 必需的环境变量
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

#### MinIO 配置
```bash
# MinIO 必需的环境变量
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_BUCKET_NAME=charts
```

#### 可选配置
```bash
# 可选：S3 图片的自定义域名（CDN等）
S3_CUSTOM_DOMAIN=https://cdn.yourdomain.com
```

复制 `.env.example` 文件并填入你的配置：
```bash
cp .env.example .env
```

**注意**: 如果任何必需的 S3 环境变量缺失，服务将自动回退到本地存储。

## 使用方法

### 启动服务器
```bash
npm start
```

### 开发模式
```bash
npm run dev
```

### 测试服务器
```bash
# 先启动服务器，然后在另一个终端运行：
npm test
```

## 功能测试

使用内置的测试脚本验证功能：

```bash
# 启动服务器
npm start

# 在另一个终端运行测试
npm test
```

测试脚本将：
1. 检查服务器健康状态和存储配置
2. 生成示例图表
3. 显示结果和图片URL

## API 接口

### POST `/api/gpt-vis`
生成图表图片并存储到本地或 S3。

**请求体：**
```json
{
  "type": "line",
  "data": [
    { "time": 2018, "value": 91.9 },
    { "time": 2019, "value": 99.1 },
    { "time": 2020, "value": 85.2 }
  ]
}
```

**响应（本地存储）：**
```json
{
  "success": true,
  "resultObj": "/images/chart-uuid.png",
  "localPath": "./images/chart-uuid.png",
  "message": "Chart generated successfully",
  "storage": "local"
}
```

**响应（S3 存储）：**
```json
{
  "success": true,
  "resultObj": "https://your-bucket.s3.us-east-1.amazonaws.com/charts/chart-uuid.png",
  "message": "Chart generated successfully",
  "storage": "s3"
}
```

**响应（MinIO 存储）：**
```json
{
  "success": true,
  "resultObj": "http://localhost:9000/charts/charts/chart-uuid.png",
  "message": "Chart generated successfully",
  "storage": "s3"
}
```

**响应（S3 + 自定义域名）：**
```json
{
  "success": true,
  "resultObj": "https://cdn.yourdomain.com/charts/chart-uuid.png",
  "message": "Chart generated successfully",
  "storage": "s3"
}
```

### GET `/images/:filename`
提供生成的图表图片（仅限本地存储）。

### GET `/health`
健康检查接口，包含存储配置信息。

**响应：**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "storage": "s3",
  "s3Config": {
    "region": "us-east-1",
    "bucket": "your-bucket-name",
    "customDomain": "https://cdn.yourdomain.com",
    "endpoint": null,
    "forcePathStyle": false,
    "serviceType": "AWS S3"
  }
}
```

**MinIO 响应示例：**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "storage": "s3",
  "s3Config": {
    "region": "us-east-1",
    "bucket": "charts",
    "customDomain": null,
    "endpoint": "http://localhost:9000",
    "forcePathStyle": true,
    "serviceType": "MinIO/Custom"
  }
}
```

## 功能特性

- 使用 GPT-Vis SSR 生成图表
- 多重存储支持：本地文件、AWS S3、MinIO
- S3 URL 自定义域名支持
- MinIO 和自定义 S3 端点支持
- 路径样式和虚拟主机样式 URL 支持
- S3 到本地存储的自动回退
- 通过 HTTP 提供生成的图片（本地存储）
- 错误处理和数据验证
- 带配置信息的健康检查接口

## 存储机制

1. **AWS S3 已配置**: 图片上传到 AWS S3，设置为公开读取权限
2. **MinIO 已配置**: 图片上传到 MinIO 服务器，使用路径样式 URL
3. **S3/MinIO 上传失败**: 自动回退到本地存储
4. **S3 未配置**: 默认使用本地存储
5. **自定义域名**: 如果配置了自定义域名，所有 S3/MinIO URL 将使用自定义域名

## URL 格式说明

### AWS S3 URL 格式
- 标准格式：`https://bucket-name.s3.region.amazonaws.com/charts/chart-uuid.png`
- 自定义域名：`https://cdn.yourdomain.com/charts/chart-uuid.png`

### MinIO URL 格式
- 路径样式：`http://localhost:9000/bucket-name/charts/chart-uuid.png`
- 虚拟主机样式：`http://bucket-name.localhost:9000/charts/chart-uuid.png`
- 自定义域名：`https://cdn.yourdomain.com/charts/chart-uuid.png`

## 环境变量

- `PORT`: 服务器端口（默认：3000）
- `NODE_ENV`: 环境模式（development/production）

### S3 兼容存储环境变量
- `AWS_ACCESS_KEY_ID`: 访问密钥（必需）
- `AWS_SECRET_ACCESS_KEY`: 密钥（必需）
- `S3_BUCKET_NAME`: 存储桶名称（必需）
- `AWS_REGION`: AWS 区域（AWS S3 必需，MinIO 可选）
- `S3_ENDPOINT`: 自定义 S3 端点（MinIO 必需）
- `S3_FORCE_PATH_STYLE`: 是否使用路径样式 URL（MinIO 推荐设置为 `true`）
- `S3_CUSTOM_DOMAIN`: 自定义域名（可选，用于 CDN 等）

### 配置组合说明

#### 仅本地存储
不设置任何 S3 相关环境变量

#### AWS S3 存储
```bash
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
```

#### MinIO 存储
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_BUCKET_NAME=charts
```

#### 使用 CDN 或自定义域名
```bash
# 在上述配置基础上添加
S3_CUSTOM_DOMAIN=https://cdn.yourdomain.com
```

## 项目结构

```
gpt-vis-ssr-server/
├── server.js              # 主服务器文件
├── package.json           # 项目配置和依赖
├── .env.example          # 环境变量模板
├── .gitignore            # Git 忽略文件
├── test-server.js        # 测试脚本
├── example-request.json  # 请求示例
├── README.md             # 项目文档
└── images/               # 本地图片存储目录（自动创建）
```

## 快速开始

1. **克隆或下载项目**
2. **安装依赖**: `npm install`
3. **配置环境变量**（可选）: `cp .env.example .env`
4. **启动服务**: `npm start`
5. **测试功能**: `npm test`

## 示例请求

使用 curl 测试：

```bash
curl -X POST http://localhost:3000/api/gpt-vis \
  -H "Content-Type: application/json" \
  -d '{
    "type": "line",
    "data": [
      { "time": 2018, "value": 91.9 },
      { "time": 2019, "value": 99.1 },
      { "time": 2020, "value": 85.2 }
    ]
  }'
```

## 故障排除

### 常见问题

1. **S3/MinIO 上传失败**
   - 检查访问密钥是否正确
   - 确认存储桶权限设置
   - 验证端点和区域配置
   - MinIO 用户检查 `S3_FORCE_PATH_STYLE=true` 设置

2. **图片无法访问**
   - 本地存储：检查 `/images` 路径
   - S3 存储：验证存储桶公开访问设置
   - MinIO 存储：确认 MinIO 服务运行状态和端口

3. **MinIO 连接问题**
   - 确认 MinIO 服务已启动
   - 检查端点 URL 格式（如 `http://localhost:9000`）
   - 验证存储桶是否已创建
   - 确认防火墙和网络访问设置

4. **服务启动失败**
   - 检查端口是否被占用
   - 验证 Node.js 版本兼容性
   - 检查环境变量配置

### 日志信息

服务启动时会显示当前配置：
- ✅ AWS S3 存储已配置
- ✅ MinIO/Custom S3 存储已配置
- 📁 使用本地存储（S3 未配置）
- ☁️ 存储桶和区域信息
- 🔗 MinIO 端点信息
- 📁 路径样式设置
- 🌐 自定义域名（如已配置）

### MinIO 快速启动

如果你想测试 MinIO 存储，可以快速启动一个本地 MinIO 实例：

```bash
# 使用 Docker 启动 MinIO
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

然后在 `.env` 文件中配置：
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_BUCKET_NAME=charts
```

记得在 MinIO 控制台（http://localhost:9001）中创建名为 `charts` 的存储桶。