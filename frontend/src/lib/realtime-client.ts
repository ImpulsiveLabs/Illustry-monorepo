const REALTIME_CLIENT_ID_KEY = 'illustry:realtime-client-id';

const createRealtimeClientId = () => (
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const getRealtimeClientId = (): string => {
  if (typeof window === 'undefined') {
    return createRealtimeClientId();
  }

  try {
    const existing = window.sessionStorage.getItem(REALTIME_CLIENT_ID_KEY);
    if (existing) {
      return existing;
    }

    const nextClientId = createRealtimeClientId();
    window.sessionStorage.setItem(REALTIME_CLIENT_ID_KEY, nextClientId);
    return nextClientId;
  } catch {
    return createRealtimeClientId();
  }
};

const closeRealtimeSocket = (socket: WebSocket | undefined): void => {
  if (!socket) {
    return;
  }

  if (socket.readyState === WebSocket.CONNECTING) {
    socket.onopen = () => socket.close();
    return;
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
};

type RealtimePayload = {
  type?: string;
  action?: 'created' | 'updated' | 'deleted' | 'shared' | 'theme-updated';
  originClientId?: string;
}

export { getRealtimeClientId, closeRealtimeSocket, REALTIME_CLIENT_ID_KEY };
export type { RealtimePayload };
