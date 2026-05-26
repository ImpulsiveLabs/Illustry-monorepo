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
