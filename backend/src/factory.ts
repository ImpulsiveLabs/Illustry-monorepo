import mongoose from 'mongoose';
import BZLInstance from './bzl';
import DbaccInstance from './dbacc/lib';
import ModelInstance from './dbacc/models/modelInstance';
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
      MONGO_USER,
      MONGO_PASSWORD
    } = process.env;
    this.dbConnection = mongoose.createConnection(
      NODE_ENV === 'test'
        ? MONGO_TEST_URL || ''
        : MONGO_URL || '',
      {
        dbName: NODE_ENV === 'test' ? 'illustrytest' : 'illustry',
        user: MONGO_USER,
        pass: MONGO_PASSWORD
      }
    );
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

  cleanup(): void {
    this.dbConnection.close(true);
  }
}

export default Factory;
