import { DefaultFields } from './config.js';
import { maybeContext } from './context.js';
import { Fields } from './fields.js';
import { topics } from './topics.js';
import { Logger, levels } from './types.js';

export type DecoratorOptions = {
  defaultFields?: DefaultFields;
};

/**
 * Decorates fields with context, category, topics, and phase.
 */
export function decorateFields(
  category: string,
  fields: Fields = {},
  options?: DecoratorOptions,
): Fields {
  const context = maybeContext();
  const phase = context ? 'request' : 'static';

  // Context fields get $ prefix
  const contextFields: Fields = {};
  for (const [key, value] of Object.entries(context ?? {})) {
    contextFields[key.startsWith('$') ? key : `$${key}`] = value;
  }

  // Resolve defaultFields (can be object or function)
  const defaults = options?.defaultFields
    ? typeof options.defaultFields === 'function'
      ? options.defaultFields()
      : options.defaultFields
    : {};

  return {
    $phase: phase,
    ...defaults,
    ...contextFields,
    $category: category,
    $topics: topics(category),
    ...fields,
  };
}

/**
 * Wraps a logger to automatically decorate fields with context, category, and topics.
 */
export function decorateLogger(
  category: string,
  logger: Logger,
  options?: DecoratorOptions,
): Logger {
  const decorated: Logger = {} as Logger;

  for (const level of levels) {
    decorated[level] = (message: string, fields?: Fields) => {
      logger[level](message, decorateFields(category, fields, options));
    };
  }

  return decorated;
}

/**
 * Wraps a logger factory to automatically decorate all loggers.
 */
export function withDecoration(
  factory: (category: string) => Logger,
  options?: DecoratorOptions,
): (category: string) => Logger {
  return (category: string) => decorateLogger(category, factory(category), options);
}
