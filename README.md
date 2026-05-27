# Illustry

Illustry is a collaborative data visualization app for creating visualizations, composing them into dashboards, and sharing dashboards or individual visualizations with other users as viewers or editors.

## Install

```bash
yarn install
```

## Run

Use MongoDB Atlas for normal development and production. Local MongoDB is only an explicit development override.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
yarn workspace @impulsivelabs/illustry-server start:dev
yarn workspace @impulsivelabs/illustry-client start:dev
```

Docker Compose also starts Redis for WebSocket pub/sub:

```bash
docker compose up --build
```

To use a local MongoDB container instead of Atlas for development:

```bash
docker compose --profile local-mongo up --build
```

## CLI And MCP Automation

Illustry ships two automation frontends:

- `@illustry/cli`: a terminal frontend with offline/local mode, live/server mode, auth/session persistence, keyboard-driven interactive menus, imports, exports, listing, deletes, and JSON output for CI.
- `@illustry/mcp`: a Model Context Protocol stdio server exposing the same local/live workflows to agents.

Both packages use shared import/export/API logic from `@illustry/core`.

Full docs:

- [`packages/cli/README.md`](packages/cli/README.md)
- [`packages/mcp/README.md`](packages/mcp/README.md)

CLI examples:

```bash
yarn workspace @illustry/cli build:ts
node packages/cli/dist/index.js shell
node packages/cli/dist/index.js status
node packages/cli/dist/index.js import ./examples/data.csv --name Sales --workspace .illustry
node packages/cli/dist/index.js export --asset Sales --format svg,png,excel --out exports --workspace .illustry
node packages/cli/dist/index.js connect --server http://localhost:7001
node packages/cli/dist/index.js login --email you@example.com --password secret
node packages/cli/dist/index.js list visualizations --json
```

MCP example:

```bash
yarn workspace @illustry/mcp build:ts
node packages/mcp/dist/index.js
```

For npm publishing, publish the shared packages first:

1. `@illustry/types`
2. `@illustry/core`
3. `@illustry/cli` and/or `@illustry/mcp`

The publish-facing package metadata uses normal semver dependencies instead of `workspace:*`, so consumers can install the CLI/MCP from npm after those packages are published.

Package publishing is automated by `.github/workflows/publish-packages.yml`:

- Pushes to `main` that touch `types`, `packages/core`, `packages/cli`, or `packages/mcp` automatically create a `minor` release for the changed package set and publish it.
- If `@illustry/types` changes, the workflow also releases `@illustry/core`, `@illustry/cli`, and `@illustry/mcp` so semver dependencies stay aligned.
- If `@illustry/core` changes, the workflow also releases `@illustry/cli` and `@illustry/mcp`.
- Manual runs let you choose the package set, registry (`npm`, GitHub Packages, or both), version bump (`patch`, `minor`, `major`, or `none`), and dry-run mode.
- Automatic push releases use the `ILLUSTRY_AUTO_REGISTRY` repository variable when set, otherwise `npm`.
- `scripts/release-packages.mjs` updates package versions, updates internal `@illustry/*` dependency ranges, and can commit those package/lockfile changes after validation.
- Publish steps check each exact package version first and skip versions that already exist, which keeps first-time partial publishes from failing on already-published dependencies.

Required repository secrets:

- `NPM_TOKEN` for npm publishes.
- `GITHUB_TOKEN` is provided by GitHub Actions for GitHub Packages.

To install or replace the npm publish token:

1. Create an npm automation token from the npm account that owns the `@illustry` scope.
2. Run:

```bash
scripts/configure-npm-publish-secret.sh --run-publish
```

Or provide the token through the environment:

```bash
NPM_TOKEN=npm_xxx scripts/configure-npm-publish-secret.sh --run-publish
```

The helper validates the token with npm, writes it to the GitHub `NPM_TOKEN` secret, and can trigger the first publish workflow.

For Docker Compose, the CLI and MCP are available under the `tools` profile:

```bash
docker compose --profile tools build illustrycli illustrymcp
docker compose --profile tools run --rm illustrycli --help
docker compose --profile tools run --rm illustrycli status --workspace /workspace/.illustry --json
```

The tools containers mount:

- `/workspace/.illustry`: a named Docker volume for local automation state.
- `/workspace/exports`: the host `./exports` folder for generated files.
- `/workspace/repo`: the current repository mounted read-only, useful for source files.

Example Docker CLI import/export:

```bash
docker compose --profile tools run --rm illustrycli import visualization \
  --workspace /workspace/.illustry \
  --file /workspace/repo/path/to/data.csv \
  --name Sales \
  --json

docker compose --profile tools run --rm illustrycli export \
  --workspace /workspace/.illustry \
  --asset Sales \
  --format svg,png,excel \
  --out /workspace/exports \
  --json
```

For MCP clients that can launch Docker commands, use:

```bash
docker compose --profile tools run --rm -T illustrymcp
```

For MCP clients running directly on the host, use:

```bash
yarn workspace @illustry/mcp build:ts
node packages/mcp/dist/index.js
```

## Provisioning

Provisioning is idempotent and upserts the test users plus an active `Test Project`.

```bash
yarn workspace @impulsivelabs/illustry-server provision:test-users
```

Default users:

- `testuser1@illustry.local / IllustryTest123!`
- `testuser2@illustry.local / IllustryTest123!`

The provisioning script loads `backend/.env` and then root `.env`, with root `.env` taking precedence. It refuses local MongoDB unless `ALLOW_LOCAL_MONGO_PROVISIONING=1`, so test users land in MongoDB Atlas by default.

## Tests And Builds

```bash
yarn install --immutable
yarn build:ts
yarn lint
yarn workspace @illustry/types build:ts
yarn workspace @impulsivelabs/illustry-server compile
yarn workspace @impulsivelabs/illustry-client build:ts
yarn workspace @impulsivelabs/illustry-client vitest run
yarn workspace @impulsivelabs/illustry-server test --runInBand
yarn workspace @impulsivelabs/illustry-email-service test --runInBand
yarn workspace @illustry/core test:shard
yarn workspace @illustry/cli test:shard
yarn workspace @illustry/mcp test:shard
```

CI-style sharded examples:

```bash
SHARD_INDEX=1 SHARD_TOTAL=4 yarn test:backend:shard
SHARD_INDEX=1 SHARD_TOTAL=4 yarn test:frontend:shard
SHARD_INDEX=1 SHARD_TOTAL=2 yarn test:core:shard
SHARD_INDEX=1 SHARD_TOTAL=2 yarn test:cli:shard
SHARD_INDEX=1 SHARD_TOTAL=2 yarn test:mcp:shard
```

## Realtime

HTTP is used for initial loads, auth, and mutations. WebSockets are used for live synchronization after a resource has a `shareId`.

- Endpoint: `/api/realtime?resource=dashboard|visualization&shareId=...`
- Redis pub/sub fans events across multiple backend instances.
- Events are scoped by resource and `shareId`, avoiding broad broadcasts.
- Clients reconnect and refetch on live update/delete events.
- Owner deletes publish `deleted`, so shared viewers are redirected/refreshed immediately.

## Dashboard Layout Persistence

Dashboard layouts are edited with `react-grid-layout`. The app generates non-overlapping defaults for new dashboards, tracks drag/resize changes, and persists explicit saves through the dashboard update endpoint. The save button is sticky on the top-right of the dashboard canvas.

## Internal And External Tables

Dashboards and visualizations each use one table area. A single compact Internal/External toggle near search switches the `scope` query parameter while preserving search, pagination, sorting, and row actions.

## Sharing And Roles

Sharing happens on dedicated pages:

- `/share/dashboard?name=...`
- `/share/visualization?name=...&type=...`

Each row accepts one email and one role (`viewer` or `editor`). The UI validates emails live, blocks duplicates, and blocks sharing with your own email. The backend repeats the same checks after trimming and lowercasing emails, deduplicates case-insensitively, and rejects invalid/self-share payloads even if the UI is bypassed.

Invited users receive email links and must accept or reject before access becomes active. Invite TTL is controlled by `SHARE_INVITE_TTL_HOURS`.

## Performance

The main table pages now issue one browse request instead of separate internal and external requests. Browse queries use lean Mongo reads and projections to avoid hydrating large documents. Dashboard/visualization models include indexes for owner/project lookup, share lookup, collaborator lookup, updated sorting, and text search fields. WebSocket events reduce unnecessary refresh loops after live mutations.

## Environment

Important variables:

- `MONGO_URL`: MongoDB Atlas connection string.
- `MONGO_DB_NAME`: Database name, normally `illustry`.
- `MONGO_TEST_URL`: Local test database URI.
- `ALLOW_LOCAL_MONGO_PROVISIONING`: Set to `1` only when intentionally provisioning local MongoDB.
- `TEST_USERS_PASSWORD`: Password used by `provision:test-users`.
- `REDIS_URL`: Redis URL for realtime pub/sub.
- `REDIS_REALTIME_CHANNEL`: Redis channel for realtime messages.
- `REALTIME_HEARTBEAT_INTERVAL_MS`: WebSocket heartbeat interval.
- `AUTH_APP_BASE_URL`: Frontend URL used in emails.
- `CORS_ORIGIN_ALLOWLIST`: Allowed frontend/docs origins.
- `EMAIL_SERVICE_URL`: Email service base URL.
- `EMAIL_SERVICE_API_KEY`: Shared API key for backend-to-email-service calls.
- `SHARE_INVITE_TTL_HOURS`: Share invite expiry window.
- `GLOBAL_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`, `AUTH_SENSITIVE_RATE_LIMIT_MAX`: API protection limits.
- `NEXT_PUBLIC_BACKEND_PUBLIC_URL`: Browser-visible backend URL.
- `BACKEND_INTERNAL_URL`: Server-side frontend-to-backend URL.

Never commit real secrets. `.env` files are local runtime configuration.
