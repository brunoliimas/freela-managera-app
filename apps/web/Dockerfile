# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar arquivos do monorepo
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Instalar dependências
RUN npm ci --workspace=web

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=web

# Build argument for API URL (needed at build time for Next.js)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copiar código do Web
COPY apps/web ./apps/web

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build /app/apps/web/public ./public
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["node", "server.js"]
