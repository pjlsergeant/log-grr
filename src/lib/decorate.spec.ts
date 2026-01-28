import { describe, it, expect } from 'vitest';
import { decorateFields, withDecoration } from './decorate.js';
import { addContext } from './context.js';
import { createTestLogger } from './testLogger.js';

describe('decorateFields', () => {
  it('adds category, topics, and phase', () => {
    const result = decorateFields('api.users', { userId: 42 });

    expect(result).toEqual({
      $phase: 'static',
      $category: 'api.users',
      $topics: ['api.users', 'api'],
      userId: 42,
    });
  });

  it('adds context fields with $ prefix', () => {
    addContext({ requestId: '123', username: 'alice' }, () => {
      const result = decorateFields('api', {});

      expect(result).toMatchObject({
        $phase: 'request',
        $requestId: '123',
        $username: 'alice',
      });
    });
  });

  it('preserves existing $ prefix on context fields', () => {
    addContext({ $custom: 'value' }, () => {
      const result = decorateFields('api', {});

      expect(result.$custom).toBe('value');
      expect(result).not.toHaveProperty('$$custom');
    });
  });

  it('explicit fields override context', () => {
    addContext({ requestId: 'from-context' }, () => {
      const result = decorateFields('api', { $requestId: 'override' });

      expect(result.$requestId).toBe('override');
    });
  });

  it('works without context', () => {
    const result = decorateFields('startup', { port: 3000 });

    expect(result).toEqual({
      $phase: 'static',
      $category: 'startup',
      $topics: ['startup'],
      port: 3000,
    });
  });
});

describe('withDecoration', () => {
  it('decorates logs from wrapped factory', () => {
    const { grr: rawGrr, getLogs } = createTestLogger();
    const grr = withDecoration(rawGrr);

    grr('api.users').info('Created user', { userId: 42 });

    const log = getLogs()[0]!;
    expect(log.fields).toEqual({
      $phase: 'static',
      $category: 'api.users',
      $topics: ['api.users', 'api'],
      debug: { userId: 42 },
    });
  });

  it('includes context in decorated logs', () => {
    const { grr: rawGrr, getLogs } = createTestLogger();
    const grr = withDecoration(rawGrr);

    addContext({ requestId: '123' }, () => {
      grr('api').info('Request');
    });

    const log = getLogs()[0]!;
    expect(log.fields.$requestId).toBe('123');
  });
});
