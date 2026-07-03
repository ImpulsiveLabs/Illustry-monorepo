FROM node:20-alpine3.20 AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /illustry

COPY .yarn ./.yarn
COPY .yarnrc.yml yarn.lock ./

COPY types/package.json types/tsconfig.json ./types/
COPY types/src ./types/src

COPY packages/core/package.json packages/core/tsconfig.json ./packages/core/
COPY packages/core/src ./packages/core/src

COPY packages/cli/package.json packages/cli/tsconfig.json ./packages/cli/
COPY packages/cli/src ./packages/cli/src

RUN printf '%s\n' \
  '{' \
  '  "private": true,' \
  '  "packageManager": "yarn@4.5.3",' \
  '  "workspaces": ["types", "packages/*"]' \
  '}' \
  > package.json

RUN yarn install
RUN yarn workspace @illustry/types build:ts \
  && yarn workspace @illustry/core build:ts \
  && yarn workspace @illustry/cli build:ts

FROM node:20-alpine3.20 AS runner

RUN apk add --no-cache libc6-compat fontconfig ttf-dejavu ttf-liberation \
  && fc-cache -f

WORKDIR /workspace

ENV NODE_ENV=production

COPY --from=builder /illustry/package.json /illustry/package.json
COPY --from=builder /illustry/node_modules /illustry/node_modules
COPY --from=builder /illustry/types/package.json /illustry/types/package.json
COPY --from=builder /illustry/types/dist /illustry/types/dist
COPY --from=builder /illustry/packages/core/package.json /illustry/packages/core/package.json
COPY --from=builder /illustry/packages/core/dist /illustry/packages/core/dist
COPY --from=builder /illustry/packages/cli/package.json /illustry/packages/cli/package.json
COPY --from=builder /illustry/packages/cli/dist /illustry/packages/cli/dist

ENTRYPOINT ["node"]
CMD ["/illustry/packages/cli/dist/index.js", "--help"]
