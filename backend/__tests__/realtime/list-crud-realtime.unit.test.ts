const mockPublish = jest.fn();
const mockProjectBrowse = jest.fn(async () => ({ projects: [{ name: 'Active Project' }] }));

jest.mock('../../src/realtime/broker', () => ({
  publish: mockPublish
}));

jest.mock('../../src/factory', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      getBZL: () => ({
        ProjectBZL: {
          browse: mockProjectBrowse
        }
      })
    }))
  }
}));

describe('dashboard and visualization list realtime events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes dashboard create and delete events on the scoped user channel', async () => {
    const DashboardBZL = (await import('../../src/bzl/dashboard/dashboard')).default;
    const dbacc = {
      Dashboard: {
        create: jest.fn(async (dashboard) => ({ ...dashboard, shareId: undefined })),
        createFilter: jest.fn((filter) => ({ query: filter })),
        findOneWithSharing: jest.fn(async () => ({ userId: 'user-1', name: 'Dash' })),
        delete: jest.fn(async () => true)
      },
      Visualization: {
        createFilter: jest.fn((filter) => ({ query: filter })),
        findOneWithSharing: jest.fn()
      }
    };
    const instance = new DashboardBZL(dbacc as any);

    await instance.create({ userId: 'user-1', name: 'Dash' } as any);
    await instance.delete({ userId: 'user-1', name: 'Dash' } as any);

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'user',
      shareId: 'user-1',
      action: 'created'
    }));
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'user',
      shareId: 'user-1',
      action: 'deleted'
    }));
  });

  it('publishes visualization create/update and delete events on the scoped user channel', async () => {
    const VisualizationBZL = (await import('../../src/bzl/visualization/visualization')).default;
    const dbacc = {
      Visualization: {
        createFilter: jest.fn((filter) => ({ query: filter })),
        update: jest.fn(async (_filter, visualization) => ({ ...visualization, userId: 'user-1' })),
        updateFields: jest.fn(async (_filter, visualization) => ({ ...visualization, userId: 'user-1' })),
        findOneWithSharing: jest.fn(async () => ({ userId: 'user-1', name: 'Viz', type: 'bar-chart' })),
        deleteMany: jest.fn(async () => true)
      },
      Dashboard: {
        createFilter: jest.fn((filter) => ({ query: filter })),
        browse: jest.fn(async () => ({ dashboards: [] }))
      }
    };
    const instance = new VisualizationBZL(dbacc as any);

    await instance.createOrUpdate({
      userId: 'user-1',
      name: 'Viz',
      type: 'bar-chart',
      projectName: 'Active Project'
    } as any);
    await instance.update({ userId: 'user-1', name: 'Viz', type: 'bar-chart' } as any, { theme: { colors: [] } } as any);
    await instance.delete({ userId: 'user-1', name: 'Viz', type: 'bar-chart' } as any);

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'user',
      shareId: 'user-1',
      action: 'updated'
    }));
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'user',
      shareId: 'user-1',
      action: 'deleted'
    }));
  });
});

export {};
