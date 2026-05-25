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

import { POST } from '@/app/api/office/visualization/preview/route';

describe('office visualization preview API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBackendUrlMock.mockReturnValue('https://backend.example');
    buildBackendHeadersMock.mockResolvedValue({ authorization: 'Bearer test' });
  });

  it('returns a clear error when the backend URL is not configured', async () => {
    getBackendUrlMock.mockReturnValue(null);

    const response = await POST(new Request('http://localhost/api/office/visualization/preview', {
      method: 'POST',
      body: JSON.stringify({ name: 'Calendar' })
    }));

    await expect(response.json()).resolves.toEqual({ error: 'Backend URL is not configured' });
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards preview payloads to the backend', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ imageDataUrl: 'data:image/png;base64,abc' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));

    const response = await POST(new Request('http://localhost/api/office/visualization/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Calendar', type: 'calendar' })
    }));

    expect(fetchMock).toHaveBeenCalledWith('https://backend.example/api/office/visualization/preview', {
      method: 'POST',
      headers: { authorization: 'Bearer test' },
      body: JSON.stringify({ name: 'Calendar', type: 'calendar' }),
      cache: 'no-store'
    });
    expect(buildBackendHeadersMock).toHaveBeenCalledWith({ asJson: true, withCsrf: true });
    await expect(response.json()).resolves.toEqual({ imageDataUrl: 'data:image/png;base64,abc' });
    expect(response.status).toBe(200);
  });

  it('returns a safe fallback when the backend sends invalid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 502 }));

    const response = await POST(new Request('http://localhost/api/office/visualization/preview', {
      method: 'POST',
      body: JSON.stringify({ name: 'Calendar' })
    }));

    await expect(response.json()).resolves.toEqual({ error: 'Unable to parse backend response' });
    expect(response.status).toBe(502);
  });
});
