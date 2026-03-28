import { describe, it, expect } from 'vitest';
import { generateHtmlReport } from '../src/reporters/html.js';
import type { EvalResult } from '../src/types.js';

const sampleResult: EvalResult = {
  config: 'Sample Suite',
  totalTests: 2,
  passed: 1,
  failed: 1,
  skipped: 0,
  durationMs: 123,
  results: [
    {
      name: 'greeting',
      passed: true,
      latencyMs: 45,
      tokensUsed: 5,
      output: 'hello',
      assertions: [{ type: 'contains', passed: true }],
    },
    {
      name: 'farewell',
      passed: false,
      latencyMs: 60,
      tokensUsed: 7,
      output: 'bye',
      assertions: [
        { type: 'exact', passed: false, reason: 'Expected greeting' },
      ],
    },
  ],
};

describe('generateHtmlReport', () => {
  it('returns a full HTML document', () => {
    const html = generateHtmlReport(sampleResult, 'config.yml');
    expect(html).toContain('<html');
  });

  it('includes test names in the report', () => {
    const html = generateHtmlReport(sampleResult, 'config.yml');
    expect(html).toContain('greeting');
    expect(html).toContain('farewell');
  });

  it('includes passed and failed counts', () => {
    const html = generateHtmlReport(sampleResult, 'config.yml');
    expect(html).toMatch(/Passed<\/div><div class="value">1/);
    expect(html).toMatch(/Failed<\/div><div class="value">1/);
  });

  it('includes failed assertion reasons', () => {
    const html = generateHtmlReport(sampleResult, 'config.yml');
    expect(html).toContain('Expected greeting');
  });
});
