import { IncomingMessage, Server as HttpServer } from 'http';
import { Duplex } from 'stream';
import { createClient } from 'redis';
import { WebSocket, WebSocketServer } from 'ws';
import logger from '../config/logger';

type RealtimeResource = 'dashboard' | 'visualization';

type RealtimeEvent = {
  resource: RealtimeResource;
  shareId: string;
  action: 'created' | 'updated' | 'deleted' | 'shared' | 'theme-updated';
  updatedAt: string;
};

type RealtimeSocket = WebSocket & {
  channelKey?: string;
  isAlive?: boolean;
};

type RedisConnection = ReturnType<typeof createClient>;
type RealtimeAuthorizer = (
  request: IncomingMessage,
  resource: RealtimeResource,
  shareId: string
) => Promise<void>;

const REALTIME_PATH = '/api/realtime';
const REDIS_CHANNEL = process.env.REDIS_REALTIME_CHANNEL || 'illustry:realtime';
const HEARTBEAT_INTERVAL_MS = Number(process.env.REALTIME_HEARTBEAT_INTERVAL_MS || 30000);

class RealtimeBroker {
  constructor(private readonly authorizer: RealtimeAuthorizer = authorizeRealtimeSubscription) {}

  private webSocketServer?: WebSocketServer;

  private heartbeat?: NodeJS.Timeout;

  private publisher?: RedisConnection;

  private subscriber?: RedisConnection;

  private redisReady = false;

  private redisConnectPromise?: Promise<void>;

  private readonly channels = new Map<string, Set<RealtimeSocket>>();

  attach(server: HttpServer): void {
    if (this.webSocketServer) {
      return;
    }

    this.webSocketServer = new WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
      void this.handleUpgrade(request, socket, head);
    });

    this.heartbeat = setInterval(() => {
      this.webSocketServer?.clients.forEach((socket) => {
        const realtimeSocket = socket as RealtimeSocket;
        if (realtimeSocket.isAlive === false) {
          realtimeSocket.terminate();
          return;
        }

        realtimeSocket.isAlive = false;
        realtimeSocket.ping();
      });
    }, HEARTBEAT_INTERVAL_MS);

    void this.connectRedis();
  }

  close(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }

    this.webSocketServer?.clients.forEach((client) => client.close());
    this.webSocketServer?.close();
    this.webSocketServer = undefined;
    this.channels.clear();

    void this.subscriber?.disconnect().catch((error) => logger.warn('Realtime Redis subscriber disconnect failed', error));
    void this.publisher?.disconnect().catch((error) => logger.warn('Realtime Redis publisher disconnect failed', error));
    this.subscriber = undefined;
    this.publisher = undefined;
    this.redisReady = false;
    this.redisConnectPromise = undefined;
  }

  publish(event: RealtimeEvent): void {
    void this.publishAsync(event);
  }

  private async publishAsync(event: RealtimeEvent): Promise<void> {
    await this.connectRedis();

    if (!this.redisReady || !this.publisher) {
      this.deliver(event);
      return;
    }

    try {
      await this.publisher.publish(REDIS_CHANNEL, JSON.stringify(event));
    } catch (error) {
      logger.warn('Realtime Redis publish failed; falling back to local delivery', error);
      this.redisReady = false;
      this.deliver(event);
    }
  }

  private async connectRedis(): Promise<void> {
    if (this.redisReady || this.redisConnectPromise) {
      return this.redisConnectPromise;
    }

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return undefined;
    }

    this.redisConnectPromise = (async () => {
      try {
        const publisher = createClient({ url: redisUrl });
        const subscriber = publisher.duplicate();

        publisher.on('error', (error) => logger.warn('Realtime Redis publisher error', error));
        subscriber.on('error', (error) => logger.warn('Realtime Redis subscriber error', error));

        await publisher.connect();
        await subscriber.connect();
        await subscriber.subscribe(REDIS_CHANNEL, (message) => {
          try {
            this.deliver(JSON.parse(message) as RealtimeEvent);
          } catch (error) {
            logger.warn('Received malformed realtime Redis message', error);
          }
        });

        this.publisher = publisher;
        this.subscriber = subscriber;
        this.redisReady = true;
        logger.info(`Realtime Redis pub/sub connected on ${REDIS_CHANNEL}`);
      } catch (error) {
        this.redisReady = false;
        logger.warn('Realtime Redis unavailable; using local websocket delivery only', error);
        await this.subscriber?.disconnect().catch(() => undefined);
        await this.publisher?.disconnect().catch(() => undefined);
        this.subscriber = undefined;
        this.publisher = undefined;
      } finally {
        this.redisConnectPromise = undefined;
      }
    })();

    return this.redisConnectPromise;
  }

  private async handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    const parsedUrl = new URL(request.url || '/', 'http://localhost');
    if (parsedUrl.pathname !== REALTIME_PATH) {
      return;
    }

    if (!this.webSocketServer) {
      this.rejectSocket(socket, 503, 'Realtime server unavailable');
      return;
    }

    const resource = parsedUrl.searchParams.get('resource') as RealtimeResource | null;
    const shareId = parsedUrl.searchParams.get('shareId');

    if (!shareId || (resource !== 'dashboard' && resource !== 'visualization')) {
      this.rejectSocket(socket, 400, 'Invalid realtime subscription');
      return;
    }

    try {
      await this.authorizer(request, resource, shareId);
      this.webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
        this.register(webSocket as RealtimeSocket, resource, shareId);
      });
    } catch (error) {
      logger.warn('Realtime websocket authorization rejected', error);
      this.rejectSocket(socket, 401, 'Unauthorized');
    }
  }

  private register(socket: RealtimeSocket, resource: RealtimeResource, shareId: string): void {
    const channelKey = this.getChannelKey(resource, shareId);
    const clients = this.channels.get(channelKey) ?? new Set<RealtimeSocket>();

    socket.channelKey = channelKey;
    socket.isAlive = true;
    socket.on('pong', () => {
      socket.isAlive = true;
    });
    socket.on('close', () => {
      clients.delete(socket);
      if (clients.size === 0) {
        this.channels.delete(channelKey);
      }
    });
    socket.send(JSON.stringify({ type: 'connected' }));

    clients.add(socket);
    this.channels.set(channelKey, clients);
  }

  private deliver(event: RealtimeEvent): void {
    const clients = this.channels.get(this.getChannelKey(event.resource, event.shareId));
    if (!clients) {
      return;
    }

    const message = JSON.stringify(event);
    clients.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }

  private getChannelKey(resource: RealtimeResource, shareId: string): string {
    return `${resource}:${shareId}`;
  }

  private parseCookies(header: string): Map<string, string> {
    return parseCookies(header);
  }

  private rejectSocket(socket: Duplex, statusCode: number, message: string): void {
    socket.write(`HTTP/1.1 ${statusCode} ${message}\r\n\r\n`);
    socket.destroy();
  }
}

