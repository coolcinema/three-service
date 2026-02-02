# Stage 1: Build
FROM node:20-alpine AS builder
# Включаем pnpm
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./ 
COPY .npmrc ./ 

# Безопасная установка зависимостей. 
# Секрет 'npm_token' монтируется только на время выполнения команды.
RUN --mount=type=secret,id=npm_token \
    export COOLCINEMA_GH_PKG_TOKEN=$(cat /run/secrets/npm_token) && \
    pnpm install --frozen-lockfile

COPY . .

# Сборка NestJS приложения (результат будет в папке dist)
RUN pnpm run build

# --- ИСПРАВЛЕНИЕ ---
# Удалена строка: COPY src/proto ./dist/proto
# (Так как в gateway-service этой папки нет)

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app

# Копируем собранный код
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Команда запуска для NestJS (production mode)
CMD ["node", "dist/main.js"]
