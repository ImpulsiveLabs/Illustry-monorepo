import { openAsBlob, promises as fs } from 'fs';
import path from 'path';
import { IllustryError } from './errors';

type IllustryApiClientOptions = {
  baseUrl: string;
  token?: string;
  cookie?: string;
  csrfToken?: string;
  fetchImpl?: IllustryFetch;
};

type RequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  duplex?: 'half';
};

type IllustryFetch = (input: string | URL, init?: RequestOptions) => Promise<Response>;

type ExportRequest = {
  resource: 'visualization' | 'dashboard';
  name: string;
  query?: Record<string, string | number | boolean | undefined>;
  body: Record<string, unknown>;
};

type ServerResource = 'projects' | 'visualizations' | 'dashboards';

type BrowseRequest = {
  resource: ServerResource;
  query?: Record<string, unknown>;
};

type UploadVisualizationSourceRequest = {
  filePath: string;
  contentType?: string;
  visualizationDetails?: Record<string, unknown>;
  fileDetails?: Record<string, unknown>;
  fullDetails?: boolean;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getFetch = (fetchImpl?: IllustryFetch): IllustryFetch => {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch !== 'undefined') return fetch;
  throw new IllustryError('Fetch is not available in this runtime.', {
    code: 'ILLUSTRY_FETCH_UNAVAILABLE'
  });
};

class IllustryApiClient {
  readonly baseUrl: string;
  private readonly token?: string;
  private readonly cookie?: string;
  private readonly csrfToken?: string;
  private readonly fetchImpl: IllustryFetch;

  constructor(options: IllustryApiClientOptions) {
    if (!options.baseUrl) {
      throw new IllustryError('A base URL is required for server-backed Illustry operations.', {
        code: 'ILLUSTRY_BASE_URL_REQUIRED'
      });
    }
    this.baseUrl = trimTrailingSlash(options.baseUrl);
    this.token = options.token;
    this.cookie = options.cookie;
    this.csrfToken = options.csrfToken;
    this.fetchImpl = getFetch(options.fetchImpl);
  }

  private buildHeaders(headers?: HeadersInit) {
    const next = new Headers(headers);
    if (this.token) {
      next.set('Authorization', `Bearer ${this.token}`);
    }
    if (this.cookie) {
      next.set('Cookie', this.cookie);
    }
    if (this.csrfToken) {
      next.set('X-CSRF-Token', this.csrfToken);
    }
    return next;
  }

  private buildUrl(route: string, query?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(route.replace(/^\//, ''), `${this.baseUrl}/`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
    return url;
  }

  private async request(route: string, options: RequestOptions = {}): Promise<unknown> {
    const headers = this.buildHeaders(options.headers);
    const response = await this.fetchImpl(this.buildUrl(route), {
      ...options,
      headers
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new IllustryError(text || `Illustry API request failed with ${response.status}.`, {
        code: 'ILLUSTRY_API_REQUEST_FAILED',
        status: response.status
      });
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  async health() {
    return this.request('/health').catch(() => this.request('/'));
  }

  async listProjects() {
    return this.browse({ resource: 'projects' });
  }

  async listVisualizations() {
    return this.browse({ resource: 'visualizations' });
  }

  async listDashboards() {
    return this.browse({ resource: 'dashboards' });
  }

  async browse({ resource, query = {} }: BrowseRequest) {
    return this.request(`/api/${resource}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(query)
    });
  }

  async findVisualization(name: string, type?: string) {
    return this.request(`/api/visualization/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type })
    });
  }

  async findDashboard(name: string, fullVisualizations = true) {
    return this.request(`/api/dashboard/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullVisualizations })
    });
  }

  async downloadExport({ resource, name, query, body }: ExportRequest) {
    const route = resource === 'dashboard' ? '/api/dashboard/export/bundle' : '/api/visualization/export/bundle';
    const response = await this.fetchImpl(this.buildUrl(route, { name, ...query }), {
      method: 'POST',
      headers: this.buildHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new IllustryError(await response.text(), {
        code: 'ILLUSTRY_EXPORT_REQUEST_FAILED',
        status: response.status
      });
    }
    const arrayBuffer = await response.arrayBuffer();
    const disposition = response.headers.get('content-disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `${name}.bin`;
    return {
      buffer: Buffer.from(arrayBuffer),
      filename,
      mimeType: response.headers.get('content-type') || 'application/octet-stream'
    };
  }

  async uploadRawFile(route: string, filePath: string, contentType = 'application/octet-stream') {
    const stat = await fs.stat(filePath);
    const body = await openAsBlob(filePath, { type: contentType });
    return this.request(route, {
      method: 'POST',
      headers: {
        'content-disposition': `attachment; filename="${path.basename(filePath)}"`,
        'content-type': contentType,
        'x-illustry-file-size': String(stat.size)
      },
      body,
      duplex: 'half'
    });
  }

  async uploadVisualizationSource({
    filePath,
    contentType = 'application/octet-stream',
    visualizationDetails,
    fileDetails,
    fullDetails = false
  }: UploadVisualizationSourceRequest) {
    const body = new FormData();
    const file = await openAsBlob(filePath, { type: contentType });
    body.append('file', file, path.basename(filePath));
    if (visualizationDetails) {
      body.append('visualizationDetails', JSON.stringify(visualizationDetails));
    }
    if (fileDetails) {
      body.append('fileDetails', JSON.stringify(fileDetails));
    }
    body.append('fullDetails', String(fullDetails));

    return this.request('/api/visualization', {
      method: 'POST',
      body,
      duplex: 'half'
    });
  }
}

export {
  IllustryApiClient
};
export type {
  ExportRequest,
  BrowseRequest,
  IllustryApiClientOptions,
  IllustryFetch,
  RequestOptions,
  ServerResource,
  UploadVisualizationSourceRequest
};
