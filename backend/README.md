# Illustry backend

This service powers the Illustry API over MongoDB.

## Security-first auth architecture

The backend uses a hardened cookie-session model:

- `AuthUser` stores normalized email, Argon2id password hash, verification state, and `authVersion`.
- `AuthSession` stores hashed session tokens + hashed CSRF tokens, expiration, revocation, and metadata.
- `EmailVerificationToken` and `PasswordResetToken` store hashed single-use tokens with expiry.
- Authentication is cookie-based (`httpOnly` session cookie + CSRF cookie).
- CSRF is enforced on all state-changing cookie-authenticated routes.
- Project/dashboard/visualization access is always scoped by authenticated `userId`.

## MongoDB collections

- `AuthUser`
- `AuthSession`
- `EmailVerificationToken`
- `PasswordResetToken`
- `Project`
- `Dashboard`
- `Visualization`

Indexes include:

- unique `AuthUser.emailNormalized`
- TTL on auth session/token expirations
- user-scoped unique constraints for project/dashboard/visualization
- user-scoped lookup indexes for common queries

## Required environment variables

Use `backend/.env.example` as baseline.

Core:

- `MONGO_URL`, `MONGO_TEST_URL`, `MONGO_USER`, `MONGO_PASSWORD`
- `ILLUSTRY_PORT`
- `CORS_ORIGIN_ALLOWLIST`
- `REQUEST_LATENCY_BUDGET_MS` defaults to `300`; Mongo, Redis, and external HTTP timeout env vars default to this budget.

Auth/cookies:

- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_CSRF_COOKIE_NAME`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_SECURE`
- `AUTH_SESSION_TTL_MINUTES`
- `AUTH_EMAIL_VERIFICATION_TTL_MINUTES`
- `AUTH_PASSWORD_RESET_TTL_MINUTES`
- `AUTH_APP_BASE_URL`
- `AUTH_ARGON2_MEMORY_COST`, `AUTH_ARGON2_TIME_COST`, `AUTH_ARGON2_PARALLELISM`

Rate limits:

- `GLOBAL_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_MAX`
- `AUTH_SENSITIVE_RATE_LIMIT_MAX`

SMTP:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`

## SMTP setup

For local development, you can run MailHog/Mailpit and point SMTP vars to it.
In production, set a real SMTP provider and keep all credentials in env vars.

## Cookie settings

- Session cookie: `httpOnly`, `sameSite=lax`, `secure` in production.
- CSRF cookie: readable by frontend, tied to authenticated session, validated server-side.

## CSRF flow

1. Login/register creates session + CSRF cookies.
2. Frontend reads CSRF cookie value and sends `X-CSRF-Token` on state-changing requests.
3. Backend verifies header value, cookie value, and stored CSRF hash in active session.

## Local development

```bash
cd backend
yarn install
yarn start:dev
```

Run the live API latency guard against a running backend:

```bash
API_LATENCY_BASE_URL=http://127.0.0.1:7010 yarn latency:api
```

## Production notes

- Set `AUTH_COOKIE_SECURE=true`.
- Restrict `CORS_ORIGIN_ALLOWLIST` to trusted origins only.
- Run behind HTTPS and a reverse proxy.
- Use strong SMTP credentials and rotate secrets regularly.
- Monitor auth endpoints and rate-limit metrics.

## License

[Apache-2.0](https://choosealicense.com/licenses/apache)
