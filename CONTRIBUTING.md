# Contributing to buildr-eval

Thanks for helping improve buildr-eval! This project is TypeScript **strict** and uses **ESM** modules.

## Local setup

- Node.js 20+
- pnpm 9+

```bash
pnpm install
pnpm dev
```

Tip: run the CLI against a local config while iterating.

```bash
pnpm dev -- run examples/basic.eval.yml
```

## Running tests

```bash
pnpm test
```

You can also run type checks separately:

```bash
pnpm typecheck
```

## Adding a new assertion type

1. **Define the type** in `src/types.ts`:
   - Add the new string to `AssertionType` and `AssertionTypeSchema`.
   - If you need new fields, extend `AssertionSchema`.
2. **Implement evaluation logic** in `src/utils/scoring.ts` inside `evaluateAssertion`.
3. **Add tests** in `tests/scoring.test.ts` for pass/fail cases.
4. **Update docs** in `README.md` (assertion table + example).

## Adding a new provider

1. **Create the provider** in `src/providers/<name>.ts` implementing `LLMProvider`.
2. **Register it** in `src/runner.ts` (`createProvider` switch).
3. **Extend config types** in `src/types.ts`:
   - Add the provider string to the `provider.type` union and schema.
4. **Add tests** (mock provider or fixtures) in `tests/`.
5. **Update docs** in `README.md`.

## PR process

- Branch from `dev` and **target `dev`** in your PR.
- Ensure `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
- Include tests and docs updates when behavior changes.

## Project standards

- TypeScript `strict: true` (no implicit any, no unsafe casts).
- ESM modules only (`"type": "module"`). Use `import`/`export` and `.js` extensions in TS import paths.
