import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { EventEmitter } from 'events';
import { VisualizationTypes } from '@illustry/types';
import DuplicatedElementError from '../../src/errors/duplicatedElementError';
import FileError from '../../src/errors/fileError';
import NoDataFoundError from '../../src/errors/noDataFoundError';
import {
  returnResponse,
  toStringWithDefault,
  visualizationDetailsExtractor,
  visualizationPropertiesExtractor,
  copyDirectory,
  deleteDirectory,
  removeNullValues
} from '../../src/utils/helper';
import {
  csvFilesToVisualizations,
  excelFilesToVisualizations,
  jsonFilesToVisualizations,
  xmlFilesToVisualizations
} from '../../src/utils/reader';

describe('errors classes', () => {
  it('prints message for duplicated element error', () => {
    const err = new DuplicatedElementError('dup');
    expect(err.printError()).toBe('dup');
    expect(err).toBeInstanceOf(Error);
  });

  it('prints message for file and no data errors', () => {
    expect(new FileError('file').printError()).toBe('file');
    expect(new NoDataFoundError('none').printError()).toBe('none');
  });
});

describe('helper utils', () => {
  it('handles success and error branches in returnResponse', () => {
    const stop = jest.fn();
    const setHeader = jest.fn();
    const status = jest.fn();
    const send = jest.fn();
    const next = jest.fn();

    const res: any = {
      req: {
        originalUrl: '/api/test',
        probe: { stop }
      },
      setHeader,
      status,
      send
    };

    returnResponse(res, null, { ok: true }, next);
    expect(stop).toHaveBeenCalledWith('Send response/api/test');
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({ ok: true });

    res.req.originalUrl = '';
    returnResponse(res, null, { ok: 'empty-url' }, next);
    expect(stop).toHaveBeenCalledWith(expect.stringContaining('Send response'));

    const err = new Error('boom');
    returnResponse(res, err, null, next);
    expect(send).toHaveBeenCalledWith({ error: 'boom' });
    expect(next).toHaveBeenCalledWith('boom');
  });

  it('handles returnResponse when probe is not available', () => {
    const setHeader = jest.fn();
    const status = jest.fn();
    const send = jest.fn();
    const next = jest.fn();

    const res: any = {
      req: { originalUrl: '/api/no-probe' },
      setHeader,
      status,
      send
    };

    returnResponse(res, null, { ok: true }, next);
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('covers string/default and extraction helpers', () => {
    expect(toStringWithDefault(undefined)).toBe('');
    expect(toStringWithDefault(null)).toBe('');
    expect(toStringWithDefault(123)).toBe('123');

    const mapping = {
      visualizationName: '1',
      visualizationDescription: '2',
      visualizationTags: '3'
    };
    const details = visualizationDetailsExtractor(mapping, ['', 'Name', 'Desc', 'tag1']);
    expect(details).toEqual({
      visualizationName: 'Name',
      visualizationDescription: 'Desc',
      visualizationTags: 'tag1'
    });

    const properties = visualizationPropertiesExtractor([
      {
        visualizationName: 'V1',
        visualizationDescription: 'D1',
        visualizationTags: ['a', 'b'],
        foo: 1
      } as any,
      null as any,
      { foo: 2 } as any
    ]);

    expect(properties.name).toBe('V1');
    expect(properties.description).toBe('D1');
    expect(properties.tags).toEqual(['a', 'b']);
    expect(properties.data).toEqual([{ foo: 1 }, {}, { foo: 2 }]);

    const emptyProperties = visualizationPropertiesExtractor([{ foo: 1 } as any]);
    expect(emptyProperties.name).toBeUndefined();
    expect(emptyProperties.description).toBe('');
    expect(emptyProperties.tags).toEqual([]);
    expect(emptyProperties.data).toEqual([{ foo: 1 }]);
  });

  it('covers copy/delete directory and null pruning', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'illustry-helper-'));
    const src = path.join(base, 'src');
    const nested = path.join(src, 'nested');
    const dest = path.join(base, 'dest');

    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(src, 'a.txt'), 'A');
    fs.writeFileSync(path.join(nested, 'b.txt'), 'B');

    await copyDirectory(src, dest);
    expect(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8')).toBe('A');
    expect(fs.readFileSync(path.join(dest, 'nested', 'b.txt'), 'utf8')).toBe('B');

    await deleteDirectory(dest);
    expect(fs.existsSync(dest)).toBe(false);

    expect(removeNullValues(null)).toBeUndefined();
    expect(removeNullValues({ a: null, b: { c: null, d: 1 }, e: [null, { f: null, g: 2 }] })).toEqual({
      b: {},
      e: [{}]
    });
  });

  it('covers copy/delete catch branches when fs operations fail', async () => {
    const mkdirSpy = jest.spyOn(fs.promises, 'mkdir').mockRejectedValueOnce(new Error('mkdir-fail'));
    await expect(copyDirectory('/no-src', '/no-dest')).rejects.toThrow('mkdir-fail');
    mkdirSpy.mockRestore();

    const readdirSpy = jest.spyOn(fs.promises, 'readdir').mockRejectedValueOnce(new Error('readdir-fail'));
    await expect(deleteDirectory('/no-dir')).rejects.toThrow('readdir-fail');
    readdirSpy.mockRestore();
  });
});

