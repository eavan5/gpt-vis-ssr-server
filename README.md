# GPT-Vis SSR 图片生成服务

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🚀 基于 GPT-Vis SSR 的高性能图表图片生成服务，支持本地存储、AWS S3 和 MinIO 云存储

## ✨ 特性

- 🎨 **多种图表类型**：折线图、柱状图、饼图等
- 🏠 **灵活存储**：本地文件、AWS S3、MinIO 云存储
- 🐳 **Docker 支持**：一键部署，避免环境问题  
- 🔄 **智能回退**：S3 失败自动回退到本地存储
- 🌐 **CDN 支持**：自定义域名和 CDN 集成
- 📊 **RESTful API**：简单易用的 HTTP 接口

## 📋 目录

- [快速开始](#-快速开始)
- [API 接口](#-api-接口)
- [配置说明](#-配置说明)
- [Docker 部署](#-docker-部署)
- [本地开发](#-本地开发)
- [故障排除](#-故障排除)

## 🚀 快速开始

### 使用 Docker（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/eavan5/gpt-vis-ssr-server.git
cd gpt-vis-ssr-server

# 2. 构建并运行 Docker 容器
docker build -t gpt-vis-ssr-server .
docker run -d --name gpt-vis-server -p 3000:3000 gpt-vis-ssr-server

# 3. 测试服务
npm test
```

**访问地址：**
- 服务：http://localhost:3000
- 健康检查：http://localhost:3000/health

### 本地开发

```bash
# 1. 安装项目依赖
npm install

# 2. 启动服务
npm start

# 3. 测试功能
npm test
```

## 📡 API 接口

### POST `/api/gpt-vis` - 生成图表

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

**响应：**
```json
{
  "success": true,
  "resultObj": "https://your-domain.com/charts/chart-uuid.png",
  "message": "Chart generated successfully",
  "storage": "s3"
}
```

### GET `/health` - 健康检查

返回服务状态和存储配置信息。

### 快速测试

```bash
curl -X POST http://localhost:3000/api/gpt-vis \
  -H "Content-Type: application/json" \
  -d '{"type": "line", "data": [{"time": 2018, "value": 91.9}]}'
```

## ⚙️ 配置说明

### 环境变量

根据 `.env.example` 创建 `.env` 文件：

```bash
# 基础配置
PORT=3000
NODE_ENV=production

# AWS S3 配置
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# MinIO 配置
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true

# 可选：自定义域名（CDN）
S3_CUSTOM_DOMAIN=https://cdn.yourdomain.com
```

### 配置示例

<details>
<summary>📁 本地存储（默认）</summary>

不设置任何 S3 环境变量，图片存储在 `./images` 目录。
</details>

<details>
<summary>☁️ AWS S3 存储</summary>

```bash
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
```
</details>

<details>
<summary>🗄️ MinIO 存储</summary>

```bash
AWS_ACCESS_KEY_ID=minio_admin
AWS_SECRET_ACCESS_KEY=minio_admin
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_BUCKET_NAME=charts
```
</details>

## 🐳 Docker 部署

### 构建和运行

```bash
# 构建镜像
docker build -t gpt-vis-ssr-server .

# 使用本地存储运行
docker run -d \
  --name gpt-vis-server \
  -p 3000:3000 \
  -v $(pwd)/images:/app/images \
  gpt-vis-ssr-server

# 使用 S3 配置运行
docker run -d \
  --name gpt-vis-server \
  -p 3000:3000 \
  --env-file .env \
  gpt-vis-ssr-server
```

### 容器管理

```bash
docker ps                        # 查看状态
docker logs -f gpt-vis-server    # 查看日志
docker exec -it gpt-vis-server sh # 进入容器
docker restart gpt-vis-server    # 重启服务
```

## 💻 本地开发

### 系统要求

- **Node.js**：18+
- **npm**：8+
- **系统依赖**：Cairo、Pango 等图像处理库

### 安装系统依赖

**macOS：**
```bash
xcode-select --install
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

**Ubuntu/Debian：**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev
```

**CentOS/RHEL：**
```bash
sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel \
  giflib-devel librsvg2-devel
```

### 开发流程

```bash
npm install           # 安装依赖
npm run dev          # 开发模式（热重载）
npm start            # 生产模式
npm test             # 运行测试
```

## 🛠️ 故障排除

### 常见问题

<details>
<summary>🚫 S3/MinIO 上传失败</summary>

1. 检查访问密钥是否正确
2. 确认存储桶权限设置
3. 验证端点和区域配置  
4. MinIO 用户确保 `S3_FORCE_PATH_STYLE=true`
</details>

<details>
<summary>🖼️ 图片无法访问</summary>

1. **本地存储**：检查 `/images` 目录权限
2. **S3 存储**：验证存储桶公开访问设置
3. **MinIO**：确认服务运行状态和端口访问
</details>

<details>
<summary>📦 依赖安装失败</summary>

1. **macOS**：安装 Xcode 命令行工具
2. **Linux**：安装构建工具和图像处理库
3. **Windows**：建议使用 Docker 部署
</details>

### 状态指示器

服务启动时的状态消息：
- ✅ **AWS S3 存储已配置**
- ✅ **MinIO/自定义 S3 存储已配置**
- 📁 **使用本地存储**（S3 未配置）

## 📊 存储机制

1. **优先级**：S3/MinIO → 本地存储
2. **回退机制**：上传失败自动使用本地存储
3. **URL 格式**：支持自定义域名和 CDN

## 📁 项目结构

```
gpt-vis-ssr-server/
├── 📄 server.js              # 主服务器应用
├── 📄 test-server.js         # 测试脚本
├── 📦 package.json           # 项目配置
├── 🐳 Dockerfile            # Docker 配置
├── 🔧 .env.example          # 环境变量模板
├── 📂 images/               # 本地图片存储
└── 📂 node_modules/         # 依赖包
```

## 📈 支持的图表类型

该服务通过 GPT-Vis SSR 支持多种图表类型：
- 折线图
- 柱状图
- 饼图
- 面积图
- 散点图
- 更多图表...

详细的图表类型规范请参考 [GPT-Vis 文档](https://www.npmjs.com/package/@antv/gpt-vis-ssr)。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

<div align="center">
  <sub>使用 GPT-Vis SSR 构建 ❤️</sub>
</div>