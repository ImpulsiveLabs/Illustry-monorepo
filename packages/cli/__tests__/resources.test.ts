import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  normalizeExportResource,
  normalizeImportMapping,
  normalizeListResource
} from '../src/services/resources';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-cli-resources-'));

describe('@illustry/cli resource helpers', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('normalizes resource aliases and import mapping flags', () => {
    expect(normalizeListResource()).toBe('assets');
    expect(normalizeListResource('project')).toBe('projects');
    expect(normalizeListResource('visualization')).toBe('visualizations');
    expect(normalizeListResource('dashboard')).toBe('dashboards');
    expect(normalizeExportResource()).toBe('visualization');
    expect(normalizeExportResource('visualizations')).toBe('visualization');
    expect(normalizeExportResource('dashboards')).toBe('dashboard');
    expect(() => normalizeListResource('nope')).toThrow('Unsupported resource');
    expect(() => normalizeExportResource('nope')).toThrow('Unsupported export resource');
    expect(normalizeImportMapping({})).toBeUndefined();
    expect(normalizeImportMapping({ mapping: 'x=Country,y=Revenue' })).toEqual({
      label: 'Country',
      value: 'Revenue'
    });
    expect(normalizeImportMapping({
      mapping: { label: 'Old', value: 'Amount' },
      labelColumn: 'Country',
      valueColumn: 'Revenue'
    })).toEqual({
      label: 'Country',
      value: 'Revenue'
    });
  });
});
