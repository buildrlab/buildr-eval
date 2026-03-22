import { describe, it, expect } from 'vitest';
import { evaluateAssertion } from '../src/utils/scoring.js';

describe('evaluateAssertion', () => {
  describe('exact', () => {
    it('passes on exact match', () => {
      const result = evaluateAssertion('hello world', { type: 'exact', value: 'hello world' });
      expect(result.passed).toBe(true);
    });

    it('trims whitespace for comparison', () => {
      const result = evaluateAssertion('  hello  ', { type: 'exact', value: 'hello' });
      expect(result.passed).toBe(true);
    });

    it('fails on mismatch', () => {
      const result = evaluateAssertion('hello', { type: 'exact', value: 'world' });
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('Expected exact match');
    });
  });

  describe('contains', () => {
    it('passes when output contains value', () => {
      const result = evaluateAssertion('The quick brown fox', { type: 'contains', value: 'brown fox' });
      expect(result.passed).toBe(true);
    });

    it('fails when output does not contain value', () => {
      const result = evaluateAssertion('The quick brown fox', { type: 'contains', value: 'lazy dog' });
      expect(result.passed).toBe(false);
    });
  });

  describe('not_contains', () => {
    it('passes when output does not contain value', () => {
      const result = evaluateAssertion('hello world', { type: 'not_contains', value: 'goodbye' });
      expect(result.passed).toBe(true);
    });

    it('fails when output contains value', () => {
      const result = evaluateAssertion('hello world', { type: 'not_contains', value: 'hello' });
      expect(result.passed).toBe(false);
    });
  });

  describe('regex', () => {
    it('passes on regex match', () => {
      const result = evaluateAssertion('Order #12345', { type: 'regex', value: '#\\d+' });
      expect(result.passed).toBe(true);
    });

    it('fails on regex mismatch', () => {
      const result = evaluateAssertion('No numbers here', { type: 'regex', value: '\\d+' });
      expect(result.passed).toBe(false);
    });
  });

  describe('max_tokens', () => {
    it('passes when token count is within limit', () => {
      const result = evaluateAssertion('one two three', { type: 'max_tokens', value: 5 });
      expect(result.passed).toBe(true);
    });

    it('fails when token count exceeds limit', () => {
      const result = evaluateAssertion('one two three four five six', { type: 'max_tokens', value: 3 });
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('exceeds max');
    });
  });

  describe('json_valid', () => {
    it('passes for valid JSON', () => {
      const result = evaluateAssertion('{"name": "Alice"}', { type: 'json_valid' });
      expect(result.passed).toBe(true);
    });

    it('fails for invalid JSON', () => {
      const result = evaluateAssertion('not json', { type: 'json_valid' });
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('not valid JSON');
    });
  });

  describe('json_contains', () => {
    it('passes when JSON key has expected value', () => {
      const result = evaluateAssertion(
        '{"name": "Alice", "age": 30}',
        { type: 'json_contains', key: 'name', value: 'Alice' },
      );
      expect(result.passed).toBe(true);
    });

    it('fails when JSON key has wrong value', () => {
      const result = evaluateAssertion(
        '{"name": "Bob"}',
        { type: 'json_contains', key: 'name', value: 'Alice' },
      );
      expect(result.passed).toBe(false);
    });

    it('fails for invalid JSON', () => {
      const result = evaluateAssertion(
        'not json',
        { type: 'json_contains', key: 'name', value: 'Alice' },
      );
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('not valid JSON');
    });
  });
});
