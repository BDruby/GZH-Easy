# Node 20 官方轻量镜像
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 拷贝源码并构建前端
COPY . .
RUN npm run build

# 生产运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=43121

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/server.mjs ./server.mjs

EXPOSE 43121

CMD ["node", "server.mjs"]
