import { separateFields, serializeErrors, Fields } from './fields.js';
import { Logger, Level } from './types.js';

/**
 * Base logger that handles field separation and error serialization.
 * Subclasses implement output() to determine where logs go.
 */
export abstract class BaseLogger implements Logger {
  protected abstract output(level: Level, message: string, payload: Fields): void;

  private log(level: Level, message: string, fields: Fields = {}): void {
    const { meta, debug } = separateFields(fields);
    const serializedDebug = serializeErrors(debug) as Fields;
    const payload = {
      ...meta,
      ...(Object.keys(serializedDebug).length ? { debug: serializedDebug } : {}),
    };
    this.output(level, message, payload);
  }

  trace(message: string, fields?: Fields): void {
    this.log('trace', message, fields);
  }

  debug(message: string, fields?: Fields): void {
    this.log('debug', message, fields);
  }

  info(message: string, fields?: Fields): void {
    this.log('info', message, fields);
  }

  warn(message: string, fields?: Fields): void {
    this.log('warn', message, fields);
  }

  error(message: string, fields?: Fields): void {
    this.log('error', message, fields);
  }

  fatal(message: string, fields?: Fields): void {
    this.log('fatal', message, fields);
  }
}
