# Multi-stage Dockerfile for Next.js (standalone) + Prisma

FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Generate Prisma client at build time
RUN pnpm prisma generate
# Build Next.js (standalone output)
RUN pnpm build

FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy Prisma schema/migrations (for migrate deploy)
COPY --from=builder /app/prisma ./prisma

# Copy standalone server and assets (includes minimal node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy startup script
COPY --from=builder /app/scripts/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]


