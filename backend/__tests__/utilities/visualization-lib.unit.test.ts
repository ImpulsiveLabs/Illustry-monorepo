import Visualization from '../../src/dbacc/lib/visualization/visualization';

describe('dbacc visualization unit', () => {
  const createModel = () => {
    const findOneExec = jest.fn().mockResolvedValue({ name: 'viz' });
    const findExec = jest.fn().mockResolvedValue([{ name: 'viz' }]);
    const countDocuments = jest.fn().mockResolvedValue(5);
    const updateExec = jest.fn().mockResolvedValue({ name: 'updated' });
    const deleteExec = jest.fn().mockResolvedValue({});

    const model = {
      create: jest.fn().mockResolvedValue({ name: 'created' }),
      findOne: jest.fn(() => ({ exec: findOneExec })),
      find: jest.fn(() => ({ exec: findExec })),
      countDocuments: jest.fn(() => countDocuments()),
      findOneAndUpdate: jest.fn(() => ({ exec: updateExec })),
      deleteOne: jest.fn(() => ({ exec: deleteExec })),
      deleteMany: jest.fn(() => ({ exec: deleteExec }))
    } as any;

    return { model, findOneExec, findExec, countDocuments, updateExec };
  };

  it('covers createFilter branches and sort/page defaults', () => {
    const { model } = createModel();
    const lib = new Visualization({ VisualizationModel: model } as any);

    const filter = lib.createFilter({
      name: 'n',
      projectName: 'p',
      tags: ['a'] as any,
      type: ['sankey', 'matrix'],
      text: 'abc$[]',
      page: 2,
      per_page: 4,
      sort: { element: 'name', sortOrder: -1 }
    } as any);

    expect(filter.page).toBe(4);
    expect(filter.per_page).toBe(4);
    expect(filter.sort).toEqual({ name: -1 });
    expect((((filter.query || {}) as any).$and as any[]).length).toBeGreaterThan(0);

    const fallback = lib.createFilter({ type: 'sankey' } as any);
    expect(fallback.per_page).toBe(10);
    expect(fallback.sort).toEqual({});
  });

  it('covers create/findOne/browse/update/delete/deleteMany', async () => {
    const { model } = createModel();
    const lib = new Visualization({ VisualizationModel: model } as any);

    await expect(lib.create({ name: 'a' } as any)).resolves.toEqual({ name: 'created' });
    await expect(lib.findOne({ query: { name: 'a' } } as any)).resolves.toEqual({ name: 'viz' });

    const browsed = await lib.browse({ query: { a: 1 }, page: 1, per_page: 2, sort: { name: 1 } } as any);
    expect(browsed.visualizations).toEqual([{ name: 'viz' }]);
    expect(browsed.pagination?.count).toBe(5);

    await expect(lib.update({ query: { name: 'a' } } as any, { name: 'b' } as any)).resolves.toEqual({ name: 'updated' });
    await expect(lib.delete({ query: { name: 'a' } } as any)).resolves.toBe(true);
    await expect(lib.deleteMany({ query: { projectName: 'p' } } as any)).resolves.toBe(true);

    expect(model.deleteMany).toHaveBeenCalled();
  });
});
