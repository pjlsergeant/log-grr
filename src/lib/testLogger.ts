import { BaseLogger } from './baseLogger.js';
import { Fields } from './fields.js';
import { Logger, Level } from './types.js';

export type LogEntry = {
  level: Level;
  category: string;
  message: string;
  fields: Fields;
};

/**
 * In-memory logger for testing. Captures logs in an array.
 * Uses the same field processing as PinoLogger for consistent test assertions.
 */
export class TestLogger extends BaseLogger {
  constructor(
    private category: string,
    private logs: LogEntry[],
  ) {
    super();
  }

  protected output(level: Level, message: string, payload: Fields): void {
    this.logs.push({ level, category: this.category, message, fields: payload });
  }
}

/**
 * Creates a test logger factory and log storage.
 */
export function createTestLogger(): {
  grr: (category: string) => Logger;
  getLogs: () => LogEntry[];
  clearLogs: () => void;
} {
  const logs: LogEntry[] = [];

  return {
    grr: (category: string) => new TestLogger(category, logs),
    getLogs: () => logs,
    clearLogs: () => {
      logs.length = 0;
    },
  };
}
