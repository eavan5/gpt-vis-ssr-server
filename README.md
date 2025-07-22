# GPT-Vis SSR 图片生成服务

基于 GPT-Vis SSR 包的 Node.js Express 图表图片生成服务，支持本地存储和 AWS S3 云存储。

## 安装

```bash
npm install
```

## 配置

### 本地存储（默认）
默认情况下，图片存储在 `./images` 目录中。

### S3 云存储（可选）
要使用 S3 存储，请配置以下环境变量：

```bash
# S3 存储必需的环境变量
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# 可选：S3 图片的自定义域名
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
    "customDomain": "https://cdn.yourdomain.com"
  }
}
```

## 功能特性

- 使用 GPT-Vis SSR 生成图表
- 双重存储支持：本地文件或 AWS S3
- S3 URL 自定义域名支持
- S3 到本地存储的自动回退
- 通过 HTTP 提供生成的图片（本地存储）
- 错误处理和数据验证
- 带配置信息的健康检查接口

## 存储机制

1. **S3 已配置**: 图片上传到 S3，设置为公开读取权限
2. **S3 上传失败**: 自动回退到本地存储
3. **S3 未配置**: 默认使用本地存储
4. **自定义域名**: 如果配置了自定义域名，S3 URL 将使用自定义域名

## 环境变量

- `PORT`: 服务器端口（默认：3000）
- `NODE_ENV`: 环境模式（development/production）
- `AWS_ACCESS_KEY_ID`: AWS 访问密钥（S3 必需）
- `AWS_SECRET_ACCESS_KEY`: AWS 密钥（S3 必需）
- `AWS_REGION`: AWS 区域（S3 必需）
- `S3_BUCKET_NAME`: S3 存储桶名称（S3 必需）
- `S3_CUSTOM_DOMAIN`: S3 URL 自定义域名（可选）

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

1. **S3 上传失败**
   - 检查 AWS 凭证是否正确
   - 确认存储桶权限设置
   - 验证区域配置

2. **图片无法访问**
   - 本地存储：检查 `/images` 路径
   - S3 存储：验证存储桶公开访问设置

3. **服务启动失败**
   - 检查端口是否被占用
   - 验证 Node.js 版本兼容性

### 日志信息

服务启动时会显示当前配置：
- ✅ S3 存储已配置
- 📁 使用本地存储（S3 未配置）
- ☁️ S3 存储桶信息
- 🌍 自定义域名（如已配置）