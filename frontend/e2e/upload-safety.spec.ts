import { expect, test } from '@playwright/test';
import {
  UPLOAD_CONSTRAINTS,
  validateBrowserFile
} from '../src/lib/upload-constraints';

test.describe('large upload safety', () => {
  test('rejects synthetic GB-scale files under 300ms without allocating file contents', async () => {
    const hugeFiles = ['huge.json', 'huge.xml', 'huge.csv', 'huge.xlsx'].map((name) => ({
      name,
      size: 5 * 1024 * 1024 * 1024
    } as File));

    const startedAt = performance.now();
    let lastMessage = '';
    for (let index = 0; index < 10000; index += 1) {
      lastMessage = validateBrowserFile(hugeFiles[index % hugeFiles.length]!, 'visualization-source');
    }
    const elapsedMs = performance.now() - startedAt;

    expect(lastMessage).toContain('too large');
    expect(elapsedMs).toBeLessThan(300);
  });

  test('handles exact upload boundaries and unsupported extensions before upload', async () => {
    const maxBytes = UPLOAD_CONSTRAINTS['visualization-source'].maxBytes;

    expect(validateBrowserFile({
      name: 'source.xlsx',
      size: maxBytes
    } as File, 'visualization-source')).toBe('');
    expect(validateBrowserFile({
      name: 'source.xlsx',
      size: maxBytes + 1
    } as File, 'visualization-source')).toContain('too large');
    expect(validateBrowserFile({
      name: 'source.exe',
      size: 100
    } as File, 'visualization-source')).toContain('Unsupported file type');
  });

  test('keeps export-template validation fast for synthetic GB-scale files', async () => {
    const hugeTemplate = {
      name: 'deck.pptx',
      size: 5 * 1024 * 1024 * 1024
    } as File;

    const startedAt = performance.now();
    const message = validateBrowserFile(hugeTemplate, 'export-template');
    const elapsedMs = performance.now() - startedAt;

    expect(message).toContain('too large');
    expect(elapsedMs).toBeLessThan(300);
  });
});
