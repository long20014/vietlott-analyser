import { useEffect, useState } from 'react';
import { getResults, type DrawResult } from '../services/resultsService';

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

const RANGES: { label: string; from: number; to: number }[] = [
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

function buildStats(results: DrawResult[]): NumberStat[] {
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

  const summary: ConsecutiveSummary = {
    totalAppearances,
    drawsWithPair,
    drawsWithPairRatio: total > 0 ? drawsWithPair / total : 0,
    avgPairsPerDraw: total > 0 ? totalAppearances / total : 0,
  };

  return { stats, summary };
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

  const summary: ConsecutiveSummary = {
    totalAppearances,
    drawsWithPair,
    drawsWithPairRatio: total > 0 ? drawsWithPair / total : 0,
    avgPairsPerDraw: total > 0 ? totalAppearances / total : 0,
  };

  return { stats, summary };
}

interface CombinedPairStat {
  label: string;
  count: number;
  ratio: number;
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
    { label: 'Has consecutive pair only',      count: consecutiveOnly, ratio: total > 0 ? consecutiveOnly / total : 0 },
    { label: 'Has pseudo pair only',            count: pseudoOnly,      ratio: total > 0 ? pseudoOnly / total : 0 },
    { label: 'Has both',                        count: both,            ratio: total > 0 ? both / total : 0 },
    { label: 'Has either (consecutive or pseudo)', count: either,       ratio: total > 0 ? either / total : 0 },
  ];
}

type Tab = 'appearance-ratio' | 'consecutive-pairs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance-ratio', label: 'Appearance Ratio' },
  { id: 'consecutive-pairs', label: 'Number pairs ratio' },
];

