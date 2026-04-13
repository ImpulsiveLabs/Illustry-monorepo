import * as Types from '../src';
import {
  calendarDataSchema,
  commonFileSchema,
  csvFileSchema,
  dashboardCreateSchema,
  dashboardFilterSchema,
  excelFileSchema,
  jsonFileSchema,
  prettifyZodError,
  projectCreateSchema,
  projectFilterSchema,
  validateWithSchema,
  visualizationAxisChartSchema,
  visualizationCalendarSchema,
  visualizationExtendedTypeSchema,
  visualizationFileSchema,
  visualizationFilterSchema,
  visualizationHierarchySchema,
  visualizationNodeLinkSchema,
  visualizationPieChartFunnelSchema,
  visualizationScatterSchema,
  visualizationTimelineSchema,
  visualizationTypeSchema,
  visualizationWordCloudSchema,
  xmlFileSchema
} from '../src/validator';
import { FileType } from '../src/files';
import { VisualizationTypesEnum } from '../src/visualization';
import { z } from 'zod';

describe('types package runtime exports', () => {
  it('re-exports the runtime modules and enums', () => {
    expect(Types.FileTypes.FileType.JSON).toBe('JSON');
    expect(Types.VisualizationTypes.VisualizationTypesEnum.BAR_CHART).toBe('bar-chart');
    expect(Types.ValidatorSchemas.validateWithSchema).toBe(validateWithSchema);
    expect(Types.ProjectTypes).toBeDefined();
    expect(Types.DashboardTypes).toBeDefined();
    expect(Types.TransformerTypes).toBeDefined();
    expect(Types.GenericTypes).toBeDefined();
    expect(Types.UtilTypes).toBeDefined();
  });
});

