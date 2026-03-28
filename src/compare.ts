import type { EvalResult, TestResult } from './types.js';
import { runEval } from './runner.js';

export interface CompareInput {
  configA: string;
  configB: string;
}

export interface TestComparison {
  testName: string;
  resultA: TestResult;
  resultB: TestResult;
  winner: 'A' | 'B' | 'tie';
  latencyDeltaMs: number;
  tokensDelta: number;
}

export interface CompareResult {
  suiteA: string;
  suiteB: string;
  comparisons: TestComparison[];
  summary: {
    winsA: number;
    winsB: number;
    ties: number;
    avgLatencyA: number;
    avgLatencyB: number;
  };
}

function buildResultMap(results: TestResult[]): Map<string, TestResult> {
  return new Map(results.map((result) => [result.name, result]));
}

function determineWinner(resultA: TestResult, resultB: TestResult): 'A' | 'B' | 'tie' {
  if (resultA.passed && !resultB.passed) {
    return 'A';
  }
  if (resultB.passed && !resultA.passed) {
    return 'B';
  }
  return 'tie';
}

function averageLatency(results: TestResult[]): number {
  if (results.length === 0) {
    return 0;
  }
  const total = results.reduce((sum, result) => sum + result.latencyMs, 0);
  return Math.round(total / results.length);
}

export async function compareEvals(
  configPathA: string,
  configPathB: string,
): Promise<CompareResult> {
  const [resultA, resultB] = await Promise.all([
    runEval(configPathA),
    runEval(configPathB),
  ]);

  const resultsA = buildResultMap(resultA.results);
  const resultsB = buildResultMap(resultB.results);
  const comparisons: TestComparison[] = [];

  for (const [testName, testResultA] of resultsA.entries()) {
    const testResultB = resultsB.get(testName);
    if (!testResultB) {
      continue;
    }

    comparisons.push({
      testName,
      resultA: testResultA,
      resultB: testResultB,
      winner: determineWinner(testResultA, testResultB),
      latencyDeltaMs: testResultB.latencyMs - testResultA.latencyMs,
      tokensDelta: (testResultB.tokensUsed ?? 0) - (testResultA.tokensUsed ?? 0),
    });
  }

  const winsA = comparisons.filter((c) => c.winner === 'A').length;
  const winsB = comparisons.filter((c) => c.winner === 'B').length;
  const ties = comparisons.filter((c) => c.winner === 'tie').length;

  return {
    suiteA: resultA.config,
    suiteB: resultB.config,
    comparisons,
    summary: {
      winsA,
      winsB,
      ties,
      avgLatencyA: averageLatency(comparisons.map((c) => c.resultA)),
      avgLatencyB: averageLatency(comparisons.map((c) => c.resultB)),
    },
  };
}
