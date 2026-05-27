# @illustry/mcp

Model Context Protocol stdio server for Illustry automation.

The MCP server gives agents the same Illustry surface as the CLI: local/offline workflows, live backend workflows, auth/session flows, imports, exports, lists, deletes, and structured errors.

## Run

```bash
yarn workspace @illustry/mcp build:ts
node packages/mcp/dist/index.js
```

Or through the package binary:

```bash
illustry-mcp
```

The server uses MCP JSON-RPC messages over stdio with `Content-Length` framing.

## Modes

MCP tools are stateless by design. Each tool call chooses its mode from arguments:

- Omit `server` for offline/local mode.
- Provide `server` for live/backend mode.

Live calls that require auth also need `cookie` and `csrfToken`, unless the call itself is `illustry_auth_login` or `illustry_auth_signup`.

Auth tools return a `session` object:

```json
{
  "session": {
    "baseUrl": "http://localhost:7001",
    "cookie": "illustry_sid=...; illustry_csrf=...",
    "csrfToken": "...",
    "user": {
      "email": "you@example.com"
    }
  }
}
```

MCP clients should pass that `cookie` and `csrfToken` into later live tool calls.

## Tools

### Status

- `illustry_status`

Offline:

```json
{
  "workspace": ".illustry"
}
```

Live:

```json
{
  "server": "http://localhost:7001"
}
```

### Auth

- `illustry_auth_login`
- `illustry_auth_signup`
- `illustry_auth_logout`
- `illustry_auth_session`
- `illustry_auth_verify_email`
- `illustry_auth_resend_verification`
- `illustry_auth_forgot_password`
- `illustry_auth_reset_password`

Examples:

```json
{
  "server": "http://localhost:7001",
  "email": "you@example.com",
  "password": "secret"
}
```

```json
{
  "server": "http://localhost:7001",
  "token": "verification-token"
}
```

```json
{
  "server": "http://localhost:7001",
  "email": "you@example.com",
  "code": "123456"
}
```

### Imports

- `illustry_import_visualization`

Supported offline source formats:

- JSON
- CSV
- XLSX
- XML

Offline:

```json
{
  "workspace": ".illustry",
  "filePath": "./data.csv",
  "name": "Sales",
  "type": "bar-chart"
}
```

Live:

```json
{
  "server": "http://localhost:7001",
  "cookie": "illustry_sid=...; illustry_csrf=...",
  "csrfToken": "...",
  "filePath": "./data.csv",
  "name": "Sales",
  "type": "bar-chart",
  "project": "Default"
}
```

### Listing

- `illustry_list_assets`

Offline lists local assets.

Live browses:

- `projects`
- `visualizations`
- `dashboards`

```json
{
  "server": "http://localhost:7001",
  "resource": "visualizations",
  "text": "sales",
  "page": "2",
  "sort": "name",
  "sharedScope": "external"
}
```

### Exports

- `illustry_export_asset`

Offline export formats:

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

Multiple formats are bundled into ZIP.

```json
{
  "workspace": ".illustry",
  "asset": "Sales",
  "format": "svg,png,excel",
  "outputDir": "exports"
}
```

Live exports call the backend bundle endpoint. Live exports need chart payloads. Provide `chartFile` or keep a matching local workspace asset.

```json
{
  "server": "http://localhost:7001",
  "cookie": "illustry_sid=...; illustry_csrf=...",
  "csrfToken": "...",
  "resource": "dashboard",
  "asset": "Executive Dashboard",
  "format": "svg,png,excel",
  "chartFile": "./chart.json",
  "outputDir": "exports"
}
```

`chartFile` accepts:

```json
{ "option": { "series": [] } }
```

```json
{ "charts": [{ "title": "Chart", "option": { "series": [] } }] }
```

```json
[{ "title": "Chart", "option": { "series": [] } }]
```

### Deletes

- `illustry_delete_resource`

Offline:

```json
{
  "workspace": ".illustry",
  "resource": "assets",
  "name": "Sales"
}
```

Live:

```json
{
  "server": "http://localhost:7001",
  "cookie": "illustry_sid=...; illustry_csrf=...",
  "csrfToken": "...",
  "resource": "visualizations",
  "name": "Sales",
  "type": "bar-chart",
  "project": "Default"
}
```

## MCP Protocol Coverage

The server supports:

- `initialize`
- `notifications/initialized`
- `tools/list`
- `tools/call`
- `resources/list`
- `prompts/list`

Unknown methods return JSON-RPC `-32601`.

Tool/argument errors return JSON-RPC `-32602`.

Backend/internal failures return JSON-RPC `-32603`.

## Tests

```bash
yarn workspace @illustry/mcp lint
yarn workspace @illustry/mcp test --runInBand
```

The MCP test suite covers protocol negotiation, tool discovery, framing, stdio server injection, offline and live workflows, auth/session flows, imports, exports, deletes, chart-file shapes, backend errors, malformed frames, invalid requests, missing arguments, unsupported resources, and structured JSON-RPC errors.

Current MCP coverage is 100% lines and 100% functions.

## Publishing To npm

The MCP package is publishable as a normal scoped npm package:

```bash
npm install -g @illustry/mcp
illustry-mcp
```

The package depends on `@illustry/core` by semver instead of `workspace:*`, so external MCP clients can install it from npm.

Publishing is handled by the GitHub Actions workflow at `.github/workflows/publish-packages.yml`.

- Pushes to `main` that change the MCP publish a new `minor` version automatically.
- Manual workflow runs can publish `patch`, `minor`, `major`, or `none` bumps.
- Manual workflow runs can publish to npm, GitHub Packages, or both.
- If `@illustry/core` changes, the workflow releases the MCP too so the MCP dependency range points at the new core version.

Local build and manual fallback:

```bash
yarn workspace @illustry/types build:ts
yarn workspace @illustry/core build:ts
yarn workspace @illustry/mcp build:ts
yarn workspace @illustry/mcp npm publish --access public
```
