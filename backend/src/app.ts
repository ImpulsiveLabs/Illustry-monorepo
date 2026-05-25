import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as http from 'http';
import VisualizationRoutes from './routes/visualization/visualization';
import ProjectRoutes from './routes/project/project';
import DashboardRoutes from './routes/dashboard/dashboard';
import logger from './config/logger';
import AuthRoutes from './routes/auth/auth';
import { parseCorsAllowlist } from './auth/constants';
import { enforceCsrfForProtectedMutationRoutes } from './auth/middleware';
import Factory from './factory';
import { attachRealtimeServer, closeRealtimeServer } from './realtime/broker';

import 'dotenv/config';

class Illustry {
  private expressApp: Express = express();

  private httpServer?: http.Server;

  private readonly port: number;

  constructor() {
    const { ILLUSTRY_PORT = '8000' } = process.env;
    this.port = +ILLUSTRY_PORT;
    const corsAllowlist = parseCorsAllowlist();

    this.expressApp.set('trust proxy', 1);

    this.expressApp.use(helmet({
      crossOriginResourcePolicy: false
    }));

    this.expressApp.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number(process.env.GLOBAL_RATE_LIMIT_MAX || 600),
      standardHeaders: true,
      legacyHeaders: false
    }));

    this.expressApp.use(
      cors({
        origin: (origin, callback) => {
          if (origin === undefined) {
            callback(null, true);
            return;
          }

          if (corsAllowlist.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(new Error('CORS origin not allowed'));
        },
        methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-CSRF-Token',
          'X-Illustry-Locale',
          'Accept-Language'
        ],
        credentials: true
      })
    );

    this.expressApp.use(cookieParser());
    this.expressApp.use(enforceCsrfForProtectedMutationRoutes);
    this.expressApp.use(express.json({ limit: process.env.EXPORT_REQUEST_LIMIT || '50mb' }));
    this.expressApp.use(express.urlencoded({ extended: false, limit: process.env.EXPORT_REQUEST_LIMIT || '50mb' }));

    this.expressApp.get('/api/health', (_request, response) => {
      const factory = Factory.getInstance();
      const connected = factory.isConnected();

      response.status(connected ? 200 : 503).send({
        ok: connected,
        database: connected ? 'connected' : 'disconnected'
      });
    });

    this.expressApp.use((_request, response, next) => {
      const factory = Factory.getInstance();

      if (!factory.isConnected()) {
        response.status(503).send({ error: 'Database connection unavailable' });
        return;
      }

      next();
    });

    this.expressApp.use(AuthRoutes);
    this.expressApp.use(ProjectRoutes);
    this.expressApp.use(VisualizationRoutes);
    this.expressApp.use(DashboardRoutes);

    this.expressApp.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
      logger.error(error.message);
      response.status(500).send({ error: 'Internal server error' });
    });
  }

  async start(): Promise<void> {
    if (this.httpServer?.listening === true) {
      return;
    }

    try {
      await Factory.getInstance().connect();
      this.httpServer = http.createServer(this.expressApp);
      attachRealtimeServer(this.httpServer);

      await new Promise<void>((resolve, reject) => {
        this.httpServer?.once('error', (error) => {
          logger.error(error);
          reject(error);
        });
        this.httpServer?.once('listening', () => {
          logger.info(`server is listening on ${this.port}`);
          resolve();
        });
        this.httpServer?.listen(this.port, '0.0.0.0');
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Error on starting Illustry service');
      await this.stop().catch(() => undefined);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await closeRealtimeServer();

      if (this.httpServer) {
        await new Promise<void>((resolve, reject) => {
          if (this.httpServer?.listening !== true) {
            resolve();
            return;
          }

          this.httpServer.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
        this.httpServer = undefined;
      }

      if (Factory.hasInstance()) {
        await Factory.getInstance().cleanup();
      }
    } catch (error) {
      logger.error('Error on stopping Illustry service');
      throw error;
    }
  }
}

export default Illustry;
