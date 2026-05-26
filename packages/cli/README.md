# @illustry/cli

Scriptable Illustry command line workflows built on `@illustry/core`.

The CLI works locally without the Illustry server, UI, or database:

```bash
illustry import visualization --file data.csv --name Sales --workspace .illustry
illustry list --workspace .illustry --json
illustry export --asset Sales --format svg,png,excel --out exports --workspace .illustry
```

Use `--server http://localhost:7001` on commands that support server-backed mode.

Server-backed mode uses the same commands with `--server`. Authenticated backend
mutations also need the Illustry session cookie and CSRF token:

```bash
illustry list \
  --server http://localhost:7001 \
  --resource visualizations \
  --cookie "illustry_session=...; illustry_csrf=..." \
  --csrf "..." \
  --json

illustry import visualization \
  --server http://localhost:7001 \
  --file data.csv \
  --name Sales \
  --type bar-chart \
  --project Default \
  --cookie "illustry_session=...; illustry_csrf=..." \
  --csrf "..."

illustry export \
  --server http://localhost:7001 \
  --asset Sales \
  --type bar-chart \
  --format svg,png \
  --workspace .illustry \
  --out exports \
  --cookie "illustry_session=...; illustry_csrf=..." \
  --csrf "..."
```

For server export, the backend still needs chart render payloads. The CLI uses
`--chart-file chart.json` when supplied, otherwise it uses a matching local
workspace asset by name.
