import { Fields } from './fields';

export type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const levels: Level[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/**
 * A logger bound to a specific category.
 */
export interface Logger {
  trace(message: string, fields?: Fields): void;
  debug(message: string, fields?: Fields): void;
  info(message: string, fields?: Fields): void;
  warn(message: string, fields?: Fields): void;
  error(message: string, fields?: Fields): void;
  fatal(message: string, fields?: Fields): void;
}
