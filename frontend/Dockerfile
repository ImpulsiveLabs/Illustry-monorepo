FROM node:20-alpine3.20 AS base

RUN apk add --no-cache libc6-compat

FROM base AS builder
WORKDIR /app

# Use monorepo Yarn Berry setup for deterministic installs
COPY .yarn ./.yarn
COPY .yarnrc.yml ./
COPY yarn.lock ./
COPY frontend/package.json ./package.json
COPY frontend/vendor ./vendor
COPY types/package.json ./types/package.json
COPY types/dist ./types/dist

RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.dependencies['@illustry/types']='file:./types';fs.writeFileSync('package.json', JSON.stringify(p, null, 2)+'\n');"

RUN yarn install

# Copy app source after deps to maximize cache hits
COPY frontend .

# Avoid stale artifacts influencing server action manifests
RUN rm -rf .next && yarn build:ts

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NEXT_PUBLIC_APP_PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
