import { Command } from 'commander';
import { runEval } from './runner.js';
import { reportConsole } from './reporters/console.js';
import { reportJSON } from './reporters/json.js';

const program = new Command();

program
  .name('buildr-eval')
  .description('Lightweight LLM evaluation runner with BuildrFlags gates')
  .version('0.1.0');

program
  .command('run')
  .description('Run an eval suite from a YAML config')
  .argument('<config>', 'Path to eval config YAML file')
  .option('--reporter <type>', 'Output reporter: console or json', 'console')
  .option('--dry-run', 'Parse config and validate without calling LLM', false)
  .action(async (configPath: string, opts: { reporter: string; dryRun: boolean }) => {
    try {
      const result = await runEval(configPath, { dryRun: opts.dryRun });

      if (opts.reporter === 'json') {
        reportJSON(result);
      } else {
        reportConsole(result);
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

program.parse();
