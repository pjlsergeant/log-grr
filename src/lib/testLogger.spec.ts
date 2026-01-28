import { describe, it, expect, beforeEach } from 'vitest';
import { createTestLogger } from './testLogger.js';

describe('TestLogger', () => {
  let grr: ReturnType<typeof createTestLogger>['grr'];
  let getLogs: ReturnType<typeof createTestLogger>['getLogs'];
  let clearLogs: ReturnType<typeof createTestLogger>['clearLogs'];

  beforeEach(() => {
    ({ grr, getLogs, clearLogs } = createTestLogger());
  });

  it('captures logs with all fields', () => {
    grr('startup').info('Server started', { port: 3000 });

    expect(getLogs()).toEqual([
      {
        level: 'info',
        category: 'startup',
        message: 'Server started',
        fields: { debug: { port: 3000 } },
      },
    ]);
  });

  it('captures logs without fields', () => {
    grr('startup').info('Hello');

    expect(getLogs()).toEqual([
      {
        level: 'info',
        category: 'startup',
        message: 'Hello',
        fields: {},
      },
    ]);
  });

  it('captures all log levels', () => {
    grr('test').trace('trace');
    grr('test').debug('debug');
    grr('test').info('info');
    grr('test').warn('warn');
    grr('test').error('error');
    grr('test').fatal('fatal');

    const levels = getLogs().map((l) => l.level);
    expect(levels).toEqual(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
  });

  it('clears logs', () => {
    grr('startup').info('Hello');
    expect(getLogs()).toHaveLength(1);

    clearLogs();
    expect(getLogs()).toHaveLength(0);
  });

  it('shares log storage across categories', () => {
    grr('api').info('Request');
    grr('db').info('Query');

    expect(getLogs()).toHaveLength(2);
    expect(getLogs()[0]!.category).toBe('api');
    expect(getLogs()[1]!.category).toBe('db');
  });
});
