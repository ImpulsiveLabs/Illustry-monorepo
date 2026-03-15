describe('instance caching', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('caches BZL instances across repeated getters', async () => {
    const ProjectBZL = jest.fn().mockImplementation(() => ({ type: 'project-bzl' }));
    const VisualizationBZL = jest.fn().mockImplementation(() => ({ type: 'visualization-bzl' }));
    const DashboardBZL = jest.fn().mockImplementation(() => ({ type: 'dashboard-bzl' }));

    jest.doMock('../../src/bzl/project/project', () => ({
      __esModule: true,
      default: ProjectBZL
    }));
    jest.doMock('../../src/bzl/visualization/visualization', () => ({
      __esModule: true,
      default: VisualizationBZL
    }));
    jest.doMock('../../src/bzl/dashboard/dashboard', () => ({
      __esModule: true,
      default: DashboardBZL
    }));

    const BZLInstance = (await import('../../src/bzl')).default;

    const dbacc = {} as any;
    const instance = new BZLInstance(dbacc);

    const projectA = instance.ProjectBZL;
    const projectB = instance.ProjectBZL;
    const vizA = instance.VisualizationBZL;
    const vizB = instance.VisualizationBZL;
    const dashA = instance.DashboardBZL;
    const dashB = instance.DashboardBZL;

    expect(projectA).toBe(projectB);
    expect(vizA).toBe(vizB);
    expect(dashA).toBe(dashB);

    expect(ProjectBZL).toHaveBeenCalledTimes(1);
    expect(VisualizationBZL).toHaveBeenCalledTimes(1);
    expect(DashboardBZL).toHaveBeenCalledTimes(1);
    expect(ProjectBZL).toHaveBeenCalledWith(dbacc);
    expect(VisualizationBZL).toHaveBeenCalledWith(dbacc);
    expect(DashboardBZL).toHaveBeenCalledWith(dbacc);
  });

  it('caches dbacc libs across repeated getters', async () => {
    const ModelInstance = jest.fn().mockImplementation(() => ({ model: true }));
    const Project = jest.fn().mockImplementation(() => ({ type: 'project-lib' }));
    const Visualization = jest.fn().mockImplementation(() => ({ type: 'visualization-lib' }));
    const Dashboard = jest.fn().mockImplementation(() => ({ type: 'dashboard-lib' }));

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

    const DbaccInstance = (await import('../../src/dbacc/lib')).default;

    const connection = { name: 'conn' } as any;
    const instance = new DbaccInstance(connection);

    const projectA = instance.Project;
    const projectB = instance.Project;
    const vizA = instance.Visualization;
    const vizB = instance.Visualization;
    const dashA = instance.Dashboard;
    const dashB = instance.Dashboard;

    expect(projectA).toBe(projectB);
    expect(vizA).toBe(vizB);
    expect(dashA).toBe(dashB);

    expect(ModelInstance).toHaveBeenCalledTimes(1);
    expect(ModelInstance).toHaveBeenCalledWith(connection);
    expect(Project).toHaveBeenCalledTimes(1);
    expect(Visualization).toHaveBeenCalledTimes(1);
    expect(Dashboard).toHaveBeenCalledTimes(1);
  });
});
