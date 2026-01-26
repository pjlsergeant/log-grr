import { describe, it, expect } from 'vitest';
import { topics } from './topics';

describe('topics', () => {
  it('expands a multi-level category', () => {
    expect(topics('foo.bar.baz')).toEqual(['foo.bar.baz', 'foo.bar', 'foo']);
  });

  it('returns single-element array for category without dots', () => {
    expect(topics('startup')).toEqual(['startup']);
  });

  it('returns empty array for empty string', () => {
    expect(topics('')).toEqual([]);
  });
});
