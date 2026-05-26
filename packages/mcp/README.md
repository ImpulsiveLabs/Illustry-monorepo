# @illustry/mcp

MCP-compatible stdio server for Illustry automation.

The server exposes local-first tools backed by `@illustry/core`, so agents can import, list, and export Illustry assets without opening the web UI or requiring the backend database.

Available tools:

- `illustry_status`
- `illustry_import_visualization`
- `illustry_list_assets`
- `illustry_export_asset`

Run locally:

```bash
illustry-mcp
```

The implementation uses standard JSON-RPC messages with MCP `Content-Length` stdio framing.

Each tool works locally by default. Add `server`, `cookie`, and `csrfToken`
arguments to route the same operation through a running Illustry backend:

- `illustry_list_assets` can browse `visualizations`, `dashboards`, or `projects`
- `illustry_import_visualization` uploads a source file to `/api/visualization`
- `illustry_export_asset` downloads a backend export bundle

Server exports need chart render payloads. Provide `chartFile`, or keep a local
workspace asset with the same name so the MCP server can send the chart data to
the backend export endpoint.
