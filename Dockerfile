# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖（用于图片处理和编译工具）
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    make \
    g++ \
    python3

# 复制 package.json 和锁文件
COPY package*.json yarn.lock* ./


# 配置 npm 使用淘宝镜像源 (国内网络优化)
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# 安装项目依赖 - 使用镜像源
RUN if [ -f package-lock.json ]; then \
    npm ci --omit=dev --no-audit --no-fund --registry https://registry.npmmirror.com/; \
    elif [ -f yarn.lock ]; then \
    yarn config set registry https://registry.npmmirror.com/ && \
    yarn config set network-timeout 600000 && \
    yarn install --frozen-lockfile --production; \
    else \
    npm install --only=production --no-audit --no-fund --registry https://registry.npmmirror.com/; \
    fi

# 复制项目源代码
COPY . .

# 创建图片存储目录
RUN mkdir -p images

# 暴露应用端口
EXPOSE 3000

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.end();"

# 使用非root用户运行应用
USER node

# 启动应用
CMD ["npm", "start"]