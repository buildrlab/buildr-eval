import type { EvalResult } from '../types.js';

export function reportConsole(result: EvalResult): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${result.config}`);
  console.log(`${'='.repeat(60)}\n`);

  if (result.skipped > 0) {
    console.log(
      `  SKIPPED — BuildrFlags gate is OFF (${result.skipped} tests skipped)\n`,
    );
    return;
  }

  const nameWidth = Math.max(
    ...result.results.map((r) => r.name.length),
    4,
  );

  const header = `  ${'Test'.padEnd(nameWidth)}  ${'Status'.padEnd(6)}  ${'Latency'.padEnd(8)}  Assertions`;
  console.log(header);
  console.log(`  ${'-'.repeat(header.length - 2)}`);

  for (const test of result.results) {
    const status = test.passed ? 'PASS' : 'FAIL';
    const statusColor = test.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    const latency = `${test.latencyMs}ms`;
    const assertSummary = test.assertions
      .map((a) => (a.passed ? `${statusColor}✓${reset}` : `${statusColor}✗${reset}`) + ` ${a.type}`)
      .join(', ');

    console.log(
      `  ${test.name.padEnd(nameWidth)}  ${statusColor}${status.padEnd(6)}${reset}  ${latency.padEnd(8)}  ${assertSummary}`,
    );

    if (test.error) {
      console.log(`    Error: ${test.error}`);
    }

    for (const assertion of test.assertions) {
      if (!assertion.passed && assertion.reason) {
        console.log(`    ${'\x1b[31m'}✗ ${assertion.type}: ${assertion.reason}${reset}`);
      }
    }
  }

  console.log(`\n  ${'─'.repeat(40)}`);
  console.log(
    `  Total: ${result.totalTests}  Passed: \x1b[32m${result.passed}\x1b[0m  Failed: \x1b[31m${result.failed}\x1b[0m  Duration: ${result.durationMs}ms`,
  );
  console.log();
}
