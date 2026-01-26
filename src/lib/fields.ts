export type Fields = Record<string, unknown>;

/**
 * Separates fields into meta ($-prefixed) and debug (everything else).
 *
 * @example
 * separateFields({ $requestId: 'abc', userId: 42 })
 * // { meta: { $requestId: 'abc' }, debug: { userId: 42 } }
 */
export function separateFields(fields: Fields): { meta: Fields; debug: Fields } {
  const meta: Fields = {};
  const debug: Fields = {};

  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith('$')) {
      meta[key] = value;
    } else {
      debug[key] = value;
    }
  }

  return { meta, debug };
}

/**
 * Recursively serializes Error instances to plain objects with message, name, and stack.
 * Adds _class for Error subclasses to help identify custom error types.
 */
export function serializeErrors(value: unknown): unknown {
  if (value instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    if (value.constructor !== Error) {
      serialized._class = value.constructor.name;
    }
    return serialized;
  }

  if (Array.isArray(value)) {
    return value.map(serializeErrors);
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeErrors(v);
    }
    return result;
  }

  return value;
}
