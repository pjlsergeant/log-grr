import { Logger as PinoInstance, TransportTargetOptions } from 'pino';
import { Fields } from './fields';
import { Level, levels } from './types';

/** Default fields to merge into every log entry. */
export type DefaultFields = Fields | (() => Fields);

/** Base config fields shared by all modes. */
type BaseConfig = {
  /** Static fields merged into every log entry (e.g., $service, $environment, $version). */
  defaultFields?: DefaultFields;
};

/** Test mode - logs captured in memory. */
type TestConfig = BaseConfig & {
  type: 'test';
};

/** Custom pino instance - full control. */
type CustomPinoConfig = BaseConfig & {
  type?: 'pino';
  pino: PinoInstance;
};

/** Multi-transport mode - easy setup for Axiom, DataDog, etc. */
type TransportsConfig = BaseConfig & {
  type?: 'pino';
  transports: TransportTargetOptions[];
  level?: Level;
};

/** Simple mode - just level and pretty. */
type SimpleConfig = BaseConfig & {
  type?: 'pino';
  level?: Level;
  pretty?: boolean;
};

export type Config = TestConfig | CustomPinoConfig | TransportsConfig | SimpleConfig;

function parseLevel(value: string | undefined): Level {
  if (!value) return 'info';

  const lower = value.toLowerCase();
  if (levels.includes(lower as Level)) {
    return lower as Level;
  }

  throw new Error(`Invalid GRR_LEVEL "${value}". Must be one of: ${levels.join(', ')}`);
}

function parsePretty(value: string | undefined): boolean {
  if (value === undefined) return process.stdout.isTTY;

  const lower = value.toLowerCase();
  if (lower === '1' || lower === 'true') return true;
  if (lower === '0' || lower === 'false') return false;

  throw new Error(`Invalid GRR_PRETTY "${value}". Must be one of: 1, 0, true, false`);
}

/**
 * Reads config from environment variables with sensible defaults.
 */
export function configFromEnv(): SimpleConfig {
  return {
    level: parseLevel(process.env.GRR_LEVEL),
    pretty: parsePretty(process.env.GRR_PRETTY),
  };
}
