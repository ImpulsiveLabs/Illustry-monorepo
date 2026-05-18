'use client';

import { VisualizationTypes } from '@illustry/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import HubShell from '@/components/shells/hub-shell';
import {
  ThemeColorsProvider,
  readCachedThemeColors,
  useThemeColors,
  useThemeColorsDispach,
  type ThemeColors
} from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { updateVisualization } from '@/app/_actions/visualization';
import { catchError } from '@/lib/utils';

type VisualizationHubClientProps = {
  visualization: VisualizationTypes.VisualizationType | null;
}

const getVisualizationUpdateIdentity = (visualization: VisualizationTypes.VisualizationType) => (
  visualization.shareId && visualization.isExternal
    ? { shareId: visualization.shareId }
    : { name: visualization.name, type: visualization.type }
);

const VisualizationThemeToolbar = ({
  visualization
}: VisualizationHubClientProps) => {
  const router = useRouter();
  const displayedTheme = useThemeColors();
  const themeDispatch = useThemeColorsDispach();

  if (!visualization) {
    return null;
  }

  const canEditTheme = !visualization.isExternal
    || visualization.currentUserRole === 'owner'
    || visualization.currentUserRole === 'editor';

  if (!canEditTheme) {
    return null;
  }

  const saveTheme = (theme: ThemeColors, successMessage: string) => {
    toast.promise(
      updateVisualization({
        ...getVisualizationUpdateIdentity(visualization),
        theme: theme as unknown as Record<string, unknown>
      }),
      {
        loading: 'Saving visualization theme',
        success: () => {
          router.refresh();
          return successMessage;
        },
        error: (err: unknown) => catchError(err)
      }
    );
  };

  return (
    <div className="flex flex-wrap justify-end gap-2 border-b bg-background p-2" data-export-exclude="true">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => saveTheme(displayedTheme, 'Visualization theme saved')}
      >
        Save theme
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          const cachedTheme = readCachedThemeColors('default');
          if (!cachedTheme) {
            saveTheme(displayedTheme, 'Visualization theme saved');
            return;
          }
          themeDispatch?.({ type: 'apply', modifiedData: cachedTheme });
          saveTheme(cachedTheme, 'Visualization theme updated from your theme');
        }}
      >
        Use my theme
      </Button>
    </div>
  );
};

const VisualizationHubClient = ({
  visualization
}: VisualizationHubClientProps) => {
  const router = useRouter();

  useEffect(() => {
    if (
      !visualization?.shareId
      || !process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL
      || typeof WebSocket === 'undefined'
    ) {
      return undefined;
    }

    const url = new URL('/api/realtime', process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('resource', 'visualization');
    url.searchParams.set('shareId', visualization.shareId);

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;
    let closedByComponent = false;

    const connect = () => {
      socket = new WebSocket(url.toString());
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; action?: string };
          if (payload.type === 'connected') {
            return;
          }
          if (payload.action === 'deleted') {
            router.replace('/visualizations?scope=external');
            router.refresh();
            return;
          }
          router.refresh();
        } catch {
          router.refresh();
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
  }, [router, visualization?.shareId]);

  const content = (
    <>
      <VisualizationThemeToolbar visualization={visualization} />
      <HubShell data={visualization} fullScreen filter legend useDataTheme={false} />
    </>
  );

  if (visualization?.theme) {
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
