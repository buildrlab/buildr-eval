# buildr-eval

Lightweight LLM evaluation runner with **BuildrFlags** feature flag gates.

An open, independent alternative for testing and evaluating LLM outputs — built by [BuildrLab](https://buildrlab.com).

## Install

```bash
pnpm add -D @buildrlab/buildr-eval
```

## Quick Start

Create an eval config file `my-evals.eval.yml`:

```yaml
name: "My LLM Test Suite"
provider:
  type: anthropic
  model: claude-3-haiku-20240307
  apiKeyEnv: ANTHROPIC_API_KEY

tests:
  - name: "Summarize text"
    prompt: "Summarize this in one sentence: The quick brown fox jumps over the lazy dog."
    assert:
      - type: contains
        value: "fox"
      - type: max_tokens
        value: 30
```

Run it:

```bash
buildr-eval run my-evals.eval.yml
```

## CLI Reference

```
buildr-eval run <config.yml>           # Run eval suite
buildr-eval run <config.yml> --dry-run # Validate config without calling LLM
buildr-eval run <config.yml> --reporter json  # Machine-readable JSON output
```

## Assertion Types

| Type | Description |
|------|-------------|
| `exact` | Output must exactly match `value` (trimmed) |
| `contains` | Output must contain `value` |
| `not_contains` | Output must NOT contain `value` |
| `regex` | Output must match regex `value` |
| `max_tokens` | Word count must be ≤ `value` |
| `json_valid` | Output must be valid JSON |
| `json_contains` | JSON output must have `key` equal to `value` |

## BuildrFlags Integration

Gate eval suites with [BuildrFlags](https://buildrlab.com) feature flags. Toggle which eval suites run per environment — run expensive GPT-4 evals only in production, fast Haiku evals in dev.

```yaml
name: "Production Eval Suite"
provider:
  type: anthropic
  model: claude-3-5-sonnet-20241022
  apiKeyEnv: ANTHROPIC_API_KEY

flags:
  apiUrl: https://api.flags.buildrlab.com/v1
  sdkKey: ${BUILDRFLAGS_SDK_KEY}
  suite_gate: eval-suite-production  # Only runs if this flag is ON

tests:
  - name: "Quality check"
    prompt: "..."
    assert:
      - type: contains
        value: "expected"
```

If the flag is **OFF**, the suite is gracefully skipped (not failed). If no `flags` config is provided, the suite always runs.

## Providers

- **Anthropic Claude** — fully supported (v0.1)
- **OpenAI** — coming soon (v0.2)

## Programmatic Usage

```typescript
import { runEval } from '@buildrlab/buildr-eval';

const result = await runEval('config.yml');
console.log(`Passed: ${result.passed}/${result.totalTests}`);
```

## License

MIT