describe('reader error paths', () => {
  it('rejects invalid file type branches for all readers', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'illustry-reader-invalid-type-'));
    const jsonPath = path.join(base, 'file.json');
    const xmlPath = path.join(base, 'file.xml');
    const csvPath = path.join(base, 'file.csv');
    const excelPath = path.join(base, 'file.xlsx');
    fs.writeFileSync(jsonPath, '{}');
    fs.writeFileSync(xmlPath, '<root></root>');
    fs.writeFileSync(csvPath, 'a,b,c');
    fs.writeFileSync(excelPath, 'not-an-excel');

    await expect(
      jsonFilesToVisualizations(
        [{ filePath: jsonPath, type: 'text/plain' } as any],
        VisualizationTypes.VisualizationTypesEnum.SANKEY,
        false
      )
    ).rejects.toBeInstanceOf(FileError);

    await expect(
      xmlFilesToVisualizations(
        [{ filePath: xmlPath, type: 'text/plain' } as any],
        VisualizationTypes.VisualizationTypesEnum.SANKEY,
        false
      )
    ).rejects.toBeInstanceOf(FileError);

    await expect(
      csvFilesToVisualizations(
        [{ filePath: csvPath, type: 'text/plain' } as any],
        {
          fileType: 'csv',
          includeHeaders: true,
          mapping: { names: '1', values: '2', properties: '3' },
          separator: ','
        } as any,
        VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
        false
      )
    ).rejects.toBeInstanceOf(FileError);

    await expect(
      excelFilesToVisualizations(
        [{ filePath: excelPath, type: 'text/plain' } as any],
        {
          fileType: 'excel',
          includeHeaders: true,
          mapping: { names: '1', values: '2', properties: '3' },
          sheets: '1'
        } as any,
        VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
        false
      )
    ).rejects.toBeInstanceOf(FileError);
  });

  it('covers stream/read errors for json/xml/csv/excel readers', async () => {
    const missing = path.join(os.tmpdir(), `illustry-missing-${Date.now()}.dat`);

    await expect(
      jsonFilesToVisualizations(
        [{ filePath: missing, type: 'application/json' } as any],
        VisualizationTypes.VisualizationTypesEnum.SANKEY,
        false
      )
    ).rejects.toBeInstanceOf(FileError);

    await expect(
      xmlFilesToVisualizations(
        [{ filePath: missing, type: 'text/xml' } as any],
        VisualizationTypes.VisualizationTypesEnum.SANKEY,
        false
      )
    ).rejects.toBeInstanceOf(FileError);

    const csvBase = fs.mkdtempSync(path.join(os.tmpdir(), 'illustry-reader-csv-'));
    const csvPath = path.join(csvBase, 'f.csv');
    fs.writeFileSync(csvPath, 'a,b,c');

    const readliner = new EventEmitter() as EventEmitter & {
      on: (event: string, cb: (...args: any[]) => void) => EventEmitter;
    };
    jest.spyOn(readline, 'createInterface').mockReturnValue(readliner as any);

    const csvPromise = csvFilesToVisualizations(
      [{ filePath: csvPath, type: 'text/csv' } as any],
      {
        fileType: 'csv',
        includeHeaders: true,
        mapping: {
          nodes: '1',
          categories: '2',
          properties: '3',
          sources: '4',
          targets: '5',
          values: '6'
        },
        separator: ','
      } as any,
      VisualizationTypes.VisualizationTypesEnum.SANKEY,
      false
    );
    readliner.emit('error', new Error('csv read error'));
    await expect(csvPromise).rejects.toBeInstanceOf(FileError);
    jest.restoreAllMocks();

    await expect(
      excelFilesToVisualizations(
        [{ filePath: missing, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as any],
        {
          fileType: 'excel',
          includeHeaders: true,
          mapping: { names: '1', values: '2', properties: '3' },
          sheets: '1'
        } as any,
        VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
        false
      )
    ).rejects.toBeInstanceOf(FileError);
  });

  it('covers excel reader branch with default sheet count when sheets are omitted', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'illustry-reader-excel-'));
    const excelPath = path.join(base, 'Wordcloud_PartialDetails.xlsx');
    fs.copyFileSync(
      path.resolve(__dirname, '../../__tests_resources__/excel/Wordcloud_PartialDetails.xlsx'),
      excelPath
    );

    const result = await excelFilesToVisualizations(
      [{ filePath: excelPath, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as any],
      {
        fileType: 'excel',
        includeHeaders: true,
        mapping: { names: '1', values: '2', properties: '3' }
      } as any,
      VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
      false
    );

    expect(result).toHaveLength(1);
  });

  it('rejects malformed xml parsing', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'illustry-reader-xml-'));
    const xmlPath = path.join(base, 'invalid.xml');
    fs.writeFileSync(xmlPath, '<root><bad></root>');

    await expect(
      xmlFilesToVisualizations(
        [{ filePath: xmlPath, type: 'text/xml' } as any],
        VisualizationTypes.VisualizationTypesEnum.SANKEY,
        false
      )
    ).rejects.toBeInstanceOf(FileError);
  });
});
