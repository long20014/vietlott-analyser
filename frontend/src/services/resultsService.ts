export interface DrawResult {
  numbers: number[];
  date: string;
}

export interface ResultsResponse {
  results: DrawResult[];
}

export interface NumberStat {
  number: number;
  count: number;
  ratio: number;
}

export interface ConsecutiveStat {
  pair: [number, number];
  count: number;
  ratio: number;
}

export interface RangeStat {
  label: string;
  from: number;
  to: number;
  count: number;
  ratio: number;
}

export interface ConsecutiveSummary {
  totalAppearances: number;
  drawsWithPair: number;
  drawsWithPairRatio: number;
  avgPairsPerDraw: number;
}

export interface CombinedPairStat {
  label: string;
  count: number;
  ratio: number;
}

export interface AnalyseResult {
  totalDraws: number;
  numberStats: NumberStat[];
  rangeStats: RangeStat[];
  consecutiveStats: ConsecutiveStat[];
  consecutiveSummary: ConsecutiveSummary;
  pseudoStats: ConsecutiveStat[];
  pseudoSummary: ConsecutiveSummary;
  combinedStats: CombinedPairStat[];
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Failed to fetch ${url}`);
  }
  return resp.json();
}

export interface PredictResult {
  predictedNumbers: number[];
  generatedAt: string;
}

export function getResults(): Promise<ResultsResponse> {
  return apiFetch<ResultsResponse>('/api/results');
}

export function getAnalysis(): Promise<AnalyseResult> {
  return apiFetch<AnalyseResult>('/api/analyse');
}

export function getPrediction(): Promise<PredictResult> {
  return apiFetch<PredictResult>('/api/predict/export', { method: 'POST' });
}
