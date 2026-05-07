import { AddressInfo } from 'net';
import { createServer, Server } from 'http';
import { WebSocket } from 'ws';

const listen = async (server: Server): Promise<number> => new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => {
    resolve((server.address() as AddressInfo).port);
  });
});

const closeServer = async (server: Server): Promise<void> => new Promise((resolve) => {
  const timer = setTimeout(resolve, 50);
  server.close(() => {
    clearTimeout(timer);
    resolve();
  });
});

const receiveMessage = async (socket: WebSocket): Promise<Record<string, unknown>> => new Promise((resolve) => {
  socket.once('message', (message) => {
    resolve(JSON.parse(message.toString()));
  });
});

type TestSocket = WebSocket & {
  firstMessage: Promise<Record<string, unknown>>;
};

const openSocket = async (url: string): Promise<TestSocket> => new Promise((resolve, reject) => {
  const socket = new WebSocket(url, {
    headers: {
      Cookie: 'illustry_sid=session-token'
    }
  }) as TestSocket;

  socket.firstMessage = receiveMessage(socket);
  socket.once('open', () => resolve(socket));
  socket.once('error', reject);
});

describe('realtime broker', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    delete process.env.REDIS_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('authorizes dashboard websocket subscriptions and delivers local updates', async () => {
    const authorize = jest.fn(async () => undefined);
    const { RealtimeBroker } = await import('../../src/realtime/broker');
    const server = createServer();
    const broker = new RealtimeBroker(authorize);

    broker.attach(server);
    const port = await listen(server);
    const socket = await openSocket(`ws://127.0.0.1:${port}/api/realtime?resource=dashboard&shareId=dash-shared`);

    await expect(socket.firstMessage).resolves.toEqual({ type: 'connected' });
    expect(authorize).toHaveBeenCalledWith(expect.anything(), 'dashboard', 'dash-shared');

    broker.publish({
      resource: 'dashboard',
      shareId: 'dash-shared',
      action: 'updated',
      updatedAt: '2026-05-07T00:00:00.000Z'
    });

    await expect(receiveMessage(socket)).resolves.toMatchObject({
      resource: 'dashboard',
      shareId: 'dash-shared',
      action: 'updated'
    });

    socket.terminate();
    broker.close();
    await closeServer(server);
  });

  it('uses Redis pub/sub fanout when Redis is configured', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    let subscriberCallback: ((message: string) => void) | undefined;
    const subscriber = {
      on: jest.fn(),
      connect: jest.fn(async () => undefined),
      subscribe: jest.fn(async (_channel: string, callback: (message: string) => void) => {
        subscriberCallback = callback;
      }),
      disconnect: jest.fn(async () => undefined)
    };
    const publisher = {
      on: jest.fn(),
      connect: jest.fn(async () => undefined),
      duplicate: jest.fn(() => subscriber),
      publish: jest.fn(async (_channel: string, message: string) => {
        subscriberCallback?.(message);
      }),
      disconnect: jest.fn(async () => undefined)
    };

    jest.doMock('redis', () => ({
      createClient: jest.fn(() => publisher)
    }));

    const { RealtimeBroker } = await import('../../src/realtime/broker');
    const server = createServer();
    const broker = new RealtimeBroker(jest.fn(async () => undefined));

    broker.attach(server);
    const port = await listen(server);
    const socket = await openSocket(`ws://127.0.0.1:${port}/api/realtime?resource=visualization&shareId=viz-shared`);

    await expect(socket.firstMessage).resolves.toEqual({ type: 'connected' });
    broker.publish({
      resource: 'visualization',
      shareId: 'viz-shared',
      action: 'shared',
      updatedAt: '2026-05-07T00:00:00.000Z'
    });

    await expect(receiveMessage(socket)).resolves.toMatchObject({
      resource: 'visualization',
      shareId: 'viz-shared',
      action: 'shared'
    });
    expect(publisher.publish).toHaveBeenCalledWith(
      'illustry:realtime',
      expect.stringContaining('"shareId":"viz-shared"')
    );

    socket.terminate();
    broker.close();
    await closeServer(server);
  });
});
