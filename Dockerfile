# =========================================================
# STAGE 1 — BUILD
# =========================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copia apenas o necessário para instalar dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm install

# Copia o código fonte
COPY src ./src

# Build do NestJS
RUN npm run build


# =========================================================
# STAGE 2 — RUNTIME
# =========================================================
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copia somente o necessário para runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
