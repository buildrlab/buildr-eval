import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { runEval, runTest } from '../src/runner.js';
import type { LLMProvider } from '../src/types.js';

const fixturesDir = join(import.meta.dirname, 'fixtures');

function mockProvider(output: string): LLMProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      output,
      tokensUsed: 10,
      latencyMs: 50,
    }),
  };
}

describe('runTest', () => {
  it('returns passing result when all assertions pass', async () => {
    const provider = mockProvider('The fox jumped over.');
    const result = await runTest(provider, {
      name: 'test1',
      prompt: 'Summarize',
      assert: [
        { type: 'contains', value: 'fox' },
        { type: 'max_tokens', value: 20 },
      ],
    });

    expect(result.passed).toBe(true);
    expect(result.assertions).toHaveLength(2);
    expect(result.assertions.every((a) => a.passed)).toBe(true);
  });

  it('returns failing result when an assertion fails', async () => {
    const provider = mockProvider('The fox jumped over.');
    const result = await runTest(provider, {
      name: 'test2',
      prompt: 'Summarize',
      assert: [
        { type: 'contains', value: 'dog' },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.assertions[0].passed).toBe(false);
  });

  it('returns error result when provider throws', async () => {
    const provider: LLMProvider = {
      complete: vi.fn().mockRejectedValue(new Error('API down')),
    };
    const result = await runTest(provider, {
      name: 'test3',
      prompt: 'Hello',
      assert: [{ type: 'contains', value: 'hi' }],
    });

    expect(result.passed).toBe(false);
    expect(result.error).toBe('API down');
  });
});

describe('runEval', () => {
  it('runs all tests with mock provider and reports results', async () => {
    const provider = mockProvider('The fox is quick.');
    const result = await runEval(join(fixturesDir, 'basic.eval.yml'), {
      provider,
    });

    expect(result.config).toBe('Basic Test Suite');
    expect(result.totalTests).toBe(2);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.results).toHaveLength(2);
  });

  it('skips suite when flags gate is off', async () => {
    // Mock fetch for flags API
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await runEval(join(fixturesDir, 'flags-gated.eval.yml'));

    expect(result.skipped).toBe(1);
    expect(result.totalTests).toBe(1);
    expect(result.results).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it('runs suite when flags gate is on', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = mockProvider('hello');
    const result = await runEval(join(fixturesDir, 'flags-gated.eval.yml'), {
      provider,
    });

    expect(result.skipped).toBe(0);
    expect(result.totalTests).toBe(1);
    expect(result.results).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it('handles dry run mode', async () => {
    const result = await runEval(join(fixturesDir, 'basic.eval.yml'), {
      dryRun: true,
    });

    expect(result.totalTests).toBe(2);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].output).toBe('[dry run]');
  });
});
