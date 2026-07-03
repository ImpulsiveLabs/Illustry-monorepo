import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  createDashboard,
  exportAsset,
  exportDashboard,
  exportVisualization,
  getVisualization,
  importVisualization,
  listVisualizations,
  listProjects,
  normalizeExportResource,
  normalizeImportMapping,
  normalizeListResource,
  removeVisualization,
  removeProject,
  updateDashboard,
  updateProject
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

  it('lists projects with blank filters as an unfiltered frontend-style search', async () => {
    const calls: unknown[] = [];
    const client = {
      browse: jest.fn(async (request) => {
        calls.push(request);
        return { projects: [{ name: 'Project' }] };
      }),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const context = {
      client: jest.fn(async () => client),
      profile: jest.fn(async () => ({ mode: 'live', serverUrl: 'http://illustry.local' })),
      saveClientSession: jest.fn()
    } as any;

    const result = await listProjects(context, {
      text: '',
      name: '   ',
      page: undefined,
      perPage: '',
      sort: '  '
    });

    expect(calls).toEqual([{ resource: 'projects', query: {} }]);
    expect(result).toMatchObject({
      mode: 'live',
      server: 'http://illustry.local',
      resource: 'projects',
      data: { projects: [{ name: 'Project' }] }
    });
    expect(context.saveClientSession).toHaveBeenCalledWith({ cookie: 'sid=1' });
  });

  it('uses a single text search for project queries', async () => {
    const client = {
      browse: jest.fn(async () => ({ projects: [] })),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const context = {
      client: jest.fn(async () => client),
      profile: jest.fn(async () => ({ mode: 'live', serverUrl: 'http://illustry.local' })),
      saveClientSession: jest.fn()
    } as any;

    await listProjects(context, { text: 'Revenue' });

    expect(client.browse).toHaveBeenCalledWith({
      resource: 'projects',
      query: { text: 'Revenue' }
    });
  });

  it('lists visualizations with blank filters as an unfiltered frontend-style search', async () => {
    const calls: unknown[] = [];
    const client = {
      browse: jest.fn(async (request) => {
        calls.push(request);
        return { visualizations: [{ name: 'Revenue', type: 'bar-chart' }] };
      }),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const context = {
      client: jest.fn(async () => client),
      profile: jest.fn(async () => ({ mode: 'live', serverUrl: 'http://illustry.local' })),
      saveClientSession: jest.fn()
    } as any;

    const result = await listVisualizations(context, {
      text: '',
      name: '   ',
      page: undefined,
      perPage: '',
      sort: '  '
    });

    expect(calls).toEqual([{ resource: 'visualizations', query: {} }]);
    expect(result).toMatchObject({
      mode: 'live',
      server: 'http://illustry.local',
      resource: 'visualizations',
      data: { visualizations: [{ name: 'Revenue', type: 'bar-chart' }] }
    });
    expect(context.saveClientSession).toHaveBeenCalledWith({ cookie: 'sid=1' });
  });

  it('preflights project update and delete with findProject', async () => {
    const calls: string[] = [];
    const client = {
      findProject: jest.fn(async (name) => {
        calls.push(`find:${name}`);
        return { name };
      }),
      updateProject: jest.fn(async (payload) => {
        calls.push(`update:${payload.name}`);
        return payload;
      }),
      deleteProject: jest.fn(async (name) => {
        calls.push(`delete:${name}`);
        return true;
      }),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const context = {
      client: jest.fn(async () => client),
      saveClientSession: jest.fn()
    } as any;

    await updateProject(context, { name: 'Alpha', description: 'Updated', active: true });
    await removeProject(context, 'Alpha');

    expect(calls).toEqual(['find:Alpha', 'update:Alpha', 'find:Alpha', 'delete:Alpha']);
    expect(client.updateProject).toHaveBeenCalledWith({
      name: 'Alpha',
      description: 'Updated',
      isActive: true
    });
  });

  it('preflights visualization view and delete with findVisualization', async () => {
    const calls: string[] = [];
    const client = {
      findVisualization: jest.fn(async (name, type) => {
        calls.push(`find:${name}:${type || ''}`);
        return { name, type };
      }),
      deleteVisualization: jest.fn(async (payload) => {
        calls.push(`delete:${payload.name}:${payload.type || ''}`);
        return true;
      }),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const context = {
      client: jest.fn(async () => client),
      saveClientSession: jest.fn()
    } as any;

    await getVisualization(context, { name: 'Revenue', type: 'bar-chart' });
    await removeVisualization(context, { name: 'Revenue', type: 'bar-chart' });

    expect(calls).toEqual(['find:Revenue:bar-chart', 'find:Revenue:bar-chart', 'delete:Revenue:bar-chart']);
    expect(client.deleteVisualization).toHaveBeenCalledWith({
      name: 'Revenue',
      type: 'bar-chart'
    });
  });

  it('fails when a visualization lookup does not exist', async () => {
    const client = {
      findVisualization: jest.fn(async () => null),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const context = {
      client: jest.fn(async () => client),
      saveClientSession: jest.fn()
    } as any;

    await expect(getVisualization(context, { name: 'Missing', type: 'bar-chart' }))
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_VISUALIZATION_NOT_FOUND' });
  });

  it('rejects non-JSON all-details imports before contacting the live backend', async () => {
    const source = path.join(tempDir, 'sales.csv');
    await fs.writeFile(source, 'label,value\nA,1\n', 'utf8');
    const client = {
      uploadVisualizationSource: jest.fn(async () => ({ ok: true })),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const context = {
      client: jest.fn(async () => client),
      profile: jest.fn(async () => ({ mode: 'live', serverUrl: 'http://illustry.local' })),
      saveClientSession: jest.fn()
    } as any;

    await expect(importVisualization(context, {
      file: source,
      fullDetails: true
    })).rejects.toMatchObject({ code: 'ILLUSTRY_CLI_IMPORT_FULL_DETAILS_JSON_ONLY' });
    expect(client.uploadVisualizationSource).not.toHaveBeenCalled();
  });

  it('rejects removed visualization types embedded in live full-details files', async () => {
    const source = path.join(tempDir, 'timeline.json');
    await fs.writeFile(source, JSON.stringify({ type: 'timeline', data: { events: [] } }), 'utf8');
    const client = {
      uploadVisualizationSource: jest.fn(),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const context = {
      client: jest.fn(async () => client),
      profile: jest.fn(async () => ({ mode: 'live', serverUrl: 'http://illustry.local' })),
      saveClientSession: jest.fn()
    } as any;

    await expect(importVisualization(context, {
      file: source,
      fullDetails: true
    })).rejects.toMatchObject({
      code: 'ILLUSTRY_CLI_UNSUPPORTED_VISUALIZATION_TYPE'
    });
    expect(client.uploadVisualizationSource).not.toHaveBeenCalled();
  });

  it('passes selected visualization records to dashboard create and update', async () => {
    const visualizations = {
      'Revenue_bar-chart': 'bar-chart',
      'Regions_pie-chart': 'pie-chart'
    };
    const client = {
      createDashboard: jest.fn(async (payload) => ({ dashboard: payload })),
      findDashboard: jest.fn(async (name) => ({ name })),
      updateDashboard: jest.fn(async (payload) => ({ dashboard: payload })),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const context = {
      client: jest.fn(async () => client),
      saveClientSession: jest.fn()
    } as any;

    await createDashboard(context, {
      name: 'Executive',
      description: 'Overview',
      visualizations
    });
    await updateDashboard(context, {
      name: 'Executive',
      description: 'Updated',
      visualizations
    });

    expect(client.createDashboard).toHaveBeenCalledWith({
      name: 'Executive',
      description: 'Overview',
      visualizations
    });
    expect(client.findDashboard).toHaveBeenCalledWith('Executive', true);
    expect(client.updateDashboard).toHaveBeenCalledWith({
      name: 'Executive',
      description: 'Updated',
      visualizations
    });
  });

  it('exports dashboards by deriving backend bundle charts from attached visualizations', async () => {
    const exported = {
      filename: 'dashboard-Executive.zip',
      buffer: Buffer.from('zip'),
      mimeType: 'application/zip'
    };
    const client = {
      findDashboard: jest.fn(async () => ({
        name: 'Executive',
        visualizations: [{
          name: 'Revenue',
          type: 'bar-chart',
          data: {
            headers: ['Jan', 'Feb'],
            values: { Sales: [12, 18] }
          }
        }]
      })),
      downloadExport: jest.fn(async () => exported),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const store = {
      writeExportFile: jest.fn(async (file) => path.join(tempDir, file.filename))
    };
    const context = {
      client: jest.fn(async () => client),
      store: jest.fn(async () => store),
      saveClientSession: jest.fn()
    } as any;

    const result = await exportDashboard(context, {
      name: 'Executive',
      format: 'png,excel',
      out: tempDir
    });

    expect(client.findDashboard).toHaveBeenCalledWith('Executive', true);
    expect(client.downloadExport).toHaveBeenCalledWith({
      resource: 'dashboard',
      name: 'Executive',
      body: expect.objectContaining({
        name: 'Executive',
        title: 'dashboard-Executive',
        formats: ['png', 'excel'],
        charts: [expect.objectContaining({
          title: 'Revenue (Bar Chart)',
          width: 557,
          height: 320,
          option: expect.objectContaining({
            legend: expect.objectContaining({ show: true, data: ['Sales'] }),
            toolbox: expect.objectContaining({ feature: expect.objectContaining({ restore: {} }) }),
            xAxis: [expect.objectContaining({ data: ['Jan', 'Feb'], boundaryGap: true })],
            series: [expect.objectContaining({
              name: 'Sales',
              type: 'bar',
              color: '#5DBE6E',
              emphasis: { focus: 'series' },
              data: [12, 18]
            })]
          })
        })]
      })
    });
    expect(store.writeExportFile).toHaveBeenCalledWith(exported, tempDir);
    expect(result).toMatchObject({
      mode: 'live',
      filename: 'dashboard-Executive.zip',
      mimeType: 'application/zip',
      bundled: true
    });
  });

  it('uses the same generated dashboard bundle path for direct live dashboard exports', async () => {
    const client = {
      findDashboard: jest.fn(async () => ({
        name: 'Executive',
        visualizations: [{
          name: 'Regions',
          type: 'pie-chart',
          data: { values: { North: 20, South: 30 } }
        }]
      })),
      downloadExport: jest.fn(async () => ({
        filename: 'dashboard-Executive.png',
        buffer: Buffer.from('png'),
        mimeType: 'image/png'
      })),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const store = {
      getAsset: jest.fn(),
      writeExportFile: jest.fn(async (file) => path.join(tempDir, file.filename))
    };
    const context = {
      client: jest.fn(async () => client),
      profile: jest.fn(async () => ({ mode: 'live', serverUrl: 'http://illustry.local' })),
      store: jest.fn(async () => store),
      saveClientSession: jest.fn()
    } as any;

    await exportAsset(context, {
      asset: 'Executive',
      resource: 'dashboard'
    });

    expect(store.getAsset).not.toHaveBeenCalled();
    expect(client.downloadExport).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'dashboard',
      body: expect.objectContaining({
        title: 'dashboard-Executive',
        formats: ['png'],
        charts: [expect.objectContaining({
          title: 'Regions (Pie Chart)',
          option: expect.objectContaining({
            toolbox: expect.objectContaining({ feature: expect.objectContaining({ restore: {} }) }),
            series: [expect.objectContaining({
              type: 'pie',
              data: [{ name: 'North', value: 20 }, { name: 'South', value: 30 }]
            })]
          })
        })]
      })
    }));
  });

  it('exports visualizations by deriving backend bundle charts from the visualization details', async () => {
    const exported = {
      filename: 'Revenue.zip',
      buffer: Buffer.from('zip'),
      mimeType: 'application/zip'
    };
    const client = {
      findVisualization: jest.fn(async () => ({
        name: 'Revenue',
        type: 'bar-chart',
        data: {
          headers: ['Jan', 'Feb'],
          values: { Sales: [12, 18] }
        }
      })),
      downloadExport: jest.fn(async () => exported),
      getSessionSnapshot: jest.fn(() => ({ cookie: 'sid=1' }))
    };
    const store = {
      writeExportFile: jest.fn(async (file) => path.join(tempDir, file.filename))
    };
    const context = {
      client: jest.fn(async () => client),
      store: jest.fn(async () => store),
      saveClientSession: jest.fn()
    } as any;

    const result = await exportVisualization(context, {
      name: 'Revenue',
      format: 'png,excel,pdf,word,ppt',
      out: tempDir
    });

    expect(client.findVisualization).toHaveBeenCalledWith('Revenue', undefined);
    expect(client.downloadExport).toHaveBeenCalledWith({
      resource: 'visualization',
      name: 'Revenue',
      body: expect.objectContaining({
        name: 'Revenue',
        type: 'bar-chart',
        title: 'Revenue',
        formats: ['png', 'excel', 'pdf', 'word', 'ppt'],
        charts: [expect.objectContaining({
          title: 'Revenue (Bar Chart)',
          width: 557,
          height: 320,
          option: expect.objectContaining({
            xAxis: [expect.objectContaining({ data: ['Jan', 'Feb'], boundaryGap: true })],
            series: [expect.objectContaining({
              name: 'Sales',
              type: 'bar',
              data: [12, 18]
            })]
          })
        })]
      })
    });
    expect(store.writeExportFile).toHaveBeenCalledWith(exported, tempDir);
    expect(result).toMatchObject({
      mode: 'live',
      filename: 'Revenue.zip',
      mimeType: 'application/zip',
      bundled: true
    });
  });

  it('rejects unsupported visualization bundle formats before contacting the backend', async () => {
    const client = {
      findVisualization: jest.fn(),
      downloadExport: jest.fn(),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const context = {
      client: jest.fn(async () => client),
      store: jest.fn()
    } as any;

    await expect(exportVisualization(context, {
      name: 'Revenue',
      format: 'json'
    })).rejects.toThrow('Visualization exports support png, jpg, webp, svg, web-component, excel, pdf, word, ppt');

    expect(client.findVisualization).not.toHaveBeenCalled();
    expect(client.downloadExport).not.toHaveBeenCalled();
  });

  it('exports dashboard calendar charts with the same category series shape as the frontend', async () => {
    const exported = {
      filename: 'dashboard-Planning.svg',
      buffer: Buffer.from('svg'),
      mimeType: 'image/svg+xml;charset=utf-8'
    };
    const client = {
      findDashboard: jest.fn(async () => ({
        name: 'Planning',
        visualizations: [{
          name: 'Calendar',
          type: 'calendar',
          data: {
            calendar: [
              { date: '2026-01-01', value: 1, category: 'A' },
              { date: '2026-01-02', value: 2, category: 'B' },
              { date: '2026-01-03', value: 3, category: 'A' }
            ]
          }
        }]
      })),
      downloadExport: jest.fn(async () => exported),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const store = {
      writeExportFile: jest.fn(async (file) => path.join(tempDir, file.filename))
    };
    const context = {
      client: jest.fn(async () => client),
      store: jest.fn(async () => store),
      saveClientSession: jest.fn()
    } as any;

    await exportDashboard(context, {
      name: 'Planning',
      format: 'svg',
      out: tempDir
    });

    expect(client.downloadExport).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        charts: [expect.objectContaining({
          title: 'Calendar (Calendar)',
          width: 557,
          height: 320,
          option: expect.objectContaining({
            legend: expect.objectContaining({ show: true, data: ['A', 'B'] }),
            visualMap: expect.objectContaining({
              show: false,
              type: 'piecewise',
              categories: ['A', 'B']
            }),
            calendar: [expect.objectContaining({ top: 68, range: '2026' })],
            series: [
              expect.objectContaining({ name: 'A', type: 'heatmap', calendarIndex: 0, data: expect.any(Array) }),
              expect.objectContaining({ name: 'B', type: 'heatmap', calendarIndex: 0, data: expect.any(Array) })
            ],
            toolbox: expect.objectContaining({ feature: expect.objectContaining({ restore: {} }) })
          })
        })]
      })
    }));
  });

  it('rejects unsupported dashboard bundle formats before contacting the backend', async () => {
    const client = {
      findDashboard: jest.fn(),
      downloadExport: jest.fn(),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const context = {
      client: jest.fn(async () => client),
      store: jest.fn()
    } as any;

    await expect(exportDashboard(context, {
      name: 'Executive',
      format: 'json'
    })).rejects.toThrow('Dashboard exports support png, jpg, webp, svg, web-component, excel, pdf, word, ppt');

    expect(client.findDashboard).not.toHaveBeenCalled();
    expect(client.downloadExport).not.toHaveBeenCalled();
  });

  it('explains when a dashboard has no exportable visualizations', async () => {
    const client = {
      findDashboard: jest.fn(async () => ({ name: 'Empty', visualizations: [] })),
      downloadExport: jest.fn(),
      getSessionSnapshot: jest.fn(() => ({}))
    };
    const context = {
      client: jest.fn(async () => client),
      store: jest.fn()
    } as any;

    await expect(exportDashboard(context, {
      name: 'Empty',
      format: 'png'
    })).rejects.toThrow('Dashboard "Empty" has no exportable visualizations');

    expect(client.downloadExport).not.toHaveBeenCalled();
  });
});
