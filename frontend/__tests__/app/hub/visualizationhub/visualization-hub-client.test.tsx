import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VisualizationHubClient from '@/app/(hub)/visualizationhub/visualization-hub-client';

const {
  replace, refresh, toastError
} = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh })
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    promise: vi.fn()
  }
}));

vi.mock('@/components/shells/hub-shell', () => ({
  default: ({ data }: any) => <div data-testid="hub-shell">{data?.name}</div>
}));

describe('VisualizationHubClient realtime', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.sessionStorage.setItem('illustry:realtime-client-id', 'test-client');
  });

  it('subscribes to shared visualizations and handles live events without self-refreshing', async () => {
    const sockets: Array<{
      url: string;
      close: ReturnType<typeof vi.fn>;
      onmessage?: (event: { data: string }) => void;
    }> = [];

    class MockWebSocket {
      url: string;

      close = vi.fn();

      onmessage?: (event: { data: string }) => void;

      onclose?: () => void;

      constructor(url: string) {
        this.url = url;
        sockets.push(this);
      }
    }

    vi.stubGlobal('WebSocket', MockWebSocket);
    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'https://api.example.com';

    const { unmount } = render(
      <VisualizationHubClient
        visualization={{
          name: 'Sales',
          type: 'bar-chart',
          shareId: 'viz_shared',
          data: {}
        } as any}
      />
    );

    expect(screen.getByTestId('hub-shell')).toHaveTextContent('Sales');
    expect(screen.queryByRole('button', { name: /save theme/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /use my theme/i })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(sockets.length).toBeGreaterThan(0);
    });

    const socket = sockets[sockets.length - 1];
    expect(socket.url).toBe('wss://api.example.com/api/realtime?resource=visualization&shareId=viz_shared&clientId=test-client');

    socket.onmessage?.({ data: JSON.stringify({ type: 'connected' }) });
    expect(refresh).not.toHaveBeenCalled();

    socket.onmessage?.({ data: JSON.stringify({ action: 'updated' }) });
    expect(refresh).toHaveBeenCalledTimes(1);

    socket.onmessage?.({ data: JSON.stringify({ action: 'updated', originClientId: 'test-client' }) });
    expect(refresh).toHaveBeenCalledTimes(1);

    socket.onmessage?.({ data: 'not-json' });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();

    socket.onmessage?.({ data: JSON.stringify({ action: 'deleted' }) });
    expect(toastError).toHaveBeenCalledWith('This visualization was deleted by its owner.');
    expect(replace).toHaveBeenCalledWith('/');
    expect(socket.close).toHaveBeenCalled();

    unmount();
  });

  it('subscribes inherited dashboard visualizations to their dashboard share channel', async () => {
    const sockets: Array<{
      url: string;
      close: ReturnType<typeof vi.fn>;
      onmessage?: (event: { data: string }) => void;
    }> = [];

    class MockWebSocket {
      url: string;

      close = vi.fn();

      onmessage?: (event: { data: string }) => void;

      onclose?: () => void;

      constructor(url: string) {
        this.url = url;
        sockets.push(this);
      }
    }

    vi.stubGlobal('WebSocket', MockWebSocket);
    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'https://api.example.com';

    render(
      <VisualizationHubClient
        visualization={{
          name: 'Sales',
          type: 'bar-chart',
          sourceType: 'dashboard',
          sourceDashboardId: 'dash_shared',
          isExternal: true,
          data: {}
        } as any}
      />
    );

    await waitFor(() => {
      expect(sockets.length).toBeGreaterThan(0);
    });

    const socket = sockets[sockets.length - 1];
    expect(socket.url).toBe('wss://api.example.com/api/realtime?resource=dashboard&shareId=dash_shared&clientId=test-client');
    socket.onmessage?.({ data: JSON.stringify({ action: 'theme-updated' }) });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