export default function AnalyzePage() {
  const [stats, setStats] = useState<NumberStat[]>([]);
  const [rangeStats, setRangeStats] = useState<RangeStat[]>([]);
  const [consecutiveStats, setConsecutiveStats] = useState<ConsecutiveStat[]>([]);
  const [consecutiveSummary, setConsecutiveSummary] = useState<ConsecutiveSummary | null>(null);
  const [totalDraws, setTotalDraws] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('appearance-ratio');
  const [sortKey, setSortKey] = useState<'number' | 'count' | 'ratio'>('number');
  const [sortAsc, setSortAsc] = useState(true);
  const [cSortKey, setCsortKey] = useState<'pair' | 'count' | 'ratio'>('pair');
  const [cSortAsc, setCsortAsc] = useState(true);
  const [pseudoStats, setPseudoStats] = useState<ConsecutiveStat[]>([]);
  const [pseudoSummary, setPseudoSummary] = useState<ConsecutiveSummary | null>(null);
  const [combinedStats, setCombinedStats] = useState<CombinedPairStat[]>([]);
  const [pSortKey, setPsortKey] = useState<'pair' | 'count' | 'ratio'>('pair');
  const [pSortAsc, setPsortAsc] = useState(true);

  useEffect(() => {
    getResults()
      .then(({ results }) => {
        setStats(buildStats(results));
        setRangeStats(buildRangeStats(results));
        const { stats: cStats, summary: cSummary } = buildConsecutiveStats(results);
        setConsecutiveStats(cStats);
        setConsecutiveSummary(cSummary);
        const { stats: pStats, summary: pSummary } = buildPseudoStats(results);
        setPseudoStats(pStats);
        setPseudoSummary(pSummary);
        setCombinedStats(buildCombinedStats(results));
        setTotalDraws(results.length);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(key === 'number');
    }
  }

  const sorted = [...stats].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  function arrow(key: typeof sortKey) {
    if (sortKey !== key) return '';
    return sortAsc ? ' ▲' : ' ▼';
  }

  function handleCSort(key: typeof cSortKey) {
    if (cSortKey === key) {
      setCsortAsc((prev) => !prev);
    } else {
      setCsortKey(key);
      setCsortAsc(key === 'pair');
    }
  }

  const cSorted = [...consecutiveStats].sort((a, b) => {
    if (cSortKey === 'pair') {
      const diff = a.pair[0] - b.pair[0];
      return cSortAsc ? diff : -diff;
    }
    const diff = a[cSortKey] - b[cSortKey];
    return cSortAsc ? diff : -diff;
  });

  function cArrow(key: typeof cSortKey) {
    if (cSortKey !== key) return '';
    return cSortAsc ? ' ▲' : ' ▼';
  }

  function handlePSort(key: typeof pSortKey) {
    if (pSortKey === key) {
      setPsortAsc((prev) => !prev);
    } else {
      setPsortKey(key);
      setPsortAsc(key === 'pair');
    }
  }

  const pSorted = [...pseudoStats].sort((a, b) => {
    if (pSortKey === 'pair') {
      const diff = a.pair[0] - b.pair[0];
      return pSortAsc ? diff : -diff;
    }
    const diff = a[pSortKey] - b[pSortKey];
    return pSortAsc ? diff : -diff;
  });

  function pArrow(key: typeof pSortKey) {
    if (pSortKey !== key) return '';
    return pSortAsc ? ' ▲' : ' ▼';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'appearance-ratio' && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">The appearance of range 10 number</h2>
          <p className="text-sm text-gray-500 mb-4">Based on {totalDraws} draws · Power 6/55</p>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-8">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3">Range</th>
                  <th className="px-5 py-3">Appearances</th>
                  <th className="px-5 py-3">Ratio</th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rangeStats.map(({ label, count, ratio }) => (
                  <tr key={label} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-semibold text-gray-800">{label}</td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(ratio * 100).toFixed(2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-1">The appearance ratio of each number</h2>
          <p className="text-sm text-gray-500 mb-4">Based on {totalDraws} draws · Power 6/55</p>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleSort('number')}
                  >
                    Number{arrow('number')}
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleSort('count')}
                  >
                    Appearances{arrow('count')}
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleSort('ratio')}
                  >
                    Ratio{arrow('ratio')}
                  </th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(({ number, count, ratio }) => (
                  <tr key={number} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-semibold text-gray-800 w-20">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                        {number}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(ratio * 100).toFixed(2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'consecutive-pairs' && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Consecutive number pairs ratio</h2>
          <p className="text-sm text-gray-500 mb-4">Based on {totalDraws} draws · Power 6/55</p>

          {consecutiveSummary && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3">Total pair appearances</th>
                    <th className="px-5 py-3">Draws with ≥1 pair</th>
                    <th className="px-5 py-3">Draws with pair ratio</th>
                    <th className="px-5 py-3">Avg pairs per draw</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-800">{consecutiveSummary.totalAppearances}</td>
                    <td className="px-5 py-3 text-gray-700">{consecutiveSummary.drawsWithPair}</td>
                    <td className="px-5 py-3 text-gray-700">{(consecutiveSummary.drawsWithPairRatio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-3 text-gray-700">{consecutiveSummary.avgPairsPerDraw.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleCSort('pair')}
                  >
                    Pair{cArrow('pair')}
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleCSort('count')}
                  >
                    Appearances{cArrow('count')}
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleCSort('ratio')}
                  >
                    Ratio{cArrow('ratio')}
                  </th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cSorted.map(({ pair, count, ratio }) => (
                  <tr key={pair[0]} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-semibold text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {pair[0]}
                        </span>
                        <span className="text-gray-400 text-xs">+1</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {pair[1]}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(ratio * 100).toFixed(2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-1">Pseudo number pairs ratio</h2>
          <p className="text-sm text-gray-500 mb-4">Numbers with a gap of 2 (e.g. 23 &amp; 25) · Based on {totalDraws} draws</p>

          {pseudoSummary && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3">Total pair appearances</th>
                    <th className="px-5 py-3">Draws with ≥1 pair</th>
                    <th className="px-5 py-3">Draws with pair ratio</th>
                    <th className="px-5 py-3">Avg pairs per draw</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-800">{pseudoSummary.totalAppearances}</td>
                    <td className="px-5 py-3 text-gray-700">{pseudoSummary.drawsWithPair}</td>
                    <td className="px-5 py-3 text-gray-700">{(pseudoSummary.drawsWithPairRatio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-3 text-gray-700">{pseudoSummary.avgPairsPerDraw.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handlePSort('pair')}
                  >
                    Pair{pArrow('pair')}
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handlePSort('count')}
                  >
                    Appearances{pArrow('count')}
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handlePSort('ratio')}
                  >
                    Ratio{pArrow('ratio')}
                  </th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pSorted.map(({ pair, count, ratio }) => (
                  <tr key={pair[0]} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-semibold text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                          {pair[0]}
                        </span>
                        <span className="text-gray-400 text-xs">+2</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                          {pair[1]}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(ratio * 100).toFixed(2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-1">Combined pair analysis</h2>
          <p className="text-sm text-gray-500 mb-4">Total ratio when a consecutive or pseudo pair appears · Based on {totalDraws} draws</p>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Draws</th>
                  <th className="px-5 py-3">Ratio</th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {combinedStats.map(({ label, count, ratio }) => (
                  <tr key={label} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-800 font-medium">{label}</td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(ratio * 100).toFixed(2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
