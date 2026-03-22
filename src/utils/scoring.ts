import type { Assertion, AssertionResult } from '../types.js';

export function evaluateAssertion(
  output: string,
  assertion: Assertion,
): AssertionResult {
  switch (assertion.type) {
    case 'exact':
      return {
        type: 'exact',
        passed: output.trim() === String(assertion.value).trim(),
        reason:
          output.trim() === String(assertion.value).trim()
            ? undefined
            : `Expected exact match: "${assertion.value}", got: "${output.trim()}"`,
      };

    case 'contains':
      return {
        type: 'contains',
        passed: output.includes(String(assertion.value)),
        reason: output.includes(String(assertion.value))
          ? undefined
          : `Expected output to contain: "${assertion.value}"`,
      };

    case 'not_contains':
      return {
        type: 'not_contains',
        passed: !output.includes(String(assertion.value)),
        reason: !output.includes(String(assertion.value))
          ? undefined
          : `Expected output NOT to contain: "${assertion.value}"`,
      };

    case 'regex': {
      const re = new RegExp(String(assertion.value));
      const matches = re.test(output);
      return {
        type: 'regex',
        passed: matches,
        reason: matches
          ? undefined
          : `Output did not match regex: ${assertion.value}`,
      };
    }

    case 'max_tokens': {
      const tokenCount = output.split(/\s+/).filter(Boolean).length;
      const max = Number(assertion.value);
      return {
        type: 'max_tokens',
        passed: tokenCount <= max,
        reason:
          tokenCount <= max
            ? undefined
            : `Token count ${tokenCount} exceeds max ${max}`,
      };
    }

    case 'json_valid': {
      try {
        JSON.parse(output);
        return { type: 'json_valid', passed: true };
      } catch {
        return {
          type: 'json_valid',
          passed: false,
          reason: 'Output is not valid JSON',
        };
      }
    }

    case 'json_contains': {
      try {
        const parsed = JSON.parse(output);
        const key = assertion.key ?? '';
        const actual = parsed[key];
        const expected = assertion.value;
        const passed = String(actual) === String(expected);
        return {
          type: 'json_contains',
          passed,
          reason: passed
            ? undefined
            : `Expected JSON key "${key}" to be "${expected}", got "${actual}"`,
        };
      } catch {
        return {
          type: 'json_contains',
          passed: false,
          reason: 'Output is not valid JSON',
        };
      }
    }

    default:
      return {
        type: assertion.type,
        passed: false,
        reason: `Unknown assertion type: ${assertion.type}`,
      };
  }
}
