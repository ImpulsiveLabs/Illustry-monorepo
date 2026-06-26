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
import { formatStatusHeader, promptModeLabel, sessionLabel } from '../src/ui/status-line';

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

  it('formats backend project browse responses with fixed project columns and truncation', () => {
    process.env.NO_COLOR = '1';
    const rendered = resourceTable({
      data: {
        projects: [
          {
            name: 'A very very very very long project name',
            description: 'This description is intentionally long so it should be truncated cleanly.',
            createdAt: '2026-06-07T07:05:24.176Z',
            updatedAt: '2026-06-07T07:26:07.667Z',
            isActive: false
          },
          {
            name: 'Project',
            description: 'da',
            createdAt: '2026-05-28T12:44:28.631Z',
            updatedAt: '2026-05-28T12:44:28.631Z',
            isActive: true
          }
        ]
      }
    });

    expect(rendered).toContain('name                      description');
    expect(rendered).toContain('created           updated           active');
    expect(rendered).toContain('A very very very very...');
    expect(rendered).toContain('This description is intention...');
    expect(rendered).toContain('2026-06-07 07:05  2026-06-07 07:26  false');
    expect(rendered).not.toContain('type');
    expect(rendered).not.toContain('project');
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

  it('uses color and console fallbacks when no IO callback is provided', () => {
    delete process.env.NO_COLOR;
    expect(paint(color.green, 'ok')).toContain('\u001b[32m');
    expect(formatModeBadge('anything-else')).toContain('[offline]');

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    write({}, 'console out');
    writeError({}, 'console err');
    printValue('plain', {}, {});
    expect(logSpy).toHaveBeenCalledWith('console out');
    expect(errorSpy).toHaveBeenCalledWith('console err');
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('formats persistent status lines for offline, live guest, and live sessions', () => {
    const offline = {
      profile: 'default',
      mode: 'offline' as const,
      workspace: '/workspace',
      server: undefined,
      authenticated: false,
      user: null,
      assets: 2
    };
    const guest = {
      ...offline,
      mode: 'live' as const,
      server: 'http://illustry.local'
    };
    const signedIn = {
      ...guest,
      authenticated: true,
      user: { email: 'dev@illustry.local' } as any
    };

    expect(sessionLabel(offline)).toBe('local workspace');
    expect(sessionLabel(guest)).toBe('not signed in');
    expect(sessionLabel(signedIn)).toBe('dev@illustry.local');
    expect(promptModeLabel(guest)).toContain('live:guest');
    expect(promptModeLabel(signedIn)).toContain('dev@illustry.local');
    expect(formatStatusHeader(signedIn)).toContain('Local assets: 2');
  });
});
