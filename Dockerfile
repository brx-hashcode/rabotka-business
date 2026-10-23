FROM node:22-alpine AS base
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# `output: "standalone"` (next.config.ts) emits a self-contained server.js with
# only the traced node_modules. It does not copy public/ or .next/static, so
# both are added next to it here and server.js serves them.
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3500

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# BACKEND_URL is read at runtime by src/proxy.ts and comes from .env, so one
# image serves every environment.
EXPOSE 3500
CMD ["node", "server.js"]
