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
yarn workspace @illustry/types build:ts
yarn workspace @impulsivelabs/illustry-server compile
yarn workspace @impulsivelabs/illustry-client build:ts
yarn workspace @impulsivelabs/illustry-client vitest run
yarn workspace @impulsivelabs/illustry-server test --runInBand
yarn workspace @impulsivelabs/illustry-email-service test --runInBand
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
