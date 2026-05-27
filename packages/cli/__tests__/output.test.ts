import { IllustryError } from '@illustry/core';
import {
  color,
  formatError,
  formatInfo,
  formatModeBadge,
  formatSuccess,
  formatWarning,
  paint,
  printValue,
  resourceTable,
  table,
  write,
  writeError
} from '../src/ui/output';

describe('@illustry/cli output helpers', () => {
  const originalNoColor = process.env.NO_COLOR;

  afterEach(() => {
    process.env.NO_COLOR = originalNoColor;
  });

  it('formats colors, messages, errors, tables, and resources', () => {
    process.env.NO_COLOR = '1';
    expect(paint(color.green, 'ok')).toBe('ok');
    expect(formatSuccess('done')).toBe('[ok] done');
    expect(formatInfo('info')).toBe('> info');
    expect(formatWarning('warn')).toBe('! warn');
    expect(formatModeBadge('live')).toBe('[live]');
    expect(formatModeBadge('offline')).toBe('[offline]');
    expect(formatError(new IllustryError('Nope', { code: 'NOPE', status: 400 }))).toContain('NOPE');
    expect(formatError(new IllustryError('Nope', { code: 'NOPE', status: 400 }), true)).toContain('"ok": false');
    expect(table([], ['name'])).toBe('No rows found.');
    expect(table([{ name: 'A', count: 1, enabled: true, extra: { nested: true } }], ['name', 'count', 'enabled', 'extra']))
      .toContain('nested');
    expect(resourceTable({ data: { items: [{ _id: '1', kind: 'visualization', projectName: 'P', isActive: true }] } }))
      .toContain('visualization');
    expect(resourceTable([{ id: '2', createdAt: 'today' }])).toContain('today');
  });

  it('writes through callbacks and streams and respects quiet/json output', () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    write({ stdout: (message) => stdout.push(message) }, 'hello');
    writeError({ stderr: (message) => stderr.push(message) }, 'bad');
    printValue({ ok: true }, { json: true }, { stdout: (message) => stdout.push(message) });
    printValue('hidden', { quiet: true }, { stdout: (message) => stdout.push(message) });
    expect(stdout.join('\n')).toContain('hello');
    expect(stdout.join('\n')).toContain('"ok": true');
    expect(stdout.join('\n')).not.toContain('hidden');
    expect(stderr).toEqual(['bad']);

    let output = '';
    let errorOutput = '';
    write({ outputStream: { write: (message: string) => { output += message; return true; } } as any }, 'stream');
    writeError({ errorStream: { write: (message: string) => { errorOutput += message; return true; } } as any }, 'estream');
    expect(output).toContain('stream');
    expect(errorOutput).toContain('estream');
  });
});
