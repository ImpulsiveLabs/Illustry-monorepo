FROM node:20-alpine3.20 AS base

RUN apk -U upgrade

FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install Yarn Berry
RUN yarn set version berry

# Copy monorepo-wide dependencies (this includes frontend)
ADD ./.yarn ./.yarn
ADD ./.yarnrc.yml ./
ADD ./yarn.lock ./

FROM base AS builder

WORKDIR /app

COPY frontend .

# Install dependencies (this includes frontend dependencies)
RUN yarn install

RUN yarn build:ts

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Ensure .next directory exists and set ownership
COPY --from=builder /app/public ./public
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NEXT_PUBLIC_APP_PORT=3000

EXPOSE $NEXT_PUBLIC_APP_PORT

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
