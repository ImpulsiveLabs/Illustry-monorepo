import Factory from "../../src/factory";

process.env.NODE_ENV = "test";
process.env.MONGO_TEST_URL = "mongodb://localhost:27017/illustrytest";
process.env.MONGO_USER = "root";
process.env.MONGO_PASSWORD = "rootPass";

describe('Factory tests', () => {
  let factory: Factory;

  beforeAll(() => {
    factory = Factory.getInstance();
  });

  afterAll(() => {
    factory.cleanup();
  });

  it('Tries to use constructor instead of instance', () => {
    try {
      new Factory();
    } catch (err) {
      expect((err as Error).message).toBe('Use Factory getInstance() instead');
    }
  });

  it('Should return the same instance with getInstance', () => {
    const factoryInstance1 = Factory.getInstance();
    const factoryInstance2 = Factory.getInstance();

    expect(factoryInstance1).toBe(factoryInstance2);
  });

  it('Should return a valid DbaccInstance from getDbaccInstance', () => {
    const dbaccInstance = factory.getDbaccInstance();

    expect(dbaccInstance).toBeDefined();
    expect(dbaccInstance).not.toBeNull();

    expect(typeof dbaccInstance.Dashboard).toBe('object');
  });
});
