import { readFile } from 'node:fs/promises';
import { parse as parseYAML } from 'yaml';
import { EvalConfigSchema } from './types.js';
import type { EvalConfig, EvalResult, LLMProvider, TestResult } from './types.js';
import { evaluateAssertion } from './utils/scoring.js';
import { checkSuiteGate } from './flags.js';
import { createAnthropicProvider } from './providers/anthropic.js';
import { createOpenAIProvider } from './providers/openai.js';

export async function loadConfig(configPath: string): Promise<EvalConfig> {
  const raw = await readFile(configPath, 'utf-8');
  const parsed = parseYAML(raw);
  return EvalConfigSchema.parse(parsed);
}

export function createProvider(config: EvalConfig): LLMProvider {
  switch (config.provider.type) {
    case 'anthropic':
      return createAnthropicProvider(config.provider.model, config.provider.apiKeyEnv);
    case 'openai':
      return createOpenAIProvider(config.provider.model, config.provider.apiKeyEnv);
    default:
      throw new Error(`Unknown provider type: ${config.provider.type}`);
  }
}

export async function runTest(
  provider: LLMProvider,
  test: { name: string; prompt: string; system?: string; assert: EvalConfig['tests'][0]['assert'] },
): Promise<TestResult> {
  try {
    const { output, tokensUsed, latencyMs } = await provider.complete(
      test.prompt,
      test.system,
    );

    const assertions = test.assert.map((assertion) =>
      evaluateAssertion(output, assertion),
    );

    const passed = assertions.every((a) => a.passed);

    return {
      name: test.name,
      passed,
      latencyMs,
      tokensUsed,
      output,
      assertions,
    };
  } catch (error) {
    return {
      name: test.name,
      passed: false,
      latencyMs: 0,
      output: '',
      assertions: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface RunOptions {
  dryRun?: boolean;
  provider?: LLMProvider;
}

export async function runEval(
  configPath: string,
  options: RunOptions = {},
): Promise<EvalResult> {
  const config = await loadConfig(configPath);
  const start = performance.now();

  // Check BuildrFlags gate
  if (config.flags) {
    try {
      const enabled = await checkSuiteGate(config.flags);
      if (!enabled) {
        return {
          config: config.name,
          totalTests: config.tests.length,
          passed: 0,
          failed: 0,
          skipped: config.tests.length,
          durationMs: Math.round(performance.now() - start),
          results: [],
        };
      }
    } catch (error) {
      console.warn(
        `Warning: BuildrFlags check failed, running suite anyway: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // Dry run — return empty results
  if (options.dryRun) {
    return {
      config: config.name,
      totalTests: config.tests.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0,
      results: config.tests.map((test) => ({
        name: test.name,
        passed: true,
        latencyMs: 0,
        output: '[dry run]',
        assertions: test.assert.map((a) => ({
          type: a.type,
          passed: true,
          reason: 'dry run — skipped',
        })),
      })),
    };
  }

  const provider = options.provider ?? createProvider(config);
  const results: TestResult[] = [];

  for (const test of config.tests) {
    const result = await runTest(provider, test);
    results.push(result);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    config: config.name,
    totalTests: config.tests.length,
    passed,
    failed,
    skipped: 0,
    durationMs: Math.round(performance.now() - start),
    results,
  };
}
