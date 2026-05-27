# @illustry/cli

Terminal frontend for Illustry local and live workflows.

The CLI is designed to be usable instead of the browser UI when you need automation, remote work, imports, exports, or a keyboard-driven terminal experience.

## Modes

Illustry CLI always works in one of two modes:

- `offline`: uses a local `.illustry` workspace and does not need the backend, UI, database, Redis, or MongoDB.
- `live`: connects to the real Illustry backend and uses real auth/session/CSRF-backed API calls.

Interactive and plain output always show the current mode. JSON output is kept clean for automation.

```bash
illustry status
illustry mode offline
illustry connect --server http://localhost:7001
illustry disconnect
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
- Live-only actions are shown only in live mode.
- Offline-only actions are shown only in offline mode.

The shell keeps the current mode, workspace, server, session, and asset count visible.

For scripted tests or non-TTY startup:

```bash
illustry shell --once --mode offline
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

Offline imports parse, validate, preview, and save files locally through `@illustry/core`.

Supported source formats:

- JSON
- CSV
- XLSX
- XML

```bash
illustry import ./data.csv --name Sales --type bar-chart
illustry import visualization --file ./data.xlsx --name Workbook
```

In live mode, imports upload to the backend:

```bash
illustry connect --server http://localhost:7001
illustry login --email you@example.com --password secret
illustry import ./data.csv --name Sales --type bar-chart --project Default
```

## Listing

```bash
illustry list assets
illustry list projects
illustry list visualizations --text sales --page 2 --sort name
illustry list dashboards --shared-scope external
```

Offline mode lists local `assets`.

Live mode lists backend `projects`, `visualizations`, and `dashboards`.

## Exports

Offline exports render real visualization output through `@illustry/core`.

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

```bash
illustry export --asset Sales --format svg,png,excel --out exports
illustry export --asset Sales --format json
```

Live exports call the backend bundle endpoints. Because the backend export API needs chart render payloads, pass `--chart-file` or keep a matching local workspace asset with chart data.

```bash
illustry export \
  --resource dashboard \
  --asset "Executive Dashboard" \
  --format svg,png,excel \
  --chart-file chart.json \
  --out exports
```

## Deletes

```bash
illustry delete assets "Local Chart"
illustry delete projects "Project A"
illustry delete dashboards "Dashboard A"
illustry delete visualizations "Sales" --type bar-chart --project Default
```

## Machine-Readable Mode

Use `--json` for automation and CI:

```bash
illustry status --json
illustry list visualizations --json
illustry export --asset Sales --format svg --json
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
- mode
- workspace
- server URL
- session cookie and CSRF token after login/signup

## Error Coverage

The CLI handles:

- invalid mode
- missing workspace/server/file/asset/resource
- malformed JSON/CSV/XLSX/XML imports
- invalid chart files
- unsupported resources and export resources
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

The CLI suite covers direct commands, compatibility commands, interactive startup, offline and live modes, auth/session persistence, imports, exports, deletes, invalid inputs, backend routing, JSON mode, and mode-aware plain output.

## Publishing To npm

The CLI can be published as a normal npm package:

```bash
npm install -g @illustry/cli
illustry status
```

The package does not use `workspace:*` in publish-facing dependencies. It depends on `@illustry/core` by semver, so npm consumers can install it normally.

Publishing is handled by the GitHub Actions workflow at `.github/workflows/publish-packages.yml`.

- Pushes to `main` that change the CLI publish a new `minor` version automatically.
- Manual workflow runs can publish `patch`, `minor`, `major`, or `none` bumps.
- Manual workflow runs can publish to npm, GitHub Packages, or both.
- If `@illustry/core` changes, the workflow releases the CLI too so the CLI dependency range points at the new core version.

Local build and manual fallback:

```bash
yarn workspace @illustry/types build:ts
yarn workspace @illustry/core build:ts
yarn workspace @illustry/cli build:ts
yarn workspace @illustry/cli npm publish --access public
```
