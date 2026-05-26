# @illustry/cli

Scriptable Illustry command line workflows built on `@illustry/core`.

The CLI works locally without the Illustry server, UI, or database:

```bash
illustry import visualization --file data.csv --name Sales --workspace .illustry
illustry list --workspace .illustry --json
illustry export --asset Sales --format svg,png,excel --out exports --workspace .illustry
```

Use `--server http://localhost:7001` on commands that support server-backed mode.
