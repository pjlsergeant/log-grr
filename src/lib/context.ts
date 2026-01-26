import { AsyncLocalStorage } from 'async_hooks';

export type Context = Record<string, unknown>;

const contextStorage = new AsyncLocalStorage<Context>();

/**
 * Run a function with additional context. Merges with any parent context.
 * Context fields appear as $-prefixed fields in log output.
 *
 * @example
 * addContext({ requestId: '123' }, () => {
 *   addContext({ userId: 42 }, () => {
 *     // context is { requestId: '123', userId: 42 }
 *   });
 * });
 */
export function addContext<T>(context: Context, fn: () => T): T {
  const parent = contextStorage.getStore();
  return contextStorage.run({ ...parent, ...context }, fn);
}

/**
 * Get the current context, or null if outside addContext.
 */
export function maybeContext(): Context | null {
  return contextStorage.getStore() ?? null;
}

/**
 * Get the current context. Throws if called outside addContext.
 */
export function getContext(): Context {
  const context = contextStorage.getStore();
  if (!context) {
    throw new Error('getContext called outside of addContext');
  }
  return context;
}
