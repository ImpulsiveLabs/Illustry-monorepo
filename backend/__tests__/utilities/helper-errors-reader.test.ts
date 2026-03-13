import fs from 'fs';
import os from 'os';
import path from 'path';
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

    const err = new Error('boom');
    returnResponse(res, err, null, next);
    expect(send).toHaveBeenCalledWith({ error: 'boom' });
    expect(next).toHaveBeenCalledWith('boom');
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
});

describe('reader error paths', () => {
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
