import type { IllustryLocalAsset } from '../src';

const mockWrite = jest.fn();

jest.mock('pptxgenjs', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addSlide: jest.fn(() => ({
      addImage: jest.fn(),
      background: undefined
    })),
    write: mockWrite
  }))
}));

const makeAsset = (): IllustryLocalAsset => ({
  id: 'asset_1',
  kind: 'visualization',
  name: 'Deck Export',
  type: 'bar-chart',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  charts: [{
    title: 'Deck Export',
    width: 320,
    height: 240,
    option: {
      xAxis: { type: 'category', data: ['A'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [1] }]
    }
  }]
});

describe('@illustry/core PowerPoint export adapter', () => {
  const workerId = process.env.JEST_WORKER_ID;

  beforeEach(() => {
    delete process.env.JEST_WORKER_ID;
    mockWrite.mockReset();
  });

  afterEach(() => {
    process.env.JEST_WORKER_ID = workerId;
  });

  it.each([
    ['Buffer output', Buffer.from('ppt-buffer')],
    ['Uint8Array output', new Uint8Array([1, 2, 3])],
    ['ArrayBuffer output', new Uint8Array([4, 5, 6]).buffer],
    ['binary string output', 'ppt-string']
  ])('normalizes %s from pptxgenjs', async (_label, output) => {
    const { createLocalExportBundle } = await import('../src');
    mockWrite.mockResolvedValueOnce(output);

    const bundle = await createLocalExportBundle({
      asset: makeAsset(),
      formats: ['ppt']
    });

    expect(bundle).toMatchObject({
      bundled: false,
      filename: 'Deck-Export.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
    expect(bundle.buffer.length).toBeGreaterThan(0);
  }, 30000);

  it('falls back to a generated pptx package when pptxgenjs output is unsupported', async () => {
    const { createLocalExportBundle } = await import('../src');
    mockWrite.mockResolvedValueOnce({ invalid: true });

    const bundle = await createLocalExportBundle({
      asset: makeAsset(),
      formats: ['ppt']
    });

    expect(bundle.filename).toBe('Deck-Export.pptx');
    expect(bundle.buffer.toString('utf8', 0, 2)).toBe('PK');
  }, 30000);

  it('falls back to a generated pptx package when pptxgenjs throws', async () => {
    const { createLocalExportBundle } = await import('../src');
    mockWrite.mockRejectedValueOnce(new Error('pptx failed'));

    const bundle = await createLocalExportBundle({
      asset: makeAsset(),
      formats: ['ppt']
    });

    expect(bundle.filename).toBe('Deck-Export.pptx');
    expect(bundle.buffer.toString('utf8', 0, 2)).toBe('PK');
  }, 30000);
});
