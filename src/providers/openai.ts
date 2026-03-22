import type { LLMProvider } from '../types.js';

export function createOpenAIProvider(
  _model: string,
  _apiKeyEnv: string,
): LLMProvider {
  return {
    async complete(_prompt: string, _system?: string) {
      throw new Error(
        'OpenAI provider is not yet implemented. Coming soon in buildr-eval v0.2.',
      );
    },
  };
}
