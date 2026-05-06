# Этап 1: Сборка React приложения
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Этап 2: Финальный образ
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY server.js .


COPY --from=builder /app/dist ./dist
COPY public/ public/

EXPOSE 4000

CMD ["node", "server.js"]
