import { addContext, maybeContext, getContext } from './context.js';
import { Config, configFromEnv } from './config.js';
import { withDecoration } from './decorate.js';
import {
  createPinoLogger,
  createPinoLoggerFromInstance,
  createPinoLoggerWithTransports,
} from './pinoLogger.js';
import { createTestLogger, LogEntry } from './testLogger.js';
import { Logger } from './types.js';

export type GrrInstance<C extends string> = {
  grr: (category: C) => Logger;
  addContext: typeof addContext;
  maybeContext: typeof maybeContext;
  getContext: typeof getContext;
  initGrr: (config: Partial<Config>) => void;
  getTestLogs: () => LogEntry[];
  clearTestLogs: () => void;
};

/**
 * Creates a typed grr instance with compile-time category checking.
 */
export function createGrr<C extends string>(): GrrInstance<C> {
  let initialized = false;
  let grr: (category: string) => Logger;
  let testLogs: LogEntry[] = [];
  let getTestLogs = () => testLogs;
  let clearTestLogs = () => {
    testLogs.length = 0;
  };

  function ensureInitialized() {
    if (!initialized) {
      initGrr({});
    }
  }

  function initGrr(config: Partial<Config>) {
    const defaults = configFromEnv();
    const options = { defaultFields: config.defaultFields };

    if (config.type === 'test') {
      // Test mode - logs captured in memory
      const testLogger = createTestLogger();
      testLogs = testLogger.getLogs() as LogEntry[];
      getTestLogs = () => testLogs;
      clearTestLogs = testLogger.clearLogs;
      grr = withDecoration(testLogger.grr, options);
    } else if ('pino' in config && config.pino) {
      // Custom pino instance - full control
      if (process.env.GRR_LEVEL || process.env.GRR_PRETTY) {
        console.warn('grr: GRR_LEVEL/GRR_PRETTY are ignored when using a custom pino instance');
      }
      grr = withDecoration(createPinoLoggerFromInstance(config.pino), options);
    } else if ('transports' in config && config.transports) {
      // Multi-transport mode
      const level = config.level ?? defaults.level;
      grr = withDecoration(createPinoLoggerWithTransports(config.transports, level), options);
    } else {
      // Simple mode - level and pretty
      const level = 'level' in config && config.level !== undefined ? config.level : defaults.level;
      const pretty =
        'pretty' in config && config.pretty !== undefined ? config.pretty : defaults.pretty;
      grr = withDecoration(createPinoLogger({ level, pretty }), options);
    }

    initialized = true;
  }

  return {
    grr: (category: C) => {
      ensureInitialized();
      return grr(category);
    },
    addContext,
    maybeContext,
    getContext,
    initGrr,
    getTestLogs: () => {
      ensureInitialized();
      return getTestLogs();
    },
    clearTestLogs: () => {
      ensureInitialized();
      clearTestLogs();
    },
  };
}
