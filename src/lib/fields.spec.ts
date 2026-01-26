import { describe, it, expect } from 'vitest';
import { separateFields, serializeErrors } from './fields';

describe('separateFields', () => {
  it('separates $-prefixed fields into meta', () => {
    const result = separateFields({ $requestId: 'abc', userId: 42 });
    expect(result).toEqual({
      meta: { $requestId: 'abc' },
      debug: { userId: 42 },
    });
  });

  it('handles all meta fields', () => {
    const result = separateFields({ $a: 1, $b: 2 });
    expect(result).toEqual({
      meta: { $a: 1, $b: 2 },
      debug: {},
    });
  });

  it('handles all debug fields', () => {
    const result = separateFields({ a: 1, b: 2 });
    expect(result).toEqual({
      meta: {},
      debug: { a: 1, b: 2 },
    });
  });

  it('handles empty object', () => {
    const result = separateFields({});
    expect(result).toEqual({ meta: {}, debug: {} });
  });
});

describe('serializeErrors', () => {
  it('serializes Error to plain object', () => {
    const err = new Error('Something failed');
    const result = serializeErrors(err) as Record<string, unknown>;

    expect(result.name).toBe('Error');
    expect(result.message).toBe('Something failed');
    expect(result.stack).toBeDefined();
    expect(result._class).toBeUndefined();
  });

  it('adds _class for Error subclasses', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const err = new CustomError('Custom failure');
    const result = serializeErrors(err) as Record<string, unknown>;

    expect(result.name).toBe('CustomError');
    expect(result.message).toBe('Custom failure');
    expect(result._class).toBe('CustomError');
  });

  it('recursively serializes errors in objects', () => {
    const err = new Error('Nested');
    const obj = { context: { error: err } };
    const result = serializeErrors(obj) as Record<string, unknown>;

    const nested = (result.context as Record<string, unknown>).error as Record<string, unknown>;
    expect(nested.message).toBe('Nested');
  });

  it('recursively serializes errors in arrays', () => {
    const err = new Error('In array');
    const arr = [{ error: err }];
    const result = serializeErrors(arr) as Array<Record<string, unknown>>;

    expect((result[0]!.error as Record<string, unknown>).message).toBe('In array');
  });

  it('passes through non-error values unchanged', () => {
    expect(serializeErrors('string')).toBe('string');
    expect(serializeErrors(123)).toBe(123);
    expect(serializeErrors(null)).toBe(null);
    expect(serializeErrors(undefined)).toBe(undefined);
  });
});
