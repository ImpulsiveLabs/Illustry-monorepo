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

type RealtimePayload = {
  type?: string;
  action?: 'created' | 'updated' | 'deleted' | 'shared' | 'theme-updated';
  originClientId?: string;
}

export { getRealtimeClientId, REALTIME_CLIENT_ID_KEY };
export type { RealtimePayload };
