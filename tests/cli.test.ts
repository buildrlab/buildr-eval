import { describe, it, expect, vi } from 'vitest';
import { join } from 'node:path';
import type { LLMProvider } from '../src/types.js';

const fixturesDir = join(import.meta.dirname, 'fixtures');

function mockProvider(output: string): LLMProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      output,
      tokensUsed: 5,
      latencyMs: 25,
    }),
  };
}

describe('CLI integration', () => {
  it('imports the CLI and honors dry-run flag', async () => {
    const originalArgv = process.argv;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      process.argv = [
        'node',
        'buildr-eval',
        'run',
        join(fixturesDir, 'basic.eval.yml'),
        '--dry-run',
        '--reporter',
        'json',
      ];

      await import('../src/cli.js');
    } finally {
      process.argv = originalArgv;
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it('exposes runEval via the package entry', async () => {
    const { runEval } = await import('../src/index.js');
    const provider = mockProvider('The fox is quick.');
    const result = await runEval(join(fixturesDir, 'basic.eval.yml'), { provider });

    expect(result.totalTests).toBe(2);
    expect(result.results).toHaveLength(2);
  });
});
