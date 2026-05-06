import { useEffect, useState } from 'react';
import {
  getAnalysis,
  type AnalyseResult,
  type NumberStat,
  type ConsecutiveStat,
} from '../services/resultsService';

type Tab = 'appearance-ratio' | 'consecutive-pairs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance-ratio', label: 'Appearance Ratio' },
  { id: 'consecutive-pairs', label: 'Number pairs ratio' },
];

export default function AnalyzePage() {
  const [data, setData] = useState<AnalyseResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('appearance-ratio');

  const [sortKey, setSortKey] = useState<keyof NumberStat>('number');
  const [sortAsc, setSortAsc] = useState(true);

  const [cSortKey, setCsortKey] = useState<'pair' | 'count' | 'ratio'>('pair');
  const [cSortAsc, setCsortAsc] = useState(true);

  const [pSortKey, setPsortKey] = useState<'pair' | 'count' | 'ratio'>('pair');
  const [pSortAsc, setPsortAsc] = useState(true);

  useEffect(() => {
    getAnalysis()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(key: keyof NumberStat) {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else { setSortKey(key); setSortAsc(key === 'number'); }
  }

  function handleCSort(key: typeof cSortKey) {
    if (cSortKey === key) setCsortAsc((prev) => !prev);
    else { setCsortKey(key); setCsortAsc(key === 'pair'); }
  }

  function handlePSort(key: typeof pSortKey) {
    if (pSortKey === key) setPsortAsc((prev) => !prev);
    else { setPsortKey(key); setPsortAsc(key === 'pair'); }
  }

  function arrow(key: keyof NumberStat) {
    if (sortKey !== key) return '';
    return sortAsc ? ' ▲' : ' ▼';
  }

  function cArrow(key: typeof cSortKey) {
    if (cSortKey !== key) return '';
    return cSortAsc ? ' ▲' : ' ▼';
  }

  function pArrow(key: typeof pSortKey) {
    if (pSortKey !== key) return '';
    return pSortAsc ? ' ▲' : ' ▼';
  }

  function sortPairStats(stats: ConsecutiveStat[], key: 'pair' | 'count' | 'ratio', asc: boolean) {
    return [...stats].sort((a, b) => {
      const diff = key === 'pair' ? a.pair[0] - b.pair[0] : a[key] - b[key];
      return asc ? diff : -diff;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg">{error || 'No data'}</p>
      </div>
    );
  }

  const sorted = [...data.numberStats].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  const cSorted = sortPairStats(data.consecutiveStats, cSortKey, cSortAsc);
  const pSorted = sortPairStats(data.pseudoStats, pSortKey, pSortAsc);

  const { totalDraws, rangeStats, consecutiveSummary, pseudoSummary, combinedStats } = data;

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
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
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
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleSort('number')}>Number{arrow('number')}</th>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleSort('count')}>Appearances{arrow('count')}</th>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleSort('ratio')}>Ratio{arrow('ratio')}</th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(({ number, count, ratio }) => (
                  <tr key={number} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-semibold text-gray-800 w-20">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">{number}</span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
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

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleCSort('pair')}>Pair{cArrow('pair')}</th>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleCSort('count')}>Appearances{cArrow('count')}</th>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handleCSort('ratio')}>Ratio{cArrow('ratio')}</th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cSorted.map(({ pair, count, ratio }) => (
                  <tr key={pair[0]} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-semibold text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">{pair[0]}</span>
                        <span className="text-gray-400 text-xs">+1</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">{pair[1]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-1">Pseudo number pairs ratio</h2>
          <p className="text-sm text-gray-500 mb-4">Numbers with a gap of 2 (e.g. 23 &amp; 25) · Based on {totalDraws} draws</p>

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

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handlePSort('pair')}>Pair{pArrow('pair')}</th>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handlePSort('count')}>Appearances{pArrow('count')}</th>
                  <th className="px-5 py-3 cursor-pointer select-none hover:bg-gray-100" onClick={() => handlePSort('ratio')}>Ratio{pArrow('ratio')}</th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pSorted.map(({ pair, count, ratio }) => (
                  <tr key={pair[0]} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-semibold text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">{pair[0]}</span>
                        <span className="text-gray-400 text-xs">+2</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">{pair[1]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-gray-700">{count}</td>
                    <td className="px-5 py-2.5 text-gray-700">{(ratio * 100).toFixed(2)}%</td>
                    <td className="px-5 py-2.5 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
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
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
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
