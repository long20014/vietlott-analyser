interface DrawResult {
  numbers: number[];
  date: string;
}

interface NumberStat {
  number: number;
  count: number;
  ratio: number;
}

interface ConsecutiveStat {
  pair: [number, number];
  count: number;
  ratio: number;
}

interface RangeStat {
  label: string;
  from: number;
  to: number;
  count: number;
  ratio: number;
}

interface ConsecutiveSummary {
  totalAppearances: number;
  drawsWithPair: number;
  drawsWithPairRatio: number;
  avgPairsPerDraw: number;
}

interface CombinedPairStat {
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

const RANGES = [
  { label: '1 – 9',   from: 1,  to: 9  },
  { label: '10 – 19', from: 10, to: 19 },
  { label: '20 – 29', from: 20, to: 29 },
  { label: '30 – 39', from: 30, to: 39 },
  { label: '40 – 49', from: 40, to: 49 },
  { label: '50 – 55', from: 50, to: 55 },
];

function buildRangeStats(results: DrawResult[]): RangeStat[] {
  const total = results.length;
  return RANGES.map(({ label, from, to }) => {
    let count = 0;
    for (const { numbers } of results) {
      if (numbers.some((n) => n >= from && n <= to)) count++;
    }
    return { label, from, to, count, ratio: total > 0 ? count / total : 0 };
  });
}

function buildNumberStats(results: DrawResult[]): NumberStat[] {
  const total = results.length;
  const counts: Record<number, number> = {};

  for (let n = 1; n <= 55; n++) counts[n] = 0;
  for (const { numbers } of results) {
    for (const n of numbers) {
      if (n >= 1 && n <= 55) counts[n]++;
    }
  }

  return Object.entries(counts).map(([num, count]) => ({
    number: parseInt(num, 10),
    count,
    ratio: total > 0 ? count / total : 0,
  }));
}

function buildConsecutiveStats(results: DrawResult[]): { stats: ConsecutiveStat[]; summary: ConsecutiveSummary } {
  const total = results.length;
  const counts: Record<string, number> = {};

  for (let n = 1; n <= 54; n++) counts[`${n}-${n + 1}`] = 0;

  let drawsWithPair = 0;
  let totalAppearances = 0;

  for (const { numbers } of results) {
    const set = new Set(numbers);
    let pairsInDraw = 0;
    for (let n = 1; n <= 54; n++) {
      if (set.has(n) && set.has(n + 1)) {
        counts[`${n}-${n + 1}`]++;
        pairsInDraw++;
      }
    }
    if (pairsInDraw > 0) drawsWithPair++;
    totalAppearances += pairsInDraw;
  }

  const stats = Object.entries(counts).map(([key, count]) => {
    const [a, b] = key.split('-').map(Number);
    return { pair: [a, b] as [number, number], count, ratio: total > 0 ? count / total : 0 };
  });

  return {
    stats,
    summary: {
      totalAppearances,
      drawsWithPair,
      drawsWithPairRatio: total > 0 ? drawsWithPair / total : 0,
      avgPairsPerDraw: total > 0 ? totalAppearances / total : 0,
    },
  };
}

function buildPseudoStats(results: DrawResult[]): { stats: ConsecutiveStat[]; summary: ConsecutiveSummary } {
  const total = results.length;
  const counts: Record<string, number> = {};

  for (let n = 1; n <= 53; n++) counts[`${n}-${n + 2}`] = 0;

  let drawsWithPair = 0;
  let totalAppearances = 0;

  for (const { numbers } of results) {
    const set = new Set(numbers);
    let pairsInDraw = 0;
    for (let n = 1; n <= 53; n++) {
      if (set.has(n) && set.has(n + 2)) {
        counts[`${n}-${n + 2}`]++;
        pairsInDraw++;
      }
    }
    if (pairsInDraw > 0) drawsWithPair++;
    totalAppearances += pairsInDraw;
  }

  const stats = Object.entries(counts).map(([key, count]) => {
    const [a, b] = key.split('-').map(Number);
    return { pair: [a, b] as [number, number], count, ratio: total > 0 ? count / total : 0 };
  });

  return {
    stats,
    summary: {
      totalAppearances,
      drawsWithPair,
      drawsWithPairRatio: total > 0 ? drawsWithPair / total : 0,
      avgPairsPerDraw: total > 0 ? totalAppearances / total : 0,
    },
  };
}

function buildCombinedStats(results: DrawResult[]): CombinedPairStat[] {
  const total = results.length;
  let consecutiveOnly = 0;
  let pseudoOnly = 0;
  let both = 0;

  for (const { numbers } of results) {
    const set = new Set(numbers);
    const hasConsecutive = Array.from({ length: 54 }, (_, i) => i + 1).some(
      (n) => set.has(n) && set.has(n + 1)
    );
    const hasPseudo = Array.from({ length: 53 }, (_, i) => i + 1).some(
      (n) => set.has(n) && set.has(n + 2)
    );
    if (hasConsecutive && hasPseudo) both++;
    else if (hasConsecutive) consecutiveOnly++;
    else if (hasPseudo) pseudoOnly++;
  }

  const either = consecutiveOnly + pseudoOnly + both;
  return [
    { label: 'Has consecutive pair only',         count: consecutiveOnly, ratio: total > 0 ? consecutiveOnly / total : 0 },
    { label: 'Has pseudo pair only',               count: pseudoOnly,      ratio: total > 0 ? pseudoOnly / total : 0 },
    { label: 'Has both',                           count: both,            ratio: total > 0 ? both / total : 0 },
    { label: 'Has either (consecutive or pseudo)', count: either,          ratio: total > 0 ? either / total : 0 },
  ];
}

import * as fs from 'fs/promises';
import * as path from 'path';

const DATA_FILE = path.resolve(__dirname, '../../data/power-55-result.json');
const ANALYSE_FILE = path.resolve(__dirname, '../../data/power-55-analyse.json');

export async function exportAnalysis(): Promise<{ file: string; totalDraws: number }> {
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const { results } = JSON.parse(raw) as { results: DrawResult[] };
  const analysis = analyseResults(results);
  await fs.writeFile(ANALYSE_FILE, JSON.stringify(analysis, null, 2), 'utf-8');
  return { file: 'power-55-analyse.json', totalDraws: analysis.totalDraws };
}

export function analyseResults(results: DrawResult[]): AnalyseResult {
  const { stats: consecutiveStats, summary: consecutiveSummary } = buildConsecutiveStats(results);
  const { stats: pseudoStats, summary: pseudoSummary } = buildPseudoStats(results);

  return {
    totalDraws: results.length,
    numberStats: buildNumberStats(results),
    rangeStats: buildRangeStats(results),
    consecutiveStats,
    consecutiveSummary,
    pseudoStats,
    pseudoSummary,
    combinedStats: buildCombinedStats(results),
  };
}
