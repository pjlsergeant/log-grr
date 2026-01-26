import { describe, it, expect } from 'vitest';
import { addContext, maybeContext, getContext } from './context';

describe('context', () => {
  describe('addContext', () => {
    it('makes context available inside callback', () => {
      addContext({ requestId: '123' }, () => {
        expect(maybeContext()).toEqual({ requestId: '123' });
      });
    });

    it('merges with parent context', () => {
      addContext({ requestId: '123' }, () => {
        addContext({ userId: 42 }, () => {
          expect(maybeContext()).toEqual({ requestId: '123', userId: 42 });
        });
      });
    });

    it('inner context overrides parent on conflict', () => {
      addContext({ requestId: '123' }, () => {
        addContext({ requestId: '456' }, () => {
          expect(maybeContext()).toEqual({ requestId: '456' });
        });
      });
    });

    it('returns the callback result', () => {
      const result = addContext({ requestId: '123' }, () => 'hello');
      expect(result).toBe('hello');
    });

    it('works with async callbacks', async () => {
      const result = await addContext({ requestId: '123' }, async () => {
        await Promise.resolve();
        return maybeContext();
      });
      expect(result).toEqual({ requestId: '123' });
    });
  });

  describe('maybeContext', () => {
    it('returns null outside addContext', () => {
      expect(maybeContext()).toBeNull();
    });
  });

  describe('getContext', () => {
    it('returns context inside addContext', () => {
      addContext({ requestId: '123' }, () => {
        expect(getContext()).toEqual({ requestId: '123' });
      });
    });

    it('throws outside addContext', () => {
      expect(() => getContext()).toThrow('getContext called outside of addContext');
    });
  });
});
