import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from '../types.js';

export function createAnthropicProvider(
  model: string,
  apiKeyEnv: string,
): LLMProvider {
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `Missing API key: environment variable "${apiKeyEnv}" is not set`,
    );
  }

  const client = new Anthropic({ apiKey });

  return {
    async complete(prompt: string, system?: string) {
      const start = performance.now();

      const message = await client.messages.create({
        model,
        max_tokens: 1024,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      });

      const latencyMs = Math.round(performance.now() - start);

      const output = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        output,
        tokensUsed: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
        latencyMs,
      };
    },
  };
}
