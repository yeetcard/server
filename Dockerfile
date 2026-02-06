FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

FROM node:20-slim

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --gid 1001 nodeuser

COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY assets ./assets

RUN mkdir -p certs && chown -R nodeuser:nodejs /app

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/index.js"]
