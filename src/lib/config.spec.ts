import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { configFromEnv } from './config.js';

describe('configFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses defaults when no env vars set', () => {
    delete process.env.GRR_LEVEL;

    const config = configFromEnv();

    expect(config.level).toBe('info');
  });

  it('reads GRR_LEVEL', () => {
    process.env.GRR_LEVEL = 'debug';

    const config = configFromEnv();

    expect(config.level).toBe('debug');
  });

  it('reads GRR_LEVEL case-insensitively', () => {
    process.env.GRR_LEVEL = 'DEBUG';
    expect(configFromEnv().level).toBe('debug');

    process.env.GRR_LEVEL = 'Info';
    expect(configFromEnv().level).toBe('info');
  });

  it('throws on invalid GRR_LEVEL', () => {
    process.env.GRR_LEVEL = 'verbose';

    expect(() => configFromEnv()).toThrow(
      'Invalid GRR_LEVEL "verbose". Must be one of: trace, debug, info, warn, error, fatal',
    );
  });

  it('parses GRR_PRETTY=true', () => {
    process.env.GRR_PRETTY = 'true';
    expect(configFromEnv().pretty).toBe(true);
  });

  it('parses GRR_PRETTY=TRUE case-insensitively', () => {
    process.env.GRR_PRETTY = 'TRUE';
    expect(configFromEnv().pretty).toBe(true);

    process.env.GRR_PRETTY = 'False';
    expect(configFromEnv().pretty).toBe(false);
  });

  it('parses GRR_PRETTY=false', () => {
    process.env.GRR_PRETTY = 'false';
    expect(configFromEnv().pretty).toBe(false);
  });

  it('parses GRR_PRETTY=1', () => {
    process.env.GRR_PRETTY = '1';
    expect(configFromEnv().pretty).toBe(true);
  });

  it('parses GRR_PRETTY=0', () => {
    process.env.GRR_PRETTY = '0';
    expect(configFromEnv().pretty).toBe(false);
  });

  it('throws on invalid GRR_PRETTY', () => {
    process.env.GRR_PRETTY = 'yes';

    expect(() => configFromEnv()).toThrow(
      'Invalid GRR_PRETTY "yes". Must be one of: 1, 0, true, false',
    );
  });

  it('returns undefined for showMetadata when GRR_SHOW_METADATA not set', () => {
    delete process.env.GRR_SHOW_METADATA;
    expect(configFromEnv().showMetadata).toBeUndefined();
  });

  it('parses GRR_SHOW_METADATA=true', () => {
    process.env.GRR_SHOW_METADATA = 'true';
    expect(configFromEnv().showMetadata).toBe(true);
  });

  it('parses GRR_SHOW_METADATA=false', () => {
    process.env.GRR_SHOW_METADATA = 'false';
    expect(configFromEnv().showMetadata).toBe(false);
  });

  it('parses GRR_SHOW_METADATA=1', () => {
    process.env.GRR_SHOW_METADATA = '1';
    expect(configFromEnv().showMetadata).toBe(true);
  });

  it('parses GRR_SHOW_METADATA=0', () => {
    process.env.GRR_SHOW_METADATA = '0';
    expect(configFromEnv().showMetadata).toBe(false);
  });

  it('throws on invalid GRR_SHOW_METADATA', () => {
    process.env.GRR_SHOW_METADATA = 'yes';

    expect(() => configFromEnv()).toThrow(
      'Invalid GRR_SHOW_METADATA "yes". Must be one of: 1, 0, true, false',
    );
  });
});
