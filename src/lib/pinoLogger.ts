import pino, { Logger as PinoInstance, TransportTargetOptions } from 'pino';
import { BaseLogger } from './baseLogger.js';
import { Fields } from './fields.js';
import { Logger, Level } from './types.js';

export type PinoConfig = {
  level?: Level;
  pretty?: boolean;
};

/**
 * Creates a pino instance with the given config.
 */
export function createPinoInstance(config: PinoConfig = {}): PinoInstance {
  const level = config.level ?? 'info';
  const pretty = config.pretty ?? process.stdout.isTTY;

  if (pretty) {
    return pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    });
  }

  return pino({ level });
}

/**
 * A logger that outputs to pino with field separation.
 */
export class PinoLogger extends BaseLogger {
  constructor(
    private pino: PinoInstance,
    _category: string,
  ) {
    super();
  }

  protected output(level: Level, message: string, payload: Fields): void {
    this.pino[level](payload, message);
  }
}

/**
 * Creates a pino logger factory.
 */
export function createPinoLogger(config: PinoConfig = {}): (category: string) => Logger {
  const pinoInstance = createPinoInstance(config);
  return (category: string) => new PinoLogger(pinoInstance, category);
}

/**
 * Creates a logger factory from an existing pino instance.
 * Use this when you need custom transports (Axiom, DataDog, etc).
 */
export function createPinoLoggerFromInstance(
  pinoInstance: PinoInstance,
): (category: string) => Logger {
  return (category: string) => new PinoLogger(pinoInstance, category);
}

/**
 * Creates a pino logger factory with multiple transports.
 * Use this for multi-target setups (Axiom, DataDog, Slack, etc).
 */
export function createPinoLoggerWithTransports(
  transports: TransportTargetOptions[],
  level: Level = 'trace',
): (category: string) => Logger {
  const pinoInstance = pino({ level }, pino.transport({ targets: transports }));
  return (category: string) => new PinoLogger(pinoInstance, category);
}
