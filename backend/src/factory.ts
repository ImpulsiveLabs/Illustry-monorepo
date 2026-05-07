import mongoose from 'mongoose';
import BZLInstance from './bzl';
import DbaccInstance from './dbacc/lib';
import ModelInstance from './dbacc/models/modelInstance';
import logger from './config/logger';
import 'dotenv/config';

class Factory {
  private static _instance: Factory;

  private static _dbaccInstance: DbaccInstance;

  private static _bzlInstance: BZLInstance;

  private dbConnection: mongoose.Connection;

  constructor() {
    if (Factory._instance) {
      throw new Error('Use Factory getInstance() instead');
    }
    const {
      NODE_ENV,
      MONGO_TEST_URL = '',
      MONGO_URL = '',
      MONGO_DB_NAME = 'illustry',
      MONGO_USER,
      MONGO_PASSWORD
    } = process.env;
    const connectionUri = NODE_ENV === 'test'
      ? MONGO_TEST_URL || ''
      : MONGO_URL || '';
    const uriHasCredentials = /:\/\/[^/]+@/.test(connectionUri);
    this.dbConnection = mongoose.createConnection(
      connectionUri,
      {
        dbName: NODE_ENV === 'test' ? 'illustrytest' : MONGO_DB_NAME,
        user: uriHasCredentials ? undefined : MONGO_USER || undefined,
        pass: uriHasCredentials ? undefined : MONGO_PASSWORD || undefined,
        serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000)
      }
    );
    this.dbConnection.on?.('error', (error) => {
      logger.error(Factory.getReadableMongoError(error));
    });
    Factory._dbaccInstance = new DbaccInstance(this.dbConnection);
    Factory._bzlInstance = new BZLInstance(Factory._dbaccInstance);
    Factory._instance = this;
  }

  static getInstance(): Factory {
    return Factory._instance || new Factory();
  }

  getDbaccInstance(): DbaccInstance {
    return Factory._dbaccInstance;
  }

  getModelInstance(): ModelInstance {
    return Factory._dbaccInstance.getModelInstance();
  }

  getBZL(): BZLInstance {
    return Factory._bzlInstance;
  }

  async connect(): Promise<void> {
    await this.dbConnection.asPromise();
    logger.info('MongoDB connection established');
  }

  cleanup(): void {
    this.dbConnection.close(true);
  }

  private static getReadableMongoError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    if (
      normalized.includes('whitelist')
      || normalized.includes('could not connect to any servers in your mongodb atlas cluster')
      || normalized.includes('server selection')
      || normalized.includes('tlsv1 alert internal error')
    ) {
      return [
        'MongoDB Atlas connection failed.',
        'Check Atlas Network Access and allow the Docker host IP or use 0.0.0.0/0 for testing.',
        message
      ].join(' ');
    }

    return message;
  }
}

export default Factory;
