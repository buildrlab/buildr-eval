import { writeFile } from 'node:fs/promises';
import type { EvalResult } from '../types.js';
import { generateHtmlReport } from './html.js';

export async function writeHtmlReport(
  result: EvalResult,
  configPath: string,
  outputPath: string,
): Promise<void> {
  const html = generateHtmlReport(result, configPath);
  await writeFile(outputPath, html, 'utf-8');
}
