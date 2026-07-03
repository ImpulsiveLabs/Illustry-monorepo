# @illustry/cli

Terminal frontend for Illustry live workflows.

The CLI is designed to be usable instead of the browser UI when you need automation, remote work, imports, or a keyboard-driven terminal experience.

## Online Mode

Illustry CLI connects to the real Illustry backend and uses real auth/session/CSRF-backed API calls.

```bash
illustry status
illustry connect --server http://localhost:7001
```

## Interactive Shell

Run:

```bash
illustry
# or
illustry shell
```

In a real terminal, the shell shows a colored mode-aware menu:

- Up/down arrows move between actions.
- Enter selects an action.
- `q` or Escape exits.

The shell keeps the current server and session visible.

For scripted tests or non-TTY startup:

```bash
illustry shell --once --mode live --url http://localhost:7001
```

## Auth

The CLI uses the backend's real cookie and CSRF auth flow. After login/signup, the session is persisted in the CLI config directory with `0600` permissions.

```bash
illustry login --email you@example.com --password secret
illustry signup --email you@example.com --password secret --name "Your Name"
illustry session
illustry logout
```

Supported account flows:

```bash
illustry verify-email --token TOKEN
illustry verify-email --email you@example.com --code 123456
illustry resend-verification --email you@example.com
illustry forgot-password --email you@example.com
illustry reset-password --token TOKEN --password new-secret
```

## Imports

Supported source formats:

- JSON
- CSV
- XLSX
- XML

```bash
illustry import ./data.csv --name Sales --type bar-chart
illustry import visualization --file ./data.xlsx --name Workbook
```

```bash
illustry connect --server http://localhost:7001
illustry login --email you@example.com --password secret
illustry import ./data.csv --name Sales --type bar-chart --project Default
```

## Listing

```bash
illustry list projects
illustry list visualizations --text sales --page 2 --sort name
illustry list dashboards --shared-scope external
```

Lists backend `projects`, `visualizations`, and `dashboards`.

## Exports

Supported formats:

- `json`
- `svg`
- `png`
- `jpg`
- `webp`
- `web-component`
- `excel`
- `pdf`
- `word`
- `ppt`

Multiple formats are bundled into a ZIP.

Exports are available from the interactive Dashboard and Visualization workflows.

## Deletes

```bash
illustry delete projects "Project A"
illustry delete dashboards "Dashboard A"
illustry delete visualizations "Sales" --type bar-chart --project Default
```

## Machine-Readable Mode

Use `--json` for automation and CI:

```bash
illustry status --json
illustry list visualizations --json
```

JSON mode does not include colored status prefixes.

## Config And Session Storage

Default config path:

```text
~/.config/illustry/config.json
```

Override it in tests or automation:

```bash
ILLUSTRY_CONFIG_DIR=/tmp/illustry-config illustry status
```

The config stores:

- active profile
- workspace
- server URL
- session cookie and CSRF token after login/signup

## Error Coverage

The CLI handles:

- invalid live mode selection
- missing workspace/server/file/asset/resource
- malformed JSON/CSV/XLSX/XML imports
- invalid chart files
- unsupported resources
- missing live chart payloads
- backend validation errors
- expired sessions
- missing/invalid auth fields
- permission/network/backend errors

## Tests

```bash
yarn workspace @illustry/cli lint
yarn workspace @illustry/cli test --runInBand
```

The CLI suite covers direct commands, compatibility commands, interactive startup, live mode, auth/session persistence, imports, exports, deletes, invalid inputs, backend routing, JSON mode, and mode-aware plain output.

## Publishing To npm

The CLI can be published as a normal npm package:

```bash
npm install -g @illustry/cli
illustry status
```

The package does not use `workspace:*` in publish-facing dependencies. It depends on `@illustry/core` by semver, so npm consumers can install it normally.

Publishing is handled by the GitHub Actions workflow at `.github/workflows/publish-packages.yml`.

- Pushes to `main` that change the CLI publish the package version already merged to `main`.
- Manual workflow runs can publish `patch`, `minor`, `major`, or `none` bumps. Version bumps try to push to `main` first and open a release PR if branch protection blocks the push.
- Manual workflow runs can publish to npm, GitHub Packages, or both.
- If `@illustry/core` changes, the workflow releases the CLI too so the CLI dependency range points at the new core version.

Local build and manual fallback:

```bash
yarn workspace @illustry/types build:ts
yarn workspace @illustry/core build:ts
yarn workspace @illustry/cli build:ts
yarn workspace @illustry/cli npm publish --access public
```
