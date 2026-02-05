# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar arquivos do monorepo
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Instalar dependências
RUN npm ci --workspace=api

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace=api

# Copiar código da API
COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && npx prisma generate

COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
RUN cd apps/api && npx tsc

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copiar dependências e build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/prisma ./prisma
COPY apps/api/package.json ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
