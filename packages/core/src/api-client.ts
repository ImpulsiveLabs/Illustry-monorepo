import { openAsBlob, promises as fs } from 'fs';
import path from 'path';
import { IllustryError } from './errors';

type IllustryApiClientOptions = {
  baseUrl: string;
  token?: string;
  cookie?: string;
  csrfToken?: string;
  locale?: string;
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

type IllustryAuthUser = {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  roles: string[];
  hasAvatar: boolean;
  avatarUpdatedAt?: string;
};

type IllustrySessionSnapshot = {
  baseUrl: string;
  cookie?: string;
  csrfToken?: string;
  user?: IllustryAuthUser | null;
};

type AuthResponse = {
  user: IllustryAuthUser | null;
};

type LoginRequest = {
  email: string;
  password: string;
};

type SignupRequest = LoginRequest & {
  name: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_CSRF_COOKIE_NAME || 'illustry_csrf';

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
  private cookie?: string;
  private csrfToken?: string;
  private user?: IllustryAuthUser | null;
  private readonly locale?: string;
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
    this.locale = options.locale;
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
    if (this.locale) {
      next.set('X-Illustry-Locale', this.locale);
      next.set('Accept-Language', this.locale);
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

  private extractSetCookie(headers: Headers) {
    const withNodeHelper = headers as Headers & { getSetCookie?: () => string[] };
    if (typeof withNodeHelper.getSetCookie === 'function') {
      return withNodeHelper.getSetCookie()
        .flatMap((value) => value.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((item) => item.trim()));
    }
    const value = headers.get('set-cookie');
    if (!value) {
      return [];
    }
    return value.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((item) => item.trim());
  }

  private applyResponseCookies(response: Response) {
    const setCookies = this.extractSetCookie(response.headers);
    if (setCookies.length === 0) {
      return;
    }

    const current = new Map<string, string>();
    (this.cookie || '').split(';').map((item) => item.trim()).filter(Boolean).forEach((item) => {
      const separator = item.indexOf('=');
      if (separator > 0) {
        current.set(item.slice(0, separator), item.slice(separator + 1));
      }
    });

    setCookies.forEach((header) => {
      const [pair] = header.split(';');
      const separator = pair.indexOf('=');
      if (separator <= 0) {
        return;
      }
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const isCleared = value === '' || /max-age=0/i.test(header) || /expires=Thu,\s*01 Jan 1970/i.test(header);
      if (isCleared) {
        current.delete(name);
      } else {
        current.set(name, value);
      }
      if (name === CSRF_COOKIE_NAME) {
        this.csrfToken = isCleared ? undefined : decodeURIComponent(value);
      }
    });

    this.cookie = Array.from(current.entries()).map(([name, value]) => `${name}=${value}`).join('; ') || undefined;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    this.applyResponseCookies(response);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson
      ? await response.json().catch(() => undefined)
      : await response.text().catch(() => '');

    if (!response.ok) {
      const message = typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : typeof payload === 'string' && payload.length > 0
          ? payload
          : `Illustry API request failed with ${response.status}.`;
      throw new IllustryError(message, {
        code: response.status === 401
          ? 'ILLUSTRY_SESSION_EXPIRED'
          : response.status === 403
            ? 'ILLUSTRY_PERMISSION_DENIED'
            : 'ILLUSTRY_API_REQUEST_FAILED',
        status: response.status
      });
    }

    return payload;
  }

  private async request(
    route: string,
    options: RequestOptions = {},
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<unknown> {
    const headers = this.buildHeaders(options.headers);
    const response = await this.fetchImpl(this.buildUrl(route, query), {
      ...options,
      headers
    });
    return this.parseResponse(response);
  }

  getSessionSnapshot(): IllustrySessionSnapshot {
    return {
      baseUrl: this.baseUrl,
      cookie: this.cookie,
      csrfToken: this.csrfToken,
      user: this.user
    };
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

  async login(payload: LoginRequest) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }) as AuthResponse;
    this.user = response.user;
    return response;
  }

  async signup(payload: SignupRequest) {
    const body = new FormData();
    body.set('email', payload.email);
    body.set('password', payload.password);
    body.set('name', payload.name);
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body
    }) as AuthResponse;
    this.user = response.user;
    return response;
  }

  async logout() {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' }
    });
    this.user = null;
    this.cookie = undefined;
    this.csrfToken = undefined;
    return response;
  }

  async me() {
    const user = await this.request('/api/auth/me') as IllustryAuthUser;
    this.user = user;
    return user;
  }

  async refresh() {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' }
    });
  }

  async rotateCsrf() {
    const response = await this.request('/api/auth/csrf') as { csrfToken?: string };
    if (response.csrfToken) {
      this.csrfToken = response.csrfToken;
    }
    return response;
  }

  async verifyEmail(token: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token })
    });
  }

  async verifyEmailCode(email: string, code: string) {
    return this.request('/api/auth/verify-email-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
  }

  async resendVerification(email?: string) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(email ? { email } : {})
    });
  }

  async requestPasswordReset(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
  }

  async createProject(payload: {
    projectName: string;
    projectDescription?: string;
    isActive?: boolean;
  }) {
    return this.request('/api/project', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async updateProject(payload: { name: string; description?: string; isActive?: boolean }) {
    return this.request('/api/project', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async deleteProject(name: string) {
    return this.request('/api/project', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async findProject(name: string) {
    return this.request(`/api/project/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
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

  async createDashboard(payload: { name: string; description?: string; visualizations?: unknown[] }) {
    return this.request('/api/dashboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async updateDashboard(payload: {
    name: string;
    description?: string;
    visualizations?: unknown[];
    layouts?: unknown;
  }) {
    return this.request('/api/dashboard', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async deleteDashboard(name: string) {
    return this.request('/api/dashboard', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  async updateVisualization(payload: { name: string; type?: string; theme?: unknown }) {
    return this.request('/api/visualization', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async deleteVisualization(payload: { name: string; type?: string; projectName?: string }) {
    return this.request('/api/visualization', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async downloadExport({ resource, name, query, body }: ExportRequest) {
    const route = resource === 'dashboard' ? '/api/dashboard/export/bundle' : '/api/visualization/export/bundle';
    const response = await this.fetchImpl(this.buildUrl(route, { name, ...query }), {
      method: 'POST',
      headers: this.buildHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify(body)
    });
    this.applyResponseCookies(response);
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new IllustryError(message || `Illustry export failed with ${response.status}.`, {
        code: response.status === 401 ? 'ILLUSTRY_SESSION_EXPIRED' : 'ILLUSTRY_EXPORT_REQUEST_FAILED',
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
  AuthResponse,
  ExportRequest,
  BrowseRequest,
  IllustryAuthUser,
  IllustryApiClientOptions,
  IllustryFetch,
  IllustrySessionSnapshot,
  LoginRequest,
  RequestOptions,
  ServerResource,
  SignupRequest,
  UploadVisualizationSourceRequest
};
