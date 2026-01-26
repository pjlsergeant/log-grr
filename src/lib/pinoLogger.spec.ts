import { describe, it, expect, vi } from 'vitest';
import { createPinoLogger, PinoLogger, createPinoInstance } from './pinoLogger';

describe('PinoLogger', () => {
  it('creates a logger for a category', () => {
    const grr = createPinoLogger({ level: 'info', pretty: false });
    const logger = grr('api.users');

    expect(logger).toBeInstanceOf(PinoLogger);
  });

  it('separates fields into meta and debug', () => {
    const mockPino = {
      info: vi.fn(),
    };

    const logger = new PinoLogger(mockPino as any, 'api');
    logger.info('Hello', { $requestId: 'abc', userId: 42, action: 'login' });

    expect(mockPino.info).toHaveBeenCalledWith(
      {
        $requestId: 'abc',
        debug: { userId: 42, action: 'login' },
      },
      'Hello',
    );
  });

  it('omits debug key when no debug fields', () => {
    const mockPino = {
      info: vi.fn(),
    };

    const logger = new PinoLogger(mockPino as any, 'api');
    logger.info('Hello', { $requestId: 'abc' });

    expect(mockPino.info).toHaveBeenCalledWith({ $requestId: 'abc' }, 'Hello');
  });

  it('handles empty fields', () => {
    const mockPino = {
      info: vi.fn(),
    };

    const logger = new PinoLogger(mockPino as any, 'api');
    logger.info('Hello');

    expect(mockPino.info).toHaveBeenCalledWith({}, 'Hello');
  });

  it('calls correct pino method for each level', () => {
    const mockPino = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };

    const logger = new PinoLogger(mockPino as any, 'api');

    logger.trace('t');
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    logger.fatal('f');

    expect(mockPino.trace).toHaveBeenCalled();
    expect(mockPino.debug).toHaveBeenCalled();
    expect(mockPino.info).toHaveBeenCalled();
    expect(mockPino.warn).toHaveBeenCalled();
    expect(mockPino.error).toHaveBeenCalled();
    expect(mockPino.fatal).toHaveBeenCalled();
  });

  it('serializes Error instances in fields', () => {
    const mockPino = {
      error: vi.fn(),
    };

    const logger = new PinoLogger(mockPino as any, 'api');
    const err = new Error('Something failed');
    logger.error('Operation failed', { error: err });

    const payload = mockPino.error.mock.calls[0]![0];
    expect(payload.debug.error).toEqual({
      name: 'Error',
      message: 'Something failed',
      stack: err.stack,
    });
  });

  it('adds _class for Error subclasses', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const mockPino = {
      error: vi.fn(),
    };

    const logger = new PinoLogger(mockPino as any, 'api');
    const err = new CustomError('Custom failure');
    logger.error('Operation failed', { error: err });

    const payload = mockPino.error.mock.calls[0]![0];
    expect(payload.debug.error).toEqual({
      name: 'CustomError',
      message: 'Custom failure',
      stack: err.stack,
      _class: 'CustomError',
    });
  });

  it('serializes nested errors', () => {
    const mockPino = {
      error: vi.fn(),
    };

    const logger = new PinoLogger(mockPino as any, 'api');
    const err = new Error('Inner');
    logger.error('Failed', { context: { nested: { error: err } } });

    const payload = mockPino.error.mock.calls[0]![0];
    expect(payload.debug.context.nested.error.message).toBe('Inner');
  });
});

describe('createPinoInstance', () => {
  it('creates a pino instance with default level', () => {
    const instance = createPinoInstance({ pretty: false });
    expect(instance.level).toBe('info');
  });

  it('creates a pino instance with custom level', () => {
    const instance = createPinoInstance({ level: 'debug', pretty: false });
    expect(instance.level).toBe('debug');
  });
});
