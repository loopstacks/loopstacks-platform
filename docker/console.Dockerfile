FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/console ./apps/console
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm run build --filter=@loopstacks/console-web

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/console/web/.next ./.next
COPY --from=builder /app/apps/console/web/package.json ./
CMD ["npm", "start"]