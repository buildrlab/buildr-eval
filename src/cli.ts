import { Command } from 'commander';
import { runEval } from './runner.js';
import { compareEvals } from './compare.js';
import { reportConsole } from './reporters/console.js';
import { reportJSON } from './reporters/json.js';
import { writeHtmlReport } from './reporters/html-file.js';

const program = new Command();

program
  .name('buildr-eval')
  .description('Lightweight LLM evaluation runner with BuildrFlags gates')
  .version('0.1.0');

program
  .command('run')
  .description('Run an eval suite from a YAML config')
  .argument('<config>', 'Path to eval config YAML file')
  .option('--reporter <type>', 'Output reporter: console, json, or html', 'console')
  .option('--dry-run', 'Parse config and validate without calling LLM', false)
  .action(async (configPath: string, opts: { reporter: string; dryRun: boolean }) => {
    try {
      const result = await runEval(configPath, { dryRun: opts.dryRun });

      if (opts.reporter === 'json') {
        reportJSON(result);
      } else {
        reportConsole(result);
      }

      if (opts.reporter === 'html') {
        const timestamp = Date.now();
        const outputPath = `eval-report-${timestamp}.html`;
        await writeHtmlReport(result, configPath, outputPath);
        console.log(`HTML report saved to ${outputPath}`);
      }

      if (result.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : error}`,
      );
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare two eval suites by test name')
  .argument('<configA>', 'Path to eval config A YAML file')
  .argument('<configB>', 'Path to eval config B YAML file')
  .action(async (configPathA: string, configPathB: string) => {
    try {
      const comparison = await compareEvals(configPathA, configPathB);
      const { comparisons, summary, suiteA, suiteB } = comparison;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`  Compare: ${suiteA} (A) vs ${suiteB} (B)`);
      console.log(`${'='.repeat(60)}\n`);

      if (comparisons.length === 0) {
        console.log('  No matching tests to compare.');
      } else {
        const nameWidth = Math.max(...comparisons.map((c) => c.testName.length), 4);
        const header = `  ${'Test'.padEnd(nameWidth)}  ${'Winner'.padEnd(6)}  ${'Latency A'.padEnd(10)}  ${'Latency B'.padEnd(10)}  ${'Delta'.padEnd(6)}`;
        console.log(header);
        console.log(`  ${'-'.repeat(header.length - 2)}`);

        for (const test of comparisons) {
          const latencyA = `${test.resultA.latencyMs}ms`;
          const latencyB = `${test.resultB.latencyMs}ms`;
          const delta = `${test.latencyDeltaMs}ms`;
          console.log(
            `  ${test.testName.padEnd(nameWidth)}  ${test.winner.padEnd(6)}  ${latencyA.padEnd(10)}  ${latencyB.padEnd(10)}  ${delta.padEnd(6)}`,
          );
        }
      }

      console.log(`\n  Wins A: ${summary.winsA}  Wins B: ${summary.winsB}  Ties: ${summary.ties}`);
      console.log(
        `  Avg Latency A: ${summary.avgLatencyA}ms  Avg Latency B: ${summary.avgLatencyB}ms`,
      );
      console.log();
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : error}`,
      );
      process.exit(1);
    }
  });

program.parse();
