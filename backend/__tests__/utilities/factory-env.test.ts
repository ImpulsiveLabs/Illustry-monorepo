describe('factory environment branches', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses MONGO_URL when NODE_ENV is not test', () => {
    const close = jest.fn();
    const createConnection = jest.fn(() => ({ close }));

    jest.doMock('mongoose', () => ({
      __esModule: true,
      default: { createConnection }
    }));
    jest.doMock('../../src/dbacc/lib', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));
    jest.doMock('../../src/bzl', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));

    process.env.NODE_ENV = 'production';
    process.env.MONGO_URL = 'mongodb://prod-host:27017/prod';
    process.env.MONGO_USER = 'u';
    process.env.MONGO_PASSWORD = 'p';

    const Factory = require('../../src/factory').default;
    const instance = Factory.getInstance();

    expect(createConnection).toHaveBeenCalledWith(
      'mongodb://prod-host:27017/prod',
      expect.objectContaining({
        dbName: 'illustry',
        user: 'u',
        pass: 'p'
      })
    );

    instance.cleanup();
    expect(close).toHaveBeenCalledWith(true);
  });

  it('uses MONGO_TEST_URL when NODE_ENV is test', () => {
    const close = jest.fn();
    const createConnection = jest.fn(() => ({ close }));

    jest.doMock('mongoose', () => ({
      __esModule: true,
      default: { createConnection }
    }));
    jest.doMock('../../src/dbacc/lib', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));
    jest.doMock('../../src/bzl', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));

    process.env.NODE_ENV = 'test';
    process.env.MONGO_TEST_URL = 'mongodb://test-host:27017/test';

    const Factory = require('../../src/factory').default;
    const instance = Factory.getInstance();

    expect(createConnection).toHaveBeenCalledWith(
      'mongodb://test-host:27017/test',
      expect.objectContaining({ dbName: 'illustrytest' })
    );

    instance.cleanup();
    expect(close).toHaveBeenCalledWith(true);
  });

  it('falls back to empty MONGO_URL string when missing in production', () => {
    const close = jest.fn();
    const createConnection = jest.fn(() => ({ close }));

    jest.doMock('mongoose', () => ({
      __esModule: true,
      default: { createConnection }
    }));
    jest.doMock('../../src/dbacc/lib', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));
    jest.doMock('../../src/bzl', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));
    jest.doMock('dotenv/config', () => ({}), { virtual: true });

    process.env.NODE_ENV = 'production';
    const Factory = require('../../src/factory').default;
    delete process.env.MONGO_URL;
    const instance = Factory.getInstance();

    expect(createConnection).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ dbName: 'illustry' })
    );

    instance.cleanup();
    expect(close).toHaveBeenCalledWith(true);
  });

  it('falls back to empty MONGO_TEST_URL string when missing in test env', () => {
    const close = jest.fn();
    const createConnection = jest.fn(() => ({ close }));

    jest.doMock('mongoose', () => ({
      __esModule: true,
      default: { createConnection }
    }));
    jest.doMock('../../src/dbacc/lib', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));
    jest.doMock('../../src/bzl', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({}))
    }));
    jest.doMock('dotenv/config', () => ({}), { virtual: true });

    process.env.NODE_ENV = 'test';
    const Factory = require('../../src/factory').default;
    delete process.env.MONGO_TEST_URL;
    const instance = Factory.getInstance();

    expect(createConnection).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ dbName: 'illustrytest' })
    );

    instance.cleanup();
    expect(close).toHaveBeenCalledWith(true);
  });
});
