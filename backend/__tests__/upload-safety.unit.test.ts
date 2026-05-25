import { promises as fs } from 'fs';
import path from 'path';
import {
  UPLOAD_CONSTRAINTS,
  validateUploadedFileMetadata
} from '../src/utils/upload-constraints';

describe('upload safety constraints', () => {
  it('rejects gigabyte-scale visualization uploads from metadata before processing', () => {
    const result = validateUploadedFileMetadata({
      originalname: 'huge.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 5 * 1024 * 1024 * 1024
    }, 'visualization-source');

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain('too large');
    }
  });

  it('keeps GB-scale validation under 300ms without allocating file contents', () => {
    const names = ['huge.json', 'huge.xml', 'huge.csv', 'huge.xlsx'];
    const startedAt = performance.now();
    for (let index = 0; index < 10000; index += 1) {
      validateUploadedFileMetadata({
        originalname: names[index % names.length],
        mimetype: 'application/octet-stream',
        size: 5 * 1024 * 1024 * 1024
      }, 'visualization-source');
    }
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(300);
  });

  it('allows files exactly at the configured limit and rejects one byte above', () => {
    const maxBytes = UPLOAD_CONSTRAINTS['visualization-source'].maxBytes;
    expect(validateUploadedFileMetadata({
      originalname: 'source.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: maxBytes
    }, 'visualization-source')).toEqual({ valid: true });

    expect(validateUploadedFileMetadata({
      originalname: 'source.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: maxBytes + 1
    }, 'visualization-source').valid).toBe(false);
  });

  it('rejects unsupported extensions and misleading MIME types', () => {
    expect(validateUploadedFileMetadata({
      originalname: 'source.exe',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 100
    }, 'visualization-source').valid).toBe(false);

    expect(validateUploadedFileMetadata({
      originalname: 'source.xlsx',
      mimetype: 'application/x-msdownload',
      size: 100
    }, 'visualization-source').valid).toBe(false);
  });

  it('accepts XLSX files with browser-inconsistent octet-stream MIME after extension validation', () => {
    expect(validateUploadedFileMetadata({
      originalname: 'source.xlsx',
      mimetype: 'application/octet-stream',
      size: 100
    }, 'visualization-source')).toEqual({ valid: true });
  });

  it('keeps touched backend file-processing paths free of synchronous fs calls', async () => {
    const files = [
      path.resolve(__dirname, '../src/utils/upload-constraints.ts'),
      path.resolve(__dirname, '../src/utils/reader.ts'),
      path.resolve(__dirname, '../src/utils/document-export.ts')
    ];
    const forbidden = [
      'readFileSync',
      'writeFileSync',
      'statSync',
      'existsSync',
      'readdirSync',
      'mkdirSync'
    ];
    const sources = await Promise.all(files.map((file) => fs.readFile(file, 'utf8')));
    forbidden.forEach((token) => {
      sources.forEach((source) => {
        expect(source).not.toContain(token);
      });
    });
  });
});
