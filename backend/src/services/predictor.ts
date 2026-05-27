import * as fs from 'fs/promises';
import * as path from 'path';
import { type AnalyseResult } from './analyser';

export interface PredictionCandidate {
  numbers: number[];
  score: number;
  numberScore: number;
  rangeScore: number;
  pairScore: number;
  rangesCovered: string[];
  consecutivePairs: [number, number][];
  pseudoPairs: [number, number][];
}

export interface Top10PredictResult {
  predictions: PredictionCandidate[];
  generatedAt: string;
}

const DATA_FILE    = path.resolve(__dirname, '../../data/power-55-result.json');
const ANALYSE_FILE = path.resolve(__dirname, '../../data/power-55-analyse.json');
const TOP10_FILE   = path.resolve(__dirname, '../../temp/power-55-top10-predict.json');

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

function weightedSampleWithoutReplacement(weights: Map<number, number>, k: number, rand: () => number): number[] {
  const pool = new Map(weights);
  const selected: number[] = [];

  for (let pick = 0; pick < k; pick++) {
    let total = 0;
    for (const w of pool.values()) total += w;

    const threshold = rand() * total;
    let cumulative = 0;
    let chosen = -1;

    for (const [num, w] of pool) {
      cumulative += w;
      if (cumulative >= threshold) {
        chosen = num;
        break;
      }
    }

    if (chosen === -1) {
      // floating-point edge case: threshold slightly exceeds total
      let maxW = -1;
      for (const [num, w] of pool) {
        if (w > maxW) { maxW = w; chosen = num; }
      }
    }

    selected.push(chosen);
    pool.delete(chosen);
  }

  return selected;
}

function scoreCombination(
  numbers: number[],
  analysis: AnalyseResult,
  ratioByNumber: Map<number, number>,
  ratioByConsecPair: Map<string, number>,
  ratioByPseudoPair: Map<string, number>,
  recentNumbers: Set<number>,
): PredictionCandidate {
  const numberScore = numbers.reduce((sum, n) => sum + (recentNumbers.has(n) ? 0 : (ratioByNumber.get(n) ?? 0)), 0) / numbers.length;

  let rangeSum = 0;
  const rangesCovered: string[] = [];
  for (const { label, from, to, ratio } of analysis.rangeStats) {
    const covered = numbers.some((n) => n >= from && n <= to);
    rangeSum += covered ? ratio : 1 - ratio;
    if (covered) rangesCovered.push(label);
  }
  const rangeScore = rangeSum / analysis.rangeStats.length;

  const set = new Set(numbers);
  const consecutivePairs: [number, number][] = [];
  const pseudoPairs: [number, number][] = [];
  for (let n = 1; n <= 54; n++) {
    if (set.has(n) && set.has(n + 1)) consecutivePairs.push([n, n + 1]);
  }
  for (let n = 1; n <= 53; n++) {
    if (set.has(n) && set.has(n + 2)) pseudoPairs.push([n, n + 2]);
  }

  const consecBonus = consecutivePairs.length > 0
    ? analysis.consecutiveSummary.drawsWithPairRatio
    : 1 - analysis.consecutiveSummary.drawsWithPairRatio;
  const pseudoBonus = pseudoPairs.length > 0
    ? analysis.pseudoSummary.drawsWithPairRatio
    : 1 - analysis.pseudoSummary.drawsWithPairRatio;
  const pairStrength =
    consecutivePairs.reduce((s, [a, b]) => s + (ratioByConsecPair.get(`${a}-${b}`) ?? 0), 0) +
    pseudoPairs.reduce((s, [a, b]) => s + (ratioByPseudoPair.get(`${a}-${b}`) ?? 0), 0);
  const pairScore = consecBonus + pseudoBonus + pairStrength;

  const score = 0.5 * numberScore + 0.3 * rangeScore + 0.2 * pairScore;

  return {
    numbers: [...numbers].sort((a, b) => a - b),
    score,
    numberScore,
    rangeScore,
    pairScore,
    rangesCovered,
    consecutivePairs,
    pseudoPairs,
  };
}

export function generateTop10Predictions(analysis: AnalyseResult, recentNumbers: Set<number>): Top10PredictResult {
  const ratioByNumber = new Map<number, number>(
    analysis.numberStats.map(({ number, ratio }) => [number, ratio]),
  );
  const ratioByConsecPair = new Map<string, number>(
    analysis.consecutiveStats.map(({ pair, ratio }) => [`${pair[0]}-${pair[1]}`, ratio]),
  );
  const ratioByPseudoPair = new Map<string, number>(
    analysis.pseudoStats.map(({ pair, ratio }) => [`${pair[0]}-${pair[1]}`, ratio]),
  );
  const baseWeights = new Map<number, number>(
    analysis.numberStats.map(({ number, ratio }) => [
      number,
      recentNumbers.has(number) ? ratio * 0.1 : ratio,
    ]),
  );

  const rand = mulberry32(analysis.totalDraws);
  const seen = new Map<string, PredictionCandidate>();
  for (let i = 0; i < 100_000; i++) {
    const nums = weightedSampleWithoutReplacement(baseWeights, 7, rand);
    const key = [...nums].sort((a, b) => a - b).join(',');
    if (seen.has(key)) continue;
    seen.set(key, scoreCombination(nums, analysis, ratioByNumber, ratioByConsecPair, ratioByPseudoPair, recentNumbers));
  }

  const top10 = [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return { predictions: top10, generatedAt: new Date().toISOString() };
}

export async function exportTop10Predictions(): Promise<Top10PredictResult> {
  const [analyseRaw, resultsRaw] = await Promise.all([
    fs.readFile(ANALYSE_FILE, 'utf-8'),
    fs.readFile(DATA_FILE, 'utf-8'),
  ]);
  const analysis = JSON.parse(analyseRaw) as AnalyseResult;
  const { results } = JSON.parse(resultsRaw) as { results: { numbers: number[] }[] };
  const recentNumbers = new Set(results.slice(0, 5).flatMap((r) => r.numbers));
  const result = generateTop10Predictions(analysis, recentNumbers);
  await fs.mkdir(path.dirname(TOP10_FILE), { recursive: true });
  await fs.writeFile(TOP10_FILE, JSON.stringify(result, null, 2), 'utf-8');
  return result;
}

