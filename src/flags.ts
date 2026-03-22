export interface FlagsConfig {
  apiUrl: string;
  sdkKey: string;
  suite_gate: string;
}

export async function checkSuiteGate(config: FlagsConfig): Promise<boolean> {
  const url = `${config.apiUrl}/flags/${config.suite_gate}/evaluate`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.sdkKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `BuildrFlags API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as { enabled?: boolean };
  return data.enabled === true;
}
