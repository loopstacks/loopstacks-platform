FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/agent-runtime ./apps/agent-runtime
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm run build --filter=@loopstacks/agent-runtime

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/agent-runtime/dist ./dist
COPY --from=builder /app/apps/agent-runtime/package.json ./
CMD ["node", "dist/index.js"]