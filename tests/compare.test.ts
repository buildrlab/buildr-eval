import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EvalResult } from '../src/types.js';
import { compareEvals } from '../src/compare.js';
import { runEval } from '../src/runner.js';

vi.mock('../src/runner.js', () => ({
  runEval: vi.fn(),
}));

const runEvalMock = vi.mocked(runEval);

const suiteA: EvalResult = {
  config: 'Suite A',
  totalTests: 3,
  passed: 2,
  failed: 1,
  skipped: 0,
  durationMs: 110,
  results: [
    {
      name: 'shared-pass',
      passed: true,
      latencyMs: 100,
      tokensUsed: 10,
      output: 'ok',
      assertions: [],
    },
    {
      name: 'shared-tie',
      passed: false,
      latencyMs: 200,
      tokensUsed: 5,
      output: 'no',
      assertions: [],
    },
    {
      name: 'only-a',
      passed: true,
      latencyMs: 50,
      output: 'extra',
      assertions: [],
    },
  ],
};

const suiteB: EvalResult = {
  config: 'Suite B',
  totalTests: 3,
  passed: 1,
  failed: 2,
  skipped: 0,
  durationMs: 120,
  results: [
    {
      name: 'shared-pass',
      passed: false,
      latencyMs: 130,
      tokensUsed: 14,
      output: 'bad',
      assertions: [],
    },
    {
      name: 'shared-tie',
      passed: false,
      latencyMs: 230,
      tokensUsed: 6,
      output: 'bad',
      assertions: [],
    },
    {
      name: 'only-b',
      passed: true,
      latencyMs: 70,
      output: 'extra',
      assertions: [],
    },
  ],
};

describe('compareEvals', () => {
  beforeEach(() => {
    runEvalMock.mockReset();
  });

  it('matches tests by name and computes winners and latency deltas', async () => {
    runEvalMock
      .mockResolvedValueOnce(suiteA)
      .mockResolvedValueOnce(suiteB);

    const comparison = await compareEvals('a.yml', 'b.yml');

    expect(comparison.comparisons.map((c) => c.testName).sort())
      .toEqual(['shared-pass', 'shared-tie']);

    expect(comparison.summary.winsA).toBe(1);
    expect(comparison.summary.winsB).toBe(0);
    expect(comparison.summary.ties).toBe(1);

    const sharedPass = comparison.comparisons.find((c) => c.testName === 'shared-pass');
    expect(sharedPass?.winner).toBe('A');
    expect(sharedPass?.latencyDeltaMs).toBe(30);

    expect(comparison.summary.avgLatencyA).toBe(150);
    expect(comparison.summary.avgLatencyB).toBe(180);
  });
});
