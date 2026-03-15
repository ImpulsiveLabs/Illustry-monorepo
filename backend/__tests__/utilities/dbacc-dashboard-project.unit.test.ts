import Dashboard from '../../src/dbacc/lib/dashboard/dashboard';
import Project from '../../src/dbacc/lib/project/project';

describe('dbacc dashboard/project unit branches', () => {
  const createDashboardModel = () => {
    const findOneExec = jest.fn().mockResolvedValue({ name: 'dashboard' });
    const findExec = jest.fn().mockResolvedValue([{ name: 'dashboard' }]);
    const countExec = jest.fn().mockResolvedValue(3);
    const updateExec = jest.fn().mockResolvedValue({ name: 'updated' });
    const deleteExec = jest.fn().mockResolvedValue({});

    const model = {
      create: jest.fn().mockResolvedValue({ name: 'created' }),
      findOne: jest.fn(() => ({ exec: findOneExec })),
      find: jest.fn(() => ({ exec: findExec })),
      countDocuments: jest.fn(() => ({ exec: countExec })),
      findOneAndUpdate: jest.fn(() => ({ exec: updateExec })),
      deleteOne: jest.fn(() => ({ exec: deleteExec })),
      deleteMany: jest.fn(() => ({ exec: deleteExec }))
    } as any;

    return { model, countExec };
  };

  const createProjectModel = () => {
    const findOneExec = jest.fn().mockResolvedValue({ name: 'project', createdAt: new Date() });
    const findExec = jest.fn().mockResolvedValue([{ name: 'project' }]);
    const countExec = jest.fn().mockResolvedValue(5);
    const updateManyExec = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const deleteExec = jest.fn().mockResolvedValue({});
    const findOneAndUpdateExec = jest.fn().mockResolvedValue({ name: 'updated-project' });
    const findOneAndUpdate = jest.fn(() => ({
      exec: findOneAndUpdateExec,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(findOneAndUpdateExec()).then(resolve),
      catch: (reject: (reason?: unknown) => unknown) => Promise.resolve(findOneAndUpdateExec()).catch(reject)
    }));

    const model = {
      create: jest.fn().mockResolvedValue({ name: 'created-project' }),
      findOne: jest.fn(() => ({ exec: findOneExec })),
      find: jest.fn(() => ({ exec: findExec })),
      countDocuments: jest.fn(() => ({ exec: countExec })),
      updateMany: jest.fn(() => ({ exec: updateManyExec })),
      findOneAndUpdate,
      deleteOne: jest.fn(() => ({ exec: deleteExec }))
    } as any;

    return { model, findOneExec, countExec };
  };

  it('covers dashboard createFilter/create/browse/update/partialUpdate/delete paths', async () => {
    const { model, countExec } = createDashboardModel();
    const lib = new Dashboard({ DashboardModel: model } as any);

    const filter = lib.createFilter({
      name: 'd1',
      projectName: 'p1',
      text: 'abc$[]',
      visualizationName: 'viz',
      visualizationType: 'line-chart' as any,
      page: 2,
      per_page: 4,
      sort: { element: 'name', sortOrder: -1 }
    } as any);

    expect(filter.page).toBe(4);
    expect(filter.per_page).toBe(4);
    expect(filter.sort).toEqual({ name: -1 });
    expect(((filter.query as any).$and as any[]).length).toBeGreaterThan(0);

    const fallback = lib.createFilter({} as any);
    expect(fallback.query).toEqual({});
    expect(fallback.per_page).toBe(10);

    const ascendingSort = lib.createFilter({
      sort: { element: 'name', sortOrder: 1 }
    } as any);
    expect(ascendingSort.sort).toEqual({ name: 1 });

    await expect(lib.create({ name: 'd-create' } as any)).resolves.toEqual({ name: 'created' });
    await expect(lib.findOne({ query: { name: 'd1' } } as any)).resolves.toEqual({ name: 'dashboard' });

    const withoutViz = await lib.browse({ query: {}, page: 0, per_page: 2, sort: { name: 1 } } as any, false);
    expect(withoutViz.dashboards).toEqual([{ name: 'dashboard' }]);

    const withViz = await lib.browse({ query: {}, page: 0, per_page: 2, sort: { name: 1 } } as any, true);
    expect(withViz.pagination?.count).toBe(3);

    const defaultPerPageBrowse = await lib.browse({ query: {}, page: 1 } as any, true);
    expect(defaultPerPageBrowse.pagination?.pageCount).toBeCloseTo(0.3);

    countExec.mockResolvedValueOnce(0);
    const defaultBrowse = await lib.browse({} as any, false);
    expect(defaultBrowse.pagination?.pageCount).toBe(1);

    await expect(lib.update({ query: { name: 'd1' } } as any, { name: 'd1-updated' } as any)).resolves.toEqual({ name: 'updated' });
    await expect(lib.partialUpdate({ query: { name: 'd1' } } as any, { layouts: [] } as any)).resolves.toEqual({ name: 'updated' });
    await expect(lib.delete({ query: { name: 'd1' } } as any)).resolves.toBe(true);
    await expect(lib.deleteMany({ query: { projectName: 'p1' } } as any)).resolves.toBe(true);
  });

  it('covers project createFilter/create/update/browse/delete branches', async () => {
    const { model, findOneExec, countExec } = createProjectModel();
    const lib = new Project({ ProjectModel: model } as any);

    const filter = lib.createFilter({
      name: 'p1',
      isActive: true,
      text: 'foo$[]',
      page: 3,
      per_page: 2,
      sort: { element: 'updatedAt', sortOrder: -1 }
    } as any);

    expect(filter.page).toBe(4);
    expect(filter.per_page).toBe(2);
    expect(filter.sort).toEqual({ updatedAt: -1 });

    const noFilter = lib.createFilter({} as any);
    expect(noFilter.query).toEqual({});

    const ascendingSort = lib.createFilter({
      sort: { element: 'name', sortOrder: 1 }
    } as any);
    expect(ascendingSort.sort).toEqual({ name: 1 });

    await expect(lib.create({ name: 'inactive' } as any)).resolves.toEqual({ name: 'created-project' });
    await expect(lib.create({ name: 'active', isActive: true } as any)).resolves.toEqual({ name: 'created-project' });
    expect(model.updateMany).toHaveBeenCalled();

    await expect(lib.findOne({ query: { name: 'p1' } } as any)).resolves.toEqual({ name: 'project', createdAt: expect.any(Date) });
    const browsed = await lib.browse({ query: {}, page: 1, per_page: 2, sort: { name: 1 } } as any);
    expect(browsed.projects).toEqual([{ name: 'project' }]);

    const defaultPerPageBrowse = await lib.browse({ query: {}, page: 1 } as any);
    expect(defaultPerPageBrowse.pagination?.pageCount).toBeCloseTo(0.5);

    countExec.mockResolvedValueOnce(0);
    const defaultBrowse = await lib.browse({} as any);
    expect(defaultBrowse.pagination?.pageCount).toBe(1);

    await expect(lib.update({ query: { name: 'p1' } } as any, { description: 'x' } as any)).resolves.toEqual({ name: 'updated-project' });
    await expect(lib.update({ query: { name: 'p1' } } as any, { isActive: true } as any)).resolves.toEqual({ name: 'updated-project' });

    findOneExec.mockResolvedValueOnce(null);
    await expect(lib.update({ query: { name: 'missing' } } as any, { isActive: false } as any)).resolves.toEqual({ name: 'updated-project' });

    await expect(lib.delete({ query: { name: 'p1' } } as any)).resolves.toBe(true);
  });
});
