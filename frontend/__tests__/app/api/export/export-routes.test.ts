import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getBackendUrlMock, buildBackendHeadersMock, fetchMock } = vi.hoisted(() => ({
  getBackendUrlMock: vi.fn(),
  buildBackendHeadersMock: vi.fn(),
  fetchMock: vi.fn()
}));

vi.mock('@/lib/backend-url', () => ({
  default: getBackendUrlMock
}));

vi.mock('@/lib/auth-request', () => ({
  buildBackendHeaders: buildBackendHeadersMock
}));

vi.stubGlobal('fetch', fetchMock);

import { POST as postDashboardExport } from '@/app/api/export/dashboard/route';
import { POST as postVisualizationExport } from '@/app/api/export/visualization/route';

describe('export API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBackendUrlMock.mockReturnValue('https://backend.example');
    buildBackendHeadersMock.mockResolvedValue({ authorization: 'Bearer test' });
  });

  it('returns a clear error when the backend URL is not configured', async () => {
    getBackendUrlMock.mockReturnValue(null);

    const response = await postDashboardExport(new Request('http://localhost/api/export/dashboard', {
      method: 'POST',
      body: JSON.stringify({ formats: ['png'] })
    }));

    await expect(response.json()).resolves.toEqual({ error: 'Backend URL is not configured' });
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards JSON dashboard export requests and preserves bundle headers', async () => {
    fetchMock.mockResolvedValue(new Response('zip-bytes', {
      status: 200,
      headers: {
        'content-type': 'application/zip',
        'content-disposition': 'attachment; filename="dashboard.zip"',
        'x-illustry-bundled': 'true'
      }
    }));

    const response = await postDashboardExport(new Request('http://localhost/api/export/dashboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formats: ['png', 'svg'] })
    }));

    expect(fetchMock).toHaveBeenCalledWith('https://backend.example/api/dashboard/export/bundle', {
      method: 'POST',
      headers: { authorization: 'Bearer test' },
      body: JSON.stringify({ formats: ['png', 'svg'] }),
      cache: 'no-store'
    });
    expect(buildBackendHeadersMock).toHaveBeenCalledWith({ asJson: true, withCsrf: true });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/zip');
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="dashboard.zip"');
    expect(response.headers.get('x-illustry-bundled')).toBe('true');
    await expect(response.text()).resolves.toBe('zip-bytes');
  });

  it('forwards multipart visualization export requests without JSON headers', async () => {
    fetchMock.mockResolvedValue(new Response('xlsx-bytes', {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }));
    const formData = new FormData();
    formData.set('formats', 'xlsx');

    await postVisualizationExport(new Request('http://localhost/api/export/visualization', {
      method: 'POST',
      body: formData
    }));

    expect(fetchMock).toHaveBeenCalledWith('https://backend.example/api/visualization/export/bundle', expect.objectContaining({
      method: 'POST',
      cache: 'no-store'
    }));
    const forwardedBody = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(forwardedBody.get('formats')).toBe('xlsx');
    expect(buildBackendHeadersMock).toHaveBeenCalledWith({ asJson: false, withCsrf: true });
  });

  it('returns backend export errors without hiding the message', async () => {
    fetchMock.mockResolvedValue(new Response('Unable to export visualization.', { status: 422 }));

    const response = await postVisualizationExport(new Request('http://localhost/api/export/visualization', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formats: [] })
    }));

    await expect(response.json()).resolves.toEqual({ error: 'Unable to export visualization.' });
    expect(response.status).toBe(422);
  });
});
