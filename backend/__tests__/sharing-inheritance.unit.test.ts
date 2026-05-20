import DashboardBZL from '../src/bzl/dashboard/dashboard';
import VisualizationBZL from '../src/bzl/visualization/visualization';
import Factory from '../src/factory';

jest.mock('../src/auth/email', () => jest.fn().mockImplementation(() => ({
  sendShareInvitationEmail: jest.fn().mockResolvedValue(undefined),
  sendShareRevocationEmail: jest.fn().mockResolvedValue(undefined)
})));

describe('share inheritance behavior', () => {
  const owner = { _id: { toString: () => 'owner-1' }, email: 'owner@example.com', name: 'Owner' };
  const viewer = { _id: { toString: () => 'viewer-1' }, email: 'viewer@example.com', name: 'Viewer' };
  const projectBrowse = jest.fn().mockResolvedValue({ projects: [{ name: 'Project' }] });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Factory, 'getInstance').mockReturnValue({
      getBZL: () => ({
        ProjectBZL: { browse: projectBrowse },
        DashboardBZL: {
          findShared: jest.fn()
        }
      })
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createDashboardDbacc = (dashboardOverrides: Record<string, unknown> = {}) => {
    const dashboard = {
      userId: 'owner-1',
      projectName: 'Project',
      name: 'Dashboard',
      shareId: 'dash_shared',
      sharedWith: [],
      visualizations: { Sales_bar: 'bar' },
      ...dashboardOverrides
    };
    const updateSharing = jest.fn().mockImplementation((_filter, data) => Promise.resolve({
      ...dashboard,
      ...data
    }));
    return {
      dashboard,
      dbacc: {
        Auth: {
          findUserById: jest.fn().mockResolvedValue(owner),
          findUserByEmailNormalized: jest.fn().mockResolvedValue(viewer),
          findUsersByIds: jest.fn().mockResolvedValue([owner])
        },
        Dashboard: {
          createFilter: jest.fn((query) => ({ query })),
          delete: jest.fn().mockResolvedValue(true),
          findOne: jest.fn().mockResolvedValue(dashboard),
          findOneWithSharing: jest.fn().mockResolvedValue(dashboard),
          updateSharing
        },
        Visualization: {
          createFilter: jest.fn((query) => ({ query })),
          findOneWithSharing: jest.fn().mockResolvedValue({
            userId: 'owner-1',
            projectName: 'Project',
            name: 'Sales',
            type: 'bar',
            shareId: 'viz_direct',
            sharedWith: []
          }),
          deleteMany: jest.fn().mockResolvedValue(true),
          updateSharing: jest.fn().mockResolvedValue({})
        }
      }
    };
  };

  it('shares dashboards without creating visualization share records', async () => {
    const { dbacc } = createDashboardDbacc({
      shareId: undefined,
      sharedWith: []
    });
    const bzl = new DashboardBZL(dbacc as any);

    const result = await bzl.share({ name: 'Dashboard' }, [{ email: 'viewer@example.com', permission: 'viewer' }]);

    expect(result.shareId).toMatch(/^dash_/);
    expect(dbacc.Dashboard.updateSharing).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        shareId: expect.stringMatching(/^dash_/),
        sharedWith: [expect.objectContaining({
          userId: 'viewer-1',
          permission: 'viewer',
          sharedViaResource: 'dashboard'
        })]
      })
    );
    expect(dbacc.Visualization.updateSharing).not.toHaveBeenCalled();
  });

  it('hydrates dashboard visualizations as inherited access for shared dashboard viewers', async () => {
    const { dbacc } = createDashboardDbacc({
      sharedWith: [{
        userId: 'viewer-1',
        email: 'viewer@example.com',
        permission: 'viewer',
        status: 'accepted',
        sharedViaResource: 'dashboard',
        sharedViaShareId: 'dash_shared'
      }]
    });
    const bzl = new DashboardBZL(dbacc as any);

    const dashboard = await bzl.findShared('dash_shared', 'viewer-1', true);
    const visualizations = dashboard.visualizations as any[];

    expect(visualizations).toHaveLength(1);
    expect(visualizations[0]).toMatchObject({
      name: 'Sales',
      accessType: 'inherited',
      sourceType: 'dashboard',
      sourceDashboardId: 'dash_shared',
      currentUserRole: 'viewer',
      isExternal: true
    });
  });

  it('revoking a dashboard share removes old inherited visualization entries but keeps direct shares', async () => {
    const { dbacc } = createDashboardDbacc({
      sharedWith: [{
        userId: 'viewer-1',
        email: 'viewer@example.com',
        permission: 'viewer',
        status: 'accepted',
        sharedViaResource: 'dashboard',
        sharedViaShareId: 'dash_shared'
      }]
    });
    dbacc.Visualization.findOneWithSharing.mockResolvedValueOnce({
      userId: 'owner-1',
      projectName: 'Project',
      name: 'Sales',
      type: 'bar',
      shareId: 'viz_direct',
      sharedWith: [
        {
          userId: 'viewer-1',
          email: 'viewer@example.com',
          permission: 'viewer',
          status: 'accepted',
          sharedViaResource: 'visualization',
          sharedViaShareId: 'viz_direct'
        },
        {
          userId: 'viewer-1',
          email: 'viewer@example.com',
          permission: 'viewer',
          status: 'accepted',
          sharedViaResource: 'dashboard',
          sharedViaShareId: 'dash_shared'
        }
      ]
    });
    const bzl = new DashboardBZL(dbacc as any);

    await bzl.revokeShare({ name: 'Dashboard' }, 'viewer-1');

    expect(dbacc.Visualization.updateSharing).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        sharedWith: [expect.objectContaining({ sharedViaResource: 'visualization' })]
      })
    );
  });

  it('deletes the dashboard without deleting its visualizations', async () => {
    const { dbacc } = createDashboardDbacc();
    const bzl = new DashboardBZL(dbacc as any);

    await bzl.delete({ name: 'Dashboard', userId: 'owner-1' });

    expect(dbacc.Dashboard.delete).toHaveBeenCalledWith(expect.objectContaining({
      query: expect.objectContaining({
        name: 'Dashboard',
        userId: 'owner-1',
        projectName: 'Project'
      })
    }));
    expect(dbacc.Visualization.deleteMany).not.toHaveBeenCalled();
  });

  it('allows visualization access through a shared dashboard without a direct visualization share', async () => {
    const dashboardFindShared = jest.fn().mockResolvedValue({
      userId: 'owner-1',
      projectName: 'Project',
      name: 'Dashboard',
      shareId: 'dash_shared',
      visualizations: { Sales_bar: 'bar' }
    });
    jest.spyOn(Factory, 'getInstance').mockReturnValue({
      getBZL: () => ({
        DashboardBZL: { findShared: dashboardFindShared }
      })
    } as any);
    const dbacc = {
      Auth: { findUserById: jest.fn().mockResolvedValue(owner) },
      Visualization: {
        createFilter: jest.fn((query) => ({ query })),
        findOneWithSharing: jest.fn().mockResolvedValue({
          userId: 'owner-1',
          projectName: 'Project',
          name: 'Sales',
          type: 'bar',
          sharedWith: []
        })
      }
    };
    const bzl = new VisualizationBZL(dbacc as any);

    const visualization = await bzl.findSharedThroughDashboard('dash_shared', 'Sales', 'bar', 'viewer-1');

    expect(dashboardFindShared).toHaveBeenCalledWith('dash_shared', 'viewer-1', false);
    expect(visualization).toMatchObject({
      name: 'Sales',
      accessType: 'inherited',
      sourceType: 'dashboard',
      sourceDashboardId: 'dash_shared',
      currentUserRole: 'viewer'
    });
  });
});
