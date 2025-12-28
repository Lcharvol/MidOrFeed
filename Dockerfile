
# Multi-stage Dockerfile for Next.js (standalone) + Prisma

FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
RUN apk add --no-cache \
  python3 \
  py3-pip \
  python3-dev \
  build-base \
  openblas-dev \
  lapack-dev \
  musl-dev \
  pkgconf
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN python3 -m venv /opt/ml-venv
ENV VIRTUAL_ENV=/opt/ml-venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"
RUN pip install --no-cache-dir -r ml/requirements.txt
ENV NEXT_TELEMETRY_DISABLED=1
# Generate Prisma client at build time
RUN pnpm prisma generate
# Build Next.js (standalone output)
RUN pnpm build

FROM node:20-alpine AS runner
RUN apk add --no-cache python3 openblas libstdc++ gcc musl-dev
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV VIRTUAL_ENV=/opt/ml-venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

# Copy Prisma schema/migrations (for migrate deploy via release_command)
COPY --from=builder /app/prisma ./prisma

# Copy standalone server and assets (includes minimal node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/ml ./ml
COPY --from=builder /opt/ml-venv /opt/ml-venv

# Copy scripts directory (for migration scripts)
COPY --from=builder /app/scripts ./scripts

# Copy lib directory (for prisma-sharded-accounts and other utilities)
COPY --from=builder /app/lib ./lib

# Copy package.json and tsconfig.json (needed for scripts and TypeScript path resolution)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy startup script
COPY --from=builder /app/scripts/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]


