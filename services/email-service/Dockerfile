FROM node:20-alpine3.20 AS builder

WORKDIR /srv

RUN yarn set version berry

COPY .yarn ./.yarn
COPY .yarnrc.yml ./
COPY yarn.lock ./
COPY services/email-service/package.json ./package.json

RUN yarn install

COPY services/email-service .

RUN yarn build:ts

FROM node:20-alpine3.20

WORKDIR /srv

ENV NODE_ENV=production
ENV EMAIL_SERVICE_PORT=7100

COPY --from=builder /srv/dist ./dist
COPY --from=builder /srv/node_modules ./node_modules
COPY --from=builder /srv/package.json ./package.json

EXPOSE 7100

CMD ["node", "dist/index.js"]
