const mockPublish = jest.fn();

jest.mock('../../src/realtime/broker', () => ({
  publish: mockPublish
}));

describe('ProjectBZL realtime and existence gates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeDbacc = () => ({
    Project: {
      create: jest.fn(async (project) => ({ ...project, createdAt: new Date('2026-06-07T00:00:00.000Z') })),
      createFilter: jest.fn((filter) => ({ query: filter })),
      findOne: jest.fn(async (filter) => ({ name: filter.query.name || 'Project' })),
      browse: jest.fn(async () => ({ projects: [], pagination: { count: 0, pageCount: 1 } })),
      update: jest.fn(async (_filter, project) => ({ ...project, name: 'Project' })),
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
  });

  it('publishes project create, update, and delete events on the scoped user channel', async () => {
    const ProjectBZL = (await import('../../src/bzl/project/project')).default;
    const dbacc = makeDbacc();
    const instance = new ProjectBZL(dbacc as any);

    await instance.create({ userId: 'user-1', name: 'Project' } as any);
    await instance.update({ userId: 'user-1', name: 'Project' } as any, { description: 'Updated' } as any);
    await instance.delete({ userId: 'user-1', name: 'Project' } as any);

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'project',
      shareId: 'user-1',
      action: 'created'
    }));
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'project',
      shareId: 'user-1',
      action: 'updated'
    }));
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'project',
      shareId: 'user-1',
      action: 'deleted'
    }));
    const findOneCalls = dbacc.Project.findOne.mock.invocationCallOrder;
    expect(findOneCalls[0]).toBeLessThan(dbacc.Project.update.mock.invocationCallOrder[0]);
    expect(findOneCalls[1]).toBeLessThan(dbacc.Project.delete.mock.invocationCallOrder[0]);
  });

  it('does not mutate or publish when update preflight cannot find the project', async () => {
    const ProjectBZL = (await import('../../src/bzl/project/project')).default;
    const dbacc = makeDbacc();
    (dbacc.Project.findOne as jest.Mock).mockResolvedValueOnce(null);
    const instance = new ProjectBZL(dbacc as any);

    await expect(
      instance.update({ userId: 'user-1', name: 'Missing' } as any, { description: 'Nope' } as any)
    ).rejects.toThrow('No project was found with name Missing');

    expect(dbacc.Project.update).not.toHaveBeenCalled();
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('does not publish when duplicate project creation fails', async () => {
    const ProjectBZL = (await import('../../src/bzl/project/project')).default;
    const dbacc = makeDbacc();
    dbacc.Project.create.mockRejectedValueOnce(new Error('duplicate key'));
    const instance = new ProjectBZL(dbacc as any);

    await expect(
      instance.create({ userId: 'user-1', name: 'Existing Project' } as any)
    ).rejects.toThrow('There already is a project named Existing Project');

    expect(mockPublish).not.toHaveBeenCalled();
  });
});

export {};
