describe('coverage gaps', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('resolves user ids for explicit, test, and missing production cases', async () => {
    const { TEST_USER_ID, resolveUserId } = await import('../../src/bzl/user-scope');

    expect(resolveUserId('custom-user')).toBe('custom-user');
    expect(resolveUserId()).toBe(TEST_USER_ID);

    process.env.NODE_ENV = 'production';
    expect(() => resolveUserId()).toThrow('Missing userId');
  });

  it('returns the model instance from the factory getter', async () => {
    const close = jest.fn();
    const createConnection = jest.fn(() => ({
      close,
      on: jest.fn(),
      set: jest.fn()
    }));
    const modelInstance = { model: 'instance' };
    const dbaccInstance = {
      getModelInstance: jest.fn(() => modelInstance)
    };

    jest.doMock('mongoose', () => ({
      __esModule: true,
      default: { createConnection, set: jest.fn() }
    }));
    jest.doMock('../../src/dbacc/lib', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => dbaccInstance)
    }));
    jest.doMock('../../src/bzl', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({ bzl: true }))
    }));
    jest.doMock('dotenv/config', () => ({}), { virtual: true });

    const Factory = require('../../src/factory').default;
    const instance = Factory.getInstance();

    expect(instance.getModelInstance()).toBe(modelInstance);
    expect(dbaccInstance.getModelInstance).toHaveBeenCalledTimes(1);

    await instance.cleanup();
    expect(close).toHaveBeenCalledWith(true);
  });

  it('returns the cached model instance from dbacc', async () => {
    const modelInstance = { model: true };
    const ModelInstance = jest.fn().mockImplementation(() => modelInstance);
    const Project = jest.fn();
    const Visualization = jest.fn();
    const Dashboard = jest.fn();

    jest.doMock('../../src/dbacc/models/modelInstance', () => ({
      __esModule: true,
      default: ModelInstance
    }));
    jest.doMock('../../src/dbacc/lib/project/project', () => ({
      __esModule: true,
      default: Project
    }));
    jest.doMock('../../src/dbacc/lib/visualization/visualization', () => ({
      __esModule: true,
      default: Visualization
    }));
    jest.doMock('../../src/dbacc/lib/dashboard/dashboard', () => ({
      __esModule: true,
      default: Dashboard
    }));

    jest.unmock('../../src/dbacc/lib');
    const DbaccInstance = (await import('../../src/dbacc/lib')).default;
    const connection = { name: 'conn' } as any;
    const instance = new DbaccInstance(connection);

    expect(instance.getModelInstance()).toBe(modelInstance);
    expect(ModelInstance).toHaveBeenCalledWith(connection);
  });

  it('caches auth models inside ModelInstance', async () => {
    const visualizationModel = { type: 'visualization-model' };
    const projectModel = { type: 'project-model' };
    const dashboardModel = { type: 'dashboard-model' };
    const userModel = { type: 'user-model' };
    const sessionModel = { type: 'session-model' };
    const emailVerificationModel = { type: 'email-verification-model' };
    const passwordResetModel = { type: 'password-reset-model' };

    const Visualization = jest.fn().mockImplementation(() => ({
      getModel: jest.fn(() => visualizationModel)
    }));
    const Project = jest.fn().mockImplementation(() => ({
      getModel: jest.fn(() => projectModel)
    }));
    const Dashboard = jest.fn().mockImplementation(() => ({
      getModel: jest.fn(() => dashboardModel)
    }));
    const User = jest.fn().mockImplementation(() => ({
      getModel: jest.fn(() => userModel)
    }));
    const Session = jest.fn().mockImplementation(() => ({
      getModel: jest.fn(() => sessionModel)
    }));
    const EmailVerificationToken = jest.fn().mockImplementation(() => ({
      getModel: jest.fn(() => emailVerificationModel)
    }));
    const PasswordResetToken = jest.fn().mockImplementation(() => ({
      getModel: jest.fn(() => passwordResetModel)
    }));

    jest.doMock('../../src/dbacc/models/visualization/Visualization', () => ({
      __esModule: true,
      default: Visualization
    }));
    jest.doMock('../../src/dbacc/models/project/Project', () => ({
      __esModule: true,
      default: Project
    }));
    jest.doMock('../../src/dbacc/models/dashboard/Dashboard', () => ({
      __esModule: true,
      default: Dashboard
    }));
    jest.doMock('../../src/dbacc/models/auth/User', () => ({
      __esModule: true,
      default: User
    }));
    jest.doMock('../../src/dbacc/models/auth/Session', () => ({
      __esModule: true,
      default: Session
    }));
    jest.doMock('../../src/dbacc/models/auth/EmailVerificationToken', () => ({
      __esModule: true,
      default: EmailVerificationToken
    }));
    jest.doMock('../../src/dbacc/models/auth/PasswordResetToken', () => ({
      __esModule: true,
      default: PasswordResetToken
    }));

    jest.unmock('../../src/dbacc/models/modelInstance');
    const ModelInstance = (await import('../../src/dbacc/models/modelInstance')).default;
    const connection = { setMaxListeners: jest.fn() } as any;
    const instance = new ModelInstance(connection);

    expect(connection.setMaxListeners).toHaveBeenCalledWith(100);

    expect(instance.UserModel).toBe(userModel);
    expect(instance.UserModel).toBe(userModel);
    expect(instance.SessionModel).toBe(sessionModel);
    expect(instance.SessionModel).toBe(sessionModel);
    expect(instance.EmailVerificationTokenModel).toBe(emailVerificationModel);
    expect(instance.EmailVerificationTokenModel).toBe(emailVerificationModel);
    expect(instance.PasswordResetTokenModel).toBe(passwordResetModel);
    expect(instance.PasswordResetTokenModel).toBe(passwordResetModel);
  });

  it('builds and caches auth mongoose models', async () => {
    jest.unmock('mongoose');
    jest.unmock('../../src/dbacc/models/auth/User');
    jest.unmock('../../src/dbacc/models/auth/Session');
    jest.unmock('../../src/dbacc/models/auth/EmailVerificationToken');
    jest.unmock('../../src/dbacc/models/auth/PasswordResetToken');

    const User = (await import('../../src/dbacc/models/auth/User')).default;
    const Session = (await import('../../src/dbacc/models/auth/Session')).default;
    const EmailVerificationToken = (await import('../../src/dbacc/models/auth/EmailVerificationToken')).default;
    const PasswordResetToken = (await import('../../src/dbacc/models/auth/PasswordResetToken')).default;

    const connection = {
      model: jest.fn((name: string) => ({ name }))
    } as any;

    const user = new User(connection);
    const session = new Session(connection);
    const emailVerificationToken = new EmailVerificationToken(connection);
    const passwordResetToken = new PasswordResetToken(connection);

    expect(user.getModel()).toEqual({ name: 'AuthUser' });
    expect(user.getModel()).toEqual({ name: 'AuthUser' });
    expect(session.getModel()).toEqual({ name: 'AuthSession' });
    expect(session.getModel()).toEqual({ name: 'AuthSession' });
    expect(emailVerificationToken.getModel()).toEqual({ name: 'EmailVerificationToken' });
    expect(emailVerificationToken.getModel()).toEqual({ name: 'EmailVerificationToken' });
    expect(passwordResetToken.getModel()).toEqual({ name: 'PasswordResetToken' });
    expect(passwordResetToken.getModel()).toEqual({ name: 'PasswordResetToken' });

    expect(connection.model).toHaveBeenCalledTimes(4);
    expect(connection.model).toHaveBeenNthCalledWith(1, 'AuthUser', expect.anything());
    expect(connection.model).toHaveBeenNthCalledWith(2, 'AuthSession', expect.anything());
    expect(connection.model).toHaveBeenNthCalledWith(3, 'EmailVerificationToken', expect.anything());
    expect(connection.model).toHaveBeenNthCalledWith(4, 'PasswordResetToken', expect.anything());
  });

  it('covers scoped project bzl branches for default and explicit users', async () => {
    const ProjectBZL = (await import('../../src/bzl/project/project')).default;
    const { TEST_USER_ID } = await import('../../src/bzl/user-scope');

    const dbaccInstance = {
      Project: {
        create: jest.fn(),
        createFilter: jest.fn((filter) => ({ query: filter })),
        findOne: jest.fn(async () => ({ name: 'Project A' })),
        browse: jest.fn(async () => ({ projects: [], pagination: { count: 0, pageCount: 1 } })),
        update: jest.fn(async (_filter, project) => project),
        delete: jest.fn(async () => true)
      },
      Visualization: {
        createFilter: jest.fn((filter) => ({ query: filter })),
        deleteMany: jest.fn(async () => true)
      },
      Dashboard: {
        createFilter: jest.fn((filter) => ({ query: filter })),
        deleteMany: jest.fn(async () => true)
      }
    } as any;

    const instance = new ProjectBZL(dbaccInstance);

    await expect(instance.findOne({ name: 'Project A' } as any)).resolves.toEqual({ name: 'Project A' });
    await expect(instance.browse({ text: 'abc' } as any)).resolves.toEqual({
      projects: [],
      pagination: { count: 0, pageCount: 1 }
    });
    await expect(
      instance.update({ name: 'Project A' } as any, { userId: 'project-user', isActive: false } as any)
    ).resolves.toEqual({ userId: 'project-user', isActive: false });
    await expect(instance.delete(undefined as any)).resolves.toBe(true);

    expect(dbaccInstance.Project.createFilter).toHaveBeenNthCalledWith(1, {
      name: 'Project A',
      userId: TEST_USER_ID
    });
    expect(dbaccInstance.Project.createFilter).toHaveBeenNthCalledWith(2, {
      text: 'abc',
      userId: TEST_USER_ID
    });
    expect(dbaccInstance.Project.createFilter).toHaveBeenNthCalledWith(3, {
      name: 'Project A',
      userId: 'project-user'
    });
    expect(dbaccInstance.Visualization.createFilter).not.toHaveBeenCalled();
    expect(dbaccInstance.Dashboard.createFilter).not.toHaveBeenCalled();
    expect(dbaccInstance.Visualization.deleteMany).toHaveBeenCalledWith({});
    expect(dbaccInstance.Dashboard.deleteMany).toHaveBeenCalledWith({});
    expect(dbaccInstance.Project.delete).toHaveBeenCalledWith({});
  });

  it('covers project bzl branches when filters are omitted', async () => {
    const ProjectBZL = (await import('../../src/bzl/project/project')).default;
    const { TEST_USER_ID } = await import('../../src/bzl/user-scope');

    const dbaccInstance = {
      Project: {
        createFilter: jest.fn((filter) => ({ query: filter })),
        findOne: jest.fn(async () => ({ name: 'Fallback Project' })),
        browse: jest.fn(async () => ({ projects: [{ name: 'Fallback Project' }], pagination: { count: 1, pageCount: 1 } })),
        update: jest.fn(async (_filter, project) => project)
      }
    } as any;

    const instance = new ProjectBZL(dbaccInstance);

    await expect(instance.findOne(undefined as any)).resolves.toEqual({ name: 'Fallback Project' });
    await expect(instance.browse(undefined as any)).resolves.toEqual({
      projects: [{ name: 'Fallback Project' }],
      pagination: { count: 1, pageCount: 1 }
    });
    await expect(
      instance.update(undefined as any, { userId: 'project-user', isActive: true } as any)
    ).resolves.toEqual({ userId: 'project-user', isActive: true });

    expect(dbaccInstance.Project.createFilter).toHaveBeenNthCalledWith(1, { userId: TEST_USER_ID });
    expect(dbaccInstance.Project.createFilter).toHaveBeenNthCalledWith(2, { userId: TEST_USER_ID });
    expect(dbaccInstance.Project.createFilter).toHaveBeenNthCalledWith(3, { userId: 'project-user' });
  });

  it('throws when creating an active project without a user id', async () => {
    jest.unmock('../../src/dbacc/lib/project/project');
    const Project = (await import('../../src/dbacc/lib/project/project')).default;

    const projectModel = {
      updateMany: jest.fn(() => ({ exec: jest.fn() })),
      create: jest.fn()
    };

    const instance = new Project({
      ProjectModel: projectModel
    } as any);

    await expect(instance.create({ name: 'Active Project', isActive: true } as any)).rejects.toThrow(
      'Missing userId for project creation'
    );
    expect(projectModel.updateMany).not.toHaveBeenCalled();
    expect(projectModel.create).not.toHaveBeenCalled();
  });
});
