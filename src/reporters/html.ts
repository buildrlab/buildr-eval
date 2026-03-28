import type { AssertionResult, EvalResult, TestResult } from '../types.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAssertions(assertions: AssertionResult[], error?: string): string {
  const items = assertions.map((assertion) => {
    const statusClass = assertion.passed ? 'assert pass' : 'assert fail';
    const icon = assertion.passed ? 'OK' : 'X';
    const reason = !assertion.passed && assertion.reason
      ? `<div class="reason">${escapeHtml(assertion.reason)}</div>`
      : '';

    return `<div class="${statusClass}"><span class="icon">${icon}</span><span class="atype">${escapeHtml(assertion.type)}</span>${reason}</div>`;
  });

  if (error) {
    items.push(
      `<div class="assert fail"><span class="icon">X</span><span class="atype">error</span><div class="reason">${escapeHtml(error)}</div></div>`,
    );
  }

  if (items.length === 0) {
    return '<span class="muted">No assertions</span>';
  }

  return items.join('');
}

function renderRow(test: TestResult): string {
  const status = test.passed ? 'PASS' : 'FAIL';
  const badgeClass = test.passed ? 'badge pass' : 'badge fail';
  const latency = `${test.latencyMs}ms`;
  const tokens = test.tokensUsed ?? '-';
  const assertions = renderAssertions(test.assertions, test.error);

  return `
    <tr>
      <td class="name" data-label="Test">${escapeHtml(test.name)}</td>
      <td data-label="Status"><span class="${badgeClass}">${status}</span></td>
      <td class="mono" data-label="Latency">${latency}</td>
      <td class="mono" data-label="Tokens">${tokens}</td>
      <td data-label="Assertions">${assertions}</td>
    </tr>`;
}

function renderRows(results: TestResult[]): string {
  if (results.length === 0) {
    return `
      <tr>
        <td colspan="5" class="muted">No test results to display.</td>
      </tr>`;
  }

  return results.map((test) => renderRow(test)).join('');
}

export function generateHtmlReport(result: EvalResult, configPath: string): string {
  const title = escapeHtml(result.config);
  const rows = renderRows(result.results);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      --bg: #0b1117;
      --panel: #121a24;
      --panel-2: #0f161f;
      --text: #e6edf3;
      --muted: #93a1b1;
      --border: #223042;
      --accent: #5cc8ff;
      --success: #40c463;
      --danger: #ff6b6b;
      --warning: #f4d35e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(1200px 700px at 10% 10%, #101a26, var(--bg));
      color: var(--text);
      font-family: 'Segoe UI', 'Trebuchet MS', ui-sans-serif, system-ui, sans-serif;
      line-height: 1.5;
    }
    .container { max-width: 1100px; margin: 32px auto 60px; padding: 0 24px; }
    header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 28px; letter-spacing: 0.2px; }
    .subtle { color: var(--muted); font-size: 14px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .card { background: var(--panel-2); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border); }
    .card .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    .card .value { font-size: 22px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: var(--panel); border-radius: 12px; overflow: hidden; }
    th, td { padding: 12px 14px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); }
    th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
    tr:last-child td { border-bottom: none; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      border: 1px solid transparent;
    }
    .badge.pass { color: #072b13; background: var(--success); border-color: #2ea043; }
    .badge.fail { color: #2b0b0b; background: var(--danger); border-color: #e55353; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; }
    .assert { display: grid; grid-template-columns: auto 1fr; gap: 6px; margin-bottom: 6px; }
    .assert .icon { font-weight: 700; }
    .assert.pass .icon { color: var(--success); }
    .assert.fail .icon { color: var(--danger); }
    .assert .atype { font-weight: 600; }
    .reason { grid-column: 2 / span 1; color: var(--danger); font-size: 13px; }
    .muted { color: var(--muted); }
    @media (max-width: 720px) {
      table, thead, tbody, th, td, tr { display: block; }
      th { display: none; }
      tr { margin-bottom: 16px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
      td { border-bottom: 1px solid var(--border); }
      td:last-child { border-bottom: none; }
      td::before {
        content: attr(data-label);
        display: block;
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${title}</h1>
      <div class="subtle">Config: ${escapeHtml(configPath)}</div>
    </header>

    <section class="summary">
      <div class="card"><div class="label">Total Tests</div><div class="value">${result.totalTests}</div></div>
      <div class="card"><div class="label">Passed</div><div class="value">${result.passed}</div></div>
      <div class="card"><div class="label">Failed</div><div class="value">${result.failed}</div></div>
      <div class="card"><div class="label">Skipped</div><div class="value">${result.skipped}</div></div>
      <div class="card"><div class="label">Duration</div><div class="value">${result.durationMs}ms</div></div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Test</th>
          <th>Status</th>
          <th>Latency</th>
          <th>Tokens</th>
          <th>Assertions</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}
