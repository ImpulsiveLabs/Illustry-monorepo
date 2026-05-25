'use client';

import { VisualizationTypes } from '@illustry/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import HubShell from '@/components/shells/hub-shell';
import {
  ThemeColorsProvider,
  type ThemeColors
} from '@/components/providers/theme-provider';
import { getRealtimeClientId, type RealtimePayload } from '@/lib/realtime-client';
import { useLocale } from '@/components/providers/locale-provider';

type VisualizationHubClientProps = {
  visualization: VisualizationTypes.VisualizationType | null;
}

const VisualizationHubClient = ({
  visualization
}: VisualizationHubClientProps) => {
  const router = useRouter();
  const { t } = useLocale();
  const realtimeClientId = useMemo(() => getRealtimeClientId(), []);
  const realtimeSubscription = useMemo(() => {
    if (visualization?.shareId) {
      return { resource: 'visualization', shareId: visualization.shareId };
    }
    if (visualization?.sourceType === 'dashboard' && visualization.sourceDashboardId) {
      return { resource: 'dashboard', shareId: visualization.sourceDashboardId };
    }
    return null;
  }, [visualization?.shareId, visualization?.sourceDashboardId, visualization?.sourceType]);

  useEffect(() => {
    if (
      !realtimeSubscription
      || !process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL
      || typeof WebSocket === 'undefined'
    ) {
      return undefined;
    }

    const url = new URL('/api/realtime', process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('resource', realtimeSubscription.resource);
    url.searchParams.set('shareId', realtimeSubscription.shareId);
    url.searchParams.set('clientId', realtimeClientId);

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;
    let closedByComponent = false;

    const connect = () => {
      socket = new WebSocket(url.toString());
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimePayload;
          if (payload.type === 'connected' || payload.originClientId === realtimeClientId) {
            return;
          }
          if (payload.action === 'deleted') {
            toast.error(
              realtimeSubscription.resource === 'dashboard'
                ? t('dashboard.deletedByOwner')
                : t('visualization.deletedByOwner')
            );
            closedByComponent = true;
            socket?.close();
            router.replace('/');
            return;
          }
          if (payload.action === 'updated' || payload.action === 'shared' || payload.action === 'theme-updated') {
            router.refresh();
          }
        } catch {
          // Ignore malformed realtime messages instead of disturbing the current session.
        }
      };
      socket.onclose = () => {
        if (!closedByComponent) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      closedByComponent = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [realtimeClientId, realtimeSubscription, router, t]);

  const content = (
    <HubShell
      data={visualization}
      fullScreen
      filter
      legend
      useDataTheme={Boolean(visualization?.isExternal)}
    />
  );

  if (visualization?.isExternal && visualization?.theme) {
    return (
      <ThemeColorsProvider
        initialTheme={visualization.theme as ThemeColors}
        persist={false}
        storageScope={`visualization:${visualization.shareId || `${visualization.name}:${visualization.type}`}`}
      >
        {content}
      </ThemeColorsProvider>
    );
  }

  return content;
};

export default VisualizationHubClient;