describe('validator schemas', () => {
  const baseVisualization = {
    _id: 'viz-1',
    __v: 1,
    userId: 'user-1',
    projectName: 'project-1',
    description: 'desc',
    name: 'viz-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('parses every visualization schema variant', () => {
    expect(visualizationNodeLinkSchema.parse({
      ...baseVisualization,
      type: VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
      data: {
        nodes: [{ name: 'n1', category: 'cat', labels: [{ name: 'l1', value: 1 }], properties: 'meta' }],
        links: [{ source: 'n1', target: 'n2', value: 1, properties: [{ foo: 'bar' }] }]
      }
    }).data.nodes).toHaveLength(1);

    expect(visualizationCalendarSchema.parse({
      ...baseVisualization,
      name: 'calendar',
      type: [VisualizationTypesEnum.CALENDAR],
      tags: ['one', 'two'],
      data: {
        calendar: [{ date: '2026-01-01', value: 2, category: 'work', properties: ['meta'] }]
      }
    }).data.calendar[0].value).toBe(2);

    expect(visualizationWordCloudSchema.parse({
      ...baseVisualization,
      name: 'cloud',
      type: VisualizationTypesEnum.WORD_CLOUD,
      tags: 'solo',
      data: {
        words: [{ name: 'alpha', value: 5, properties: { rank: 1 } }]
      }
    }).data.words[0].name).toBe('alpha');

    expect(visualizationAxisChartSchema.parse({
      ...baseVisualization,
      name: 'axis',
      type: [VisualizationTypesEnum.LINE_CHART, VisualizationTypesEnum.BAR_CHART],
      data: {
        headers: ['Jan'],
        values: { series: [1] }
      }
    }).data.values.series[0]).toBe(1);

    expect(visualizationScatterSchema.parse({
      ...baseVisualization,
      name: 'scatter',
      type: VisualizationTypesEnum.SCATTER,
      data: {
        points: [{ value: [1, 2], category: 'cat' }]
      }
    }).data.points[0].value).toEqual([1, 2]);

    expect(visualizationPieChartFunnelSchema.parse({
      ...baseVisualization,
      name: 'pie',
      type: [VisualizationTypesEnum.PIE_CHART, VisualizationTypesEnum.FUNNEL],
      data: {
        values: { A: 10 },
        properties: 'detail'
      }
    }).data.values.A).toBe(10);

    expect(visualizationHierarchySchema.parse({
      ...baseVisualization,
      name: 'tree',
      type: VisualizationTypesEnum.TREEMAP,
      data: {
        nodes: [{
          name: 'root',
          value: 5,
          category: 'cat',
          children: [{ name: 'child', value: 2, category: 'cat' }]
        }]
      }
    }).data.nodes[0].children?.[0].name).toBe('child');

    expect(visualizationTimelineSchema.parse({
      ...baseVisualization,
      name: 'timeline',
      type: VisualizationTypesEnum.TIMELINE,
      data: {
        '2026': {
          summary: { title: 'Year' },
          events: [{
            summary: 'started',
            date: '2026-01-01',
            type: 'milestone',
            author: 'V',
            tags: [{ name: 'tag-1' }],
            description: 'desc'
          }]
        }
      }
    }).data['2026'].events[0].summary).toBe('started');
  });

  it('parses project, dashboard, filters, and extended types', () => {
    expect(projectCreateSchema.parse({ name: 'project', isActive: true }).isActive).toBe(true);
    expect(projectFilterSchema.parse({ userId: 'u1', isActive: false, sort: { element: 'name', sortOrder: -1 } }).sort?.sortOrder).toBe(-1);

    expect(dashboardCreateSchema.parse({
      name: 'dashboard',
      projectName: 'project',
      visualizations: { viz: 'pie' },
      layouts: [{ i: '1', x: 0, y: 0, w: 1, h: 1, minW: 1, minH: 1 }]
    }).layouts?.[0].i).toBe('1');
    expect(dashboardFilterSchema.parse({ projectName: 'project', visualizationType: 'pie' }).projectName).toBe('project');

    expect(visualizationFilterSchema.parse({ page: 1, per_page: 10, sort: { element: 'name', sortOrder: 'asc' } }).page).toBe(1);
    expect(visualizationExtendedTypeSchema.parse({
      projects: [{
        ...baseVisualization,
        type: VisualizationTypesEnum.WORD_CLOUD,
        data: { words: [{ name: 'alpha', value: 1 }] }
      }],
      pagination: { count: 1, pageCount: 1 }
    }).pagination?.count).toBe(1);
    expect(visualizationTypeSchema.parse({
      ...baseVisualization,
      type: VisualizationTypesEnum.WORD_CLOUD,
      data: { words: [{ name: 'alpha', value: 1 }] }
    }).name).toBe('viz-1');
  });

  it('parses file schemas, defaults, and file unions', () => {
    const file = new File(['{}'], 'data.json', { type: 'application/json' });

    expect(commonFileSchema.parse({ fileType: 'GENERIC', files: null })).toEqual({
      fullDetails: false,
      fileType: 'GENERIC',
      files: null
    });

    expect(jsonFileSchema.parse({
      fileType: FileType.JSON,
      files: [file],
      type: VisualizationTypesEnum.WORD_CLOUD,
      description: 'desc'
    }).fileType).toBe(FileType.JSON);

    expect(xmlFileSchema.parse({ fileType: FileType.XML, files: [file] }).fileType).toBe(FileType.XML);

    expect(excelFileSchema.parse({
      fileType: FileType.EXCEL,
      files: [file],
      mapping: { col: 'value' }
    })).toEqual(expect.objectContaining({
      includeHeaders: false,
      sheets: '1'
    }));

    expect(csvFileSchema.parse({
      fileType: FileType.CSV,
      files: [file],
      mapping: { col: 'value' }
    })).toEqual(expect.objectContaining({
      includeHeaders: false,
      separator: ','
    }));

    expect(visualizationFileSchema.parse({
      fileType: FileType.CSV,
      files: [file],
      mapping: { col: 'value' }
    }).fileType).toBe(FileType.CSV);
  });

  it('formats and throws readable validation errors', () => {
    const options = prettifyZodError();
    expect(options.delimiter?.error).toBe(' ');
    expect(options.transform?.({ errorMessage: 'problem', index: 1 } as any)).toBe('Error #2: problem');

    expect(() => validateWithSchema(z.object({ value: z.number() }), { value: 1 })).not.toThrow();
    expect(() => validateWithSchema(z.object({ value: z.number() }), { value: 'bad' } as any)).toThrow(/Error #1:/);
  });

  it('rejects invalid payloads for important branches', () => {
    expect(() => calendarDataSchema.parse({ calendar: [{ date: '2026-01-01', value: 'nope', category: 'work' }] })).toThrow();
    expect(() => commonFileSchema.parse({ fileType: 'GENERIC', files: 'no-file' })).toThrow('Must be an array of File');
    expect(() => commonFileSchema.parse({ fileType: 'GENERIC', files: ['no-file'] })).toThrow('Must be an array of File');
  });
});
