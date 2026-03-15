import VisualizationBZL from '../../src/bzl/visualization/visualization';
import Factory from '../../src/factory';

describe('bzl visualization delete dashboard reindexing', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reindexes dashboard layouts after removing a visualization', async () => {
    const createFilter = jest.fn((query) => ({ query }));
    const deleteMany = jest.fn().mockResolvedValue(true);
    const dashboardCreateFilter = jest.fn((query) => ({ query }));
    const dashboardUpdate = jest.fn().mockResolvedValue({});

    const mockDbacc = {
      Visualization: {
        createFilter,
        deleteMany
      },
      Dashboard: {
        createFilter: dashboardCreateFilter,
        browse: jest.fn().mockResolvedValue({
          dashboards: [{
            name: 'Dashboard_1',
            visualizations: {
              viz_sankey: 'sankey',
              keep_line: 'line-chart'
            },
            layouts: [
              {
                i: 'viz',
                x: 0,
                y: 0,
                w: 3,
                h: 3,
                minW: 1,
                minH: 1
              },
              {
                i: 'keep-a',
                x: 1,
                y: 0,
                w: 3,
                h: 3,
                minW: 1,
                minH: 1
              },
              {
                i: 'keep-b',
                x: 2,
                y: 0,
                w: 3,
                h: 3,
                minW: 1,
                minH: 1
              }
            ]
          }]
        }),
        update: dashboardUpdate
      }
    } as any;

    jest.spyOn(Factory, 'getInstance').mockReturnValue({
      getBZL: () => ({
        ProjectBZL: {
          browse: jest.fn().mockResolvedValue({
            projects: [{ name: 'Active_Project' }]
          })
        }
      })
    } as any);

    const bzl = new VisualizationBZL(mockDbacc);

    await expect(bzl.delete({
      name: 'viz',
      type: 'sankey'
    } as any)).resolves.toBe(true);

    expect(createFilter).toHaveBeenCalledWith({
      name: 'viz',
      type: 'sankey',
      projectName: 'Active_Project'
    });

    expect(dashboardUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ query: { name: 'Dashboard_1' } }),
      expect.objectContaining({
        $set: expect.objectContaining({
          layouts: [{}, {}]
        })
      })
    );
    expect(deleteMany).toHaveBeenCalled();
  });
});