const parseCookies = (header: string): Map<string, string> => new Map(
  header
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) {
        return [entry, ''];
      }

      return [
        entry.slice(0, separatorIndex),
        decodeURIComponent(entry.slice(separatorIndex + 1))
      ];
    })
);

const authorizeRealtimeSubscription: RealtimeAuthorizer = async (
  request,
  resource,
  shareId
) => {
  const [{ SESSION_COOKIE_NAME }, { default: Factory }] = await Promise.all([
    import('../auth/constants'),
    import('../factory')
  ]);
  const cookies = parseCookies(request.headers.cookie || '');
  const sessionToken = cookies.get(SESSION_COOKIE_NAME);

  if (!sessionToken) {
    throw new Error('Authentication required');
  }

  const bzl = Factory.getInstance().getBZL();
  const principal = await bzl.AuthBZL.getSessionPrincipalFromToken(sessionToken);
  if (!principal || principal.user.isEmailVerified !== true) {
    throw new Error('Verified email required');
  }

  if (resource === 'dashboard') {
    await bzl.DashboardBZL.findShared(shareId, principal.user._id.toString(), false);
    return;
  }

  await bzl.VisualizationBZL.findShared(shareId, principal.user._id.toString());
};

const broker = new RealtimeBroker();

const attachRealtimeServer = (server: HttpServer): void => broker.attach(server);
const closeRealtimeServer = (): void => broker.close();
const publish = (event: RealtimeEvent): void => broker.publish(event);

export type { RealtimeResource, RealtimeEvent, RealtimeAuthorizer };
export { RealtimeBroker, attachRealtimeServer, closeRealtimeServer, publish };
