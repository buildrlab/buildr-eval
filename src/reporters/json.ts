import type { EvalResult } from '../types.js';

export function reportJSON(result: EvalResult): void {
  console.log(JSON.stringify(result, null, 2));
}
