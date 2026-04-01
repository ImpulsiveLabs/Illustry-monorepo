import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as http from 'http';
import mongoose from 'mongoose';
import VisualizationRoutes from './routes/visualization/visualization';
import ProjectRoutes from './routes/project/project';
import DashboardRoutes from './routes/dashboard/dashboard';
import logger from './config/logger';
import AuthRoutes from './routes/auth/auth';
import { parseCorsAllowlist } from './auth/constants';

import 'dotenv/config';

class Illustry {
  private expressApp: Express = express();

  private httpServer: http.Server;

  constructor() {
    const { ILLUSTRY_PORT = '8000' } = process.env;
    const corsAllowlist = parseCorsAllowlist();

    this.expressApp.set('trust proxy', 1);

    this.expressApp.use(helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false
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
        methods: 'GET, POST, OPTIONS, PUT, PATH, DELETE',
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-CSRF-Token'
        ],
        credentials: true
      })
    );

    this.expressApp.use(cookieParser());
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: false }));

    this.expressApp.use(AuthRoutes);
    this.expressApp.use(ProjectRoutes);
    this.expressApp.use(VisualizationRoutes);
    this.expressApp.use(DashboardRoutes);

    this.expressApp.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
      logger.error(error.message);
      response.status(500).send({ error: 'Internal server error' });
    });

    this.httpServer = this.expressApp.listen(+ILLUSTRY_PORT, '0.0.0.0', () => {
      logger.info(`server is listening on ${ILLUSTRY_PORT}`);
    });
  }

  async start(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.httpServer.on('error', (error) => {
          logger.error(error);
          reject(error);
        });
        this.httpServer.on('listening', () => {
          resolve();
        });
      });
    } catch (error) {
      logger.error('Error on starting Illustry service');
      process.exit(-1);
    }
  }

  async stop(): Promise<void> {
    try {
      this.httpServer.close();
      await mongoose.disconnect();
    } catch (error) {
      logger.error('Error on stopping Illustry service');
      process.exit(-1);
    }
  }
}

export default Illustry;
