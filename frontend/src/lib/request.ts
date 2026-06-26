/* eslint-disable no-console */

const DEFAULT_BACKEND_REQUEST_TIMEOUT_MS = 8000;

class BackendRequestError extends Error {
  status?: number;

  code?: string;

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message);
    this.name = 'BackendRequestError';
    this.status = options.status;
    this.code = options.code;
  }
}

const getBackendRequestTimeoutMs = () => {
  const parsed = Number(process.env.FRONTEND_BACKEND_REQUEST_TIMEOUT_MS || DEFAULT_BACKEND_REQUEST_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BACKEND_REQUEST_TIMEOUT_MS;
};

const makeRequest = <T>(
  request: RequestInfo,
  tags: string[]
): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, getBackendRequestTimeoutMs());

  return fetch(request, {
    cache: 'no-store',
    signal: controller.signal,
    next: {
      tags
    }
  })
  .then(async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
      throw new BackendRequestError(error, { status: response.status });
    }

    return payload as T;
  })
  .catch((error) => {
    if (error instanceof BackendRequestError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new BackendRequestError('Backend request timed out. Please check the backend and database connection.', {
        status: 504,
        code: 'BACKEND_REQUEST_TIMEOUT'
      });
    }

    throw error;
  })
  .finally(() => {
    clearTimeout(timeout);
  });
};

export default makeRequest;
export { BackendRequestError };
