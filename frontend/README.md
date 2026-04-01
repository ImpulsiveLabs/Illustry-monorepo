# Illustry frontend

This project is the Next.js frontend for Illustry.

## Auth flow

Frontend auth is cookie-based and works with backend secure cookies:

- Register, login, logout
- Email verification and resend
- Forgot/reset password
- Protected route layouts that require authenticated + verified users
- No access/refresh tokens stored in localStorage/sessionStorage

## Environment

Use `frontend/.env.example`:

- `BACKEND_INTERNAL_URL`
- `NEXT_PUBLIC_BACKEND_PUBLIC_URL`
- `NEXT_PUBLIC_AUTH_SESSION_COOKIE_NAME`
- `NEXT_PUBLIC_AUTH_CSRF_COOKIE_NAME`

## CSRF behavior

State-changing requests include `X-CSRF-Token` from the CSRF cookie.
Server actions forward browser cookies to backend and include CSRF headers for mutations.

## Local development

```bash
cd frontend
yarn install
yarn start:dev
```

## License

[Apache-2.0](https://choosealicense.com/licenses/apache)
