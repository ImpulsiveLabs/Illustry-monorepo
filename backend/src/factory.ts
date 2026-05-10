import mongoose from 'mongoose';
import BZLInstance from './bzl';
import DbaccInstance from './dbacc/lib';
import ModelInstance from './dbacc/models/modelInstance';
import logger from './config/logger';
import {
  getMongoConnectTimeoutMs,
  getMongoQueryTimeoutMs,
  getMongoServerSelectionTimeoutMs,
  getMongoSocketTimeoutMs
} from './config/timeouts';
import 'dotenv/config';

class Factory {
  private static _instance?: Factory;

  private static _dbaccInstance?: DbaccInstance;

  private static _bzlInstance?: BZLInstance;

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
    const mongoQueryTimeoutMs = getMongoQueryTimeoutMs();

    mongoose.set('bufferCommands', false);
    mongoose.set('bufferTimeoutMS', 0);
    mongoose.set('maxTimeMS', mongoQueryTimeoutMs);

    this.dbConnection = mongoose.createConnection(
      connectionUri,
      {
        bufferCommands: false,
        connectTimeoutMS: getMongoConnectTimeoutMs(),
        dbName: NODE_ENV === 'test' ? 'illustrytest' : MONGO_DB_NAME,
        user: uriHasCredentials ? undefined : MONGO_USER || undefined,
        pass: uriHasCredentials ? undefined : MONGO_PASSWORD || undefined,
        serverSelectionTimeoutMS: getMongoServerSelectionTimeoutMs(),
        socketTimeoutMS: getMongoSocketTimeoutMs()
      }
    );
    this.dbConnection.set('maxTimeMS', mongoQueryTimeoutMs);
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

  static hasInstance(): boolean {
    return Factory._instance !== undefined;
  }

  getDbaccInstance(): DbaccInstance {
    if (!Factory._dbaccInstance) {
      throw new Error('Factory database access layer is not initialized');
    }

    return Factory._dbaccInstance;
  }

  getModelInstance(): ModelInstance {
    return this.getDbaccInstance().getModelInstance();
  }

  getBZL(): BZLInstance {
    if (!Factory._bzlInstance) {
      throw new Error('Factory business layer is not initialized');
    }

    return Factory._bzlInstance;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) {
      return;
    }

    await this.dbConnection.asPromise();
    logger.info('MongoDB connection established');
  }

  isConnected(): boolean {
    return this.dbConnection.readyState === 1;
  }

  async cleanup(): Promise<void> {
    await Promise.resolve(this.dbConnection.close(true));
    Factory._instance = undefined;
    Factory._dbaccInstance = undefined;
    Factory._bzlInstance = undefined;
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
