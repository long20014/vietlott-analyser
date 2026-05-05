export interface DrawResult {
  numbers: number[];
  date: string;
}

export interface ResultsResponse {
  results: DrawResult[];
}

export async function getResults(): Promise<ResultsResponse> {
  const resp = await fetch('/api/results');
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to fetch results');
  }
  return resp.json();
}
