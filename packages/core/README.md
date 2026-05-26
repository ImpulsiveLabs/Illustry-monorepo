# @illustry/core

Reusable local-first SDK primitives for Illustry automation.

The core package is intentionally independent from the Illustry web UI and backend database. It provides:

- local workspace storage in `.illustry`
- source-file validation shared by automation flows
- local visualization imports from JSON, XML, CSV, and XLSX
- local exports to JSON, SVG, PNG, JPG, WEBP, web component HTML, XLSX, PDF, DOCX, and PPTX
- optional HTTP API client for server-backed operations

Example:

```ts
import {
  LocalIllustryStore,
  createLocalExportBundle,
  importVisualizationSource
} from '@illustry/core';

const store = new LocalIllustryStore({ rootDir: '.illustry' });
const imported = await importVisualizationSource({ filePath: 'data.csv', name: 'Sales' });
const asset = await store.saveAsset(imported);
const bundle = await createLocalExportBundle({ asset, formats: ['svg', 'excel'] });
await store.writeExportFile(bundle, 'exports');
```

Use `IllustryApiClient` only when a running Illustry server should be the transport.

Server-backed example:

```ts
import { IllustryApiClient } from '@illustry/core';

const client = new IllustryApiClient({
  baseUrl: 'http://localhost:7001',
  cookie: 'illustry_session=...; illustry_csrf=...',
  csrfToken: '...'
});

await client.browse({ resource: 'visualizations' });
await client.uploadVisualizationSource({
  filePath: 'data.csv',
  contentType: 'text/csv',
  visualizationDetails: { name: 'Sales', type: 'bar-chart', projectName: 'Default' }
});
```
