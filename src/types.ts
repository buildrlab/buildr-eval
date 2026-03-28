import { z } from 'zod';

export type AssertionType =
  | 'exact'
  | 'contains'
  | 'not_contains'
  | 'regex'
  | 'starts_with'
  | 'ends_with'
  | 'max_tokens'
  | 'min_tokens'
  | 'json_valid'
  | 'json_contains'
  | 'llm_rubric';

export const AssertionTypeSchema = z.enum([
  'exact',
  'contains',
  'not_contains',
  'regex',
  'starts_with',
  'ends_with',
  'max_tokens',
  'min_tokens',
  'json_valid',
  'json_contains',
  'llm_rubric',
]);

export const AssertionSchema = z.object({
  type: AssertionTypeSchema,
  value: z.union([z.string(), z.number()]).optional(),
  key: z.string().optional(),
});

export interface Assertion {
  type: AssertionType;
  value?: string | number;
  key?: string;
}

export const TestCaseSchema = z.object({
  name: z.string(),
  prompt: z.string(),
  system: z.string().optional(),
  assert: z.array(AssertionSchema),
});

export interface TestCase {
  name: string;
  prompt: string;
  system?: string;
  assert: Assertion[];
}

export const ProviderConfigSchema = z.object({
  type: z.enum(['anthropic', 'openai']),
  model: z.string(),
  apiKeyEnv: z.string(),
});

export const FlagsConfigSchema = z.object({
  apiUrl: z.string().url(),
  sdkKey: z.string(),
  suite_gate: z.string(),
});

export const EvalConfigSchema = z.object({
  name: z.string(),
  provider: ProviderConfigSchema,
  flags: FlagsConfigSchema.optional(),
  tests: z.array(TestCaseSchema).min(1),
});

export interface EvalConfig {
  name: string;
  provider: {
    type: 'anthropic' | 'openai';
    model: string;
    apiKeyEnv: string;
  };
  flags?: {
    apiUrl: string;
    sdkKey: string;
    suite_gate: string;
  };
  tests: TestCase[];
}

export interface AssertionResult {
  type: string;
  passed: boolean;
  reason?: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  latencyMs: number;
  tokensUsed?: number;
  output: string;
  assertions: AssertionResult[];
  error?: string;
}

export interface EvalResult {
  config: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  results: TestResult[];
}

export interface LLMProvider {
  complete(prompt: string, system?: string): Promise<{
    output: string;
    tokensUsed?: number;
    latencyMs: number;
  }>;
}
