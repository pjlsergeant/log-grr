import { describe, it, expect, vi } from 'vitest';
import { createGrr } from './createGrr';

type Categories = 'startup' | 'api' | 'api.users' | 'db';

describe('createGrr', () => {
  describe('test mode', () => {
    it('captures logs in test mode', () => {
      const { grr, initGrr, getTestLogs } = createGrr<Categories>();
      initGrr({ type: 'test' });

      grr('startup').info('Hello', { port: 3000 });

      const logs = getTestLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.message).toBe('Hello');
      expect(logs[0]!.fields).toMatchObject({
        $category: 'startup',
        debug: { port: 3000 },
      });
    });

    it('clears test logs', () => {
      const { grr, initGrr, getTestLogs, clearTestLogs } = createGrr<Categories>();
      initGrr({ type: 'test' });

      grr('startup').info('Hello');
      expect(getTestLogs()).toHaveLength(1);

      clearTestLogs();
      expect(getTestLogs()).toHaveLength(0);
    });

    it('includes context in logs', () => {
      const { grr, initGrr, addContext, getTestLogs } = createGrr<Categories>();
      initGrr({ type: 'test' });

      addContext({ requestId: '123' }, () => {
        grr('api').info('Request');
      });

      const logs = getTestLogs();
      expect(logs[0]!.fields.$requestId).toBe('123');
    });

    it('includes topics in logs', () => {
      const { grr, initGrr, getTestLogs } = createGrr<Categories>();
      initGrr({ type: 'test' });

      grr('api.users').info('Created user');

      const logs = getTestLogs();
      expect(logs[0]!.fields.$topics).toEqual(['api.users', 'api']);
    });

    it('includes defaultFields in logs', () => {
      const { grr, initGrr, getTestLogs } = createGrr<Categories>();
      initGrr({
        type: 'test',
        defaultFields: { $service: 'my-api', $environment: 'prod', $version: '1.0.0' },
      });

      grr('startup').info('Hello');

      const logs = getTestLogs();
      expect(logs[0]!.fields.$service).toBe('my-api');
      expect(logs[0]!.fields.$environment).toBe('prod');
      expect(logs[0]!.fields.$version).toBe('1.0.0');
    });

    it('supports defaultFields as a function', () => {
      let callCount = 0;
      const { grr, initGrr, getTestLogs } = createGrr<Categories>();
      initGrr({
        type: 'test',
        defaultFields: () => {
          callCount++;
          return { $callCount: callCount };
        },
      });

      grr('startup').info('First');
      grr('startup').info('Second');

      const logs = getTestLogs();
      expect(logs[0]!.fields.$callCount).toBe(1);
      expect(logs[1]!.fields.$callCount).toBe(2);
    });
  });

  describe('custom pino instance', () => {
    it('uses provided pino instance', () => {
      const mockPino = {
        info: vi.fn(),
      };

      const { grr, initGrr } = createGrr<Categories>();
      initGrr({ pino: mockPino as any });

      grr('startup').info('Hello');

      expect(mockPino.info).toHaveBeenCalled();
    });
  });

  describe('transports', () => {
    it('creates pino with transport targets', () => {
      // This is more of an integration test - we just verify it doesn't throw
      // and creates a working logger
      const { grr, initGrr } = createGrr<Categories>();

      // Use pino/file to stdout as a simple transport target
      initGrr({
        transports: [{ target: 'pino/file', options: { destination: 1 }, level: 'info' }],
        level: 'debug',
        defaultFields: { $service: 'test-svc', $environment: 'test-env' },
      });

      // Should not throw
      expect(() => grr('startup').info('Hello with transports')).not.toThrow();
    });
  });

  describe('auto-initialization', () => {
    it('auto-initializes on first grr call', () => {
      const { grr } = createGrr<Categories>();

      // Should not throw
      expect(() => grr('startup')).not.toThrow();
    });
  });

  describe('context functions', () => {
    it('exports addContext', () => {
      const { addContext } = createGrr<Categories>();
      expect(typeof addContext).toBe('function');
    });

    it('exports maybeContext', () => {
      const { maybeContext } = createGrr<Categories>();
      expect(maybeContext()).toBeNull();
    });

    it('exports getContext', () => {
      const { getContext, addContext } = createGrr<Categories>();
      addContext({ test: true }, () => {
        expect(getContext()).toEqual({ test: true });
      });
    });
  });
});
