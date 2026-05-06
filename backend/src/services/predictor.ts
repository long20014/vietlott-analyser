import * as fs from 'fs/promises';
import * as path from 'path';
import { type AnalyseResult } from './analyser';

interface DrawResult {
  numbers: number[];
  date: string;
}

interface PredictResult {
  predictedNumbers: number[];
  generatedAt: string;
}

const DATA_FILE = path.resolve(__dirname, '../../data/power-55-result.json');
const ANALYSE_FILE = path.resolve(__dirname, '../../data/power-55-analyse.json');
const PREDICT_FILE = path.resolve(__dirname, '../../temp/power-55-predict.json');

const RECENCY_DECAY = [0.15, 0.12, 0.09, 0.06, 0.03];

function buildWeights(results: DrawResult[], analysis: AnalyseResult): Map<number, number> {
  const weights = new Map<number, number>();
  for (const { number, ratio } of analysis.numberStats) {
    weights.set(number, ratio);
  }

  const recent = results.slice(0, 5);
  for (let i = 0; i < recent.length; i++) {
    const decay = RECENCY_DECAY[i];
    for (const n of recent[i].numbers) {
      const w = weights.get(n);
      if (w !== undefined) weights.set(n, w * (1 - decay));
    }
  }

  return weights;
}

function weightedSampleWithoutReplacement(weights: Map<number, number>, k: number): number[] {
  const pool = new Map(weights);
  const selected: number[] = [];

  for (let pick = 0; pick < k; pick++) {
    let total = 0;
    for (const w of pool.values()) total += w;

    const threshold = Math.random() * total;
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

export function predictNextDraw(results: DrawResult[], analysis: AnalyseResult): number[] {
  const weights = buildWeights(results, analysis);
  const picked = weightedSampleWithoutReplacement(weights, 7);
  return picked.sort((a, b) => a - b);
}

export async function exportPrediction(): Promise<PredictResult & { file: string }> {
  const [resultsRaw, analyseRaw] = await Promise.all([
    fs.readFile(DATA_FILE, 'utf-8'),
    fs.readFile(ANALYSE_FILE, 'utf-8'),
  ]);

  const { results } = JSON.parse(resultsRaw) as { results: DrawResult[] };
  const analysis = JSON.parse(analyseRaw) as AnalyseResult;

  const output: PredictResult = {
    predictedNumbers: predictNextDraw(results, analysis),
    generatedAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(PREDICT_FILE), { recursive: true });
  await fs.writeFile(PREDICT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  return { ...output, file: 'power-55-predict.json' };
}
