# buildr-eval

[![npm version](https://img.shields.io/npm/v/@buildrlab/buildr-eval)](https://www.npmjs.com/package/@buildrlab/buildr-eval)
[![CI](https://github.com/buildrlab/buildr-eval/actions/workflows/ci.yml/badge.svg)](https://github.com/buildrlab/buildr-eval/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@buildrlab/buildr-eval)](https://www.npmjs.com/package/@buildrlab/buildr-eval)
[![node version](https://img.shields.io/node/v/@buildrlab/buildr-eval)](https://www.npmjs.com/package/@buildrlab/buildr-eval)

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

## Why buildr-eval?

Promptfoo and LangSmith are great when you need full evaluation suites, datasets, tracing, or hosted dashboards. buildr-eval is intentionally smaller:

- **CLI-first + YAML config** for fast local iteration and CI checks.
- **Minimal surface area** so you can audit and extend it easily.
- **BuildrFlags gating** to turn whole suites on/off per environment without wiring custom logic.
- **No vendor lock-in** — your evals live in repo, not a hosted UI.

If you want heavier dataset management, experiment tracking, or hosted reporting, promptfoo/LangSmith are better fits. If you want lightweight, scriptable checks that run anywhere, buildr-eval is a good default.

## CLI Reference

```
buildr-eval run <config.yml>           # Run eval suite
buildr-eval run <config.yml> --dry-run # Validate config without calling LLM
buildr-eval run <config.yml> --reporter json  # Machine-readable JSON output
```

## Assertion Types

| Type | Description | Example |
|------|-------------|---------|
| `exact` | Output must exactly match `value` (trimmed). | `type: exact<br>value: "hello"` |
| `contains` | Output must contain `value`. | `type: contains<br>value: "fox"` |
| `not_contains` | Output must NOT contain `value`. | `type: not_contains<br>value: "error"` |
| `regex` | Output must match regex `value`. | `type: regex<br>value: "^Order #\\d+"` |
| `max_tokens` | Whitespace token count must be ≤ `value`. | `type: max_tokens<br>value: 30` |
| `json_valid` | Output must be valid JSON. | `type: json_valid` |
| `json_contains` | Parsed JSON must have `key` equal to `value`. | `type: json_contains<br>key: "status"<br>value: "ok"` |

Notes:
- `max_tokens` counts whitespace-delimited tokens (not model tokenization).
- `json_contains` checks a top-level key (no deep path support yet).

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

### Anthropic Claude (supported)

```yaml
provider:
  type: anthropic
  model: claude-3-haiku-20240307
  apiKeyEnv: ANTHROPIC_API_KEY
```

### OpenAI (coming soon)

The OpenAI provider is scaffolded but not yet implemented. For now, it will throw an error when invoked.

```yaml
provider:
  type: openai
  model: gpt-4o-mini
  apiKeyEnv: OPENAI_API_KEY
```

## Programmatic Usage

```typescript
import { runEval } from '@buildrlab/buildr-eval';

const result = await runEval('config.yml');
console.log(`Passed: ${result.passed}/${result.totalTests}`);
```

## Roadmap

- OpenAI provider (v0.2)
- HTML reporter
- CI integration guide

## License

MIT
