# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖（用于图片处理，优化后的依赖列表）
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    fontconfig-dev \
    make \
    g++ \
    python3 \
    pkgconfig

# 复制 package.json 和锁文件
COPY package*.json yarn.lock* ./

# 配置 yarn 和 npm 使用淘宝镜像源 (国内网络优化)
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# 安装项目依赖 - 优先使用 yarn（因为项目有 yarn.lock）
RUN if [ -f yarn.lock ]; then \
    yarn config set registry https://registry.npmmirror.com/ && \
    yarn config set network-timeout 600000 && \
    yarn install --frozen-lockfile --production --non-interactive; \
    elif [ -f package-lock.json ]; then \
    npm ci --omit=dev --no-audit --no-fund --registry https://registry.npmmirror.com/; \
    else \
    npm install --only=production --no-audit --no-fund --registry https://registry.npmmirror.com/; \
    fi

# 清理包管理器缓存以减小镜像大小
RUN if [ -f yarn.lock ]; then yarn cache clean; else npm cache clean --force; fi

# 复制项目源代码
COPY . .

# 创建 images 目录并设置正确的所有者（在切换用户之前）
RUN mkdir -p images && chown -R node:node images

# 使用非root用户运行应用
USER node

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

# 启动应用
CMD ["npm", "start"]