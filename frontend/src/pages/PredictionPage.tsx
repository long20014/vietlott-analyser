import { useState } from 'react';
import {
  getTop10Predictions,
  type PredictionCandidate,
  type Top10PredictResult,
} from '../services/resultsService';

function buildWhyText(c: PredictionCandidate): string {
  const parts: string[] = [];
  parts.push(`Avg number frequency ${(c.numberScore * 100).toFixed(1)}%`);
  parts.push(`covers ${c.rangesCovered.length} range${c.rangesCovered.length !== 1 ? 's' : ''}`);
  if (c.consecutivePairs.length > 0)
    parts.push(`${c.consecutivePairs.length} consecutive pair${c.consecutivePairs.length !== 1 ? 's' : ''}`);
  if (c.pseudoPairs.length > 0)
    parts.push(`${c.pseudoPairs.length} pseudo pair${c.pseudoPairs.length !== 1 ? 's' : ''}`);
  return parts.join(', ');
}

export default function PredictionPage() {
  const [top10Result, setTop10Result] = useState<Top10PredictResult | null>(null);
  const [top10Loading, setTop10Loading] = useState(false);
  const [top10Error, setTop10Error] = useState('');

  function handleTop10() {
    setTop10Loading(true);
    setTop10Error('');
    getTop10Predictions()
      .then(setTop10Result)
      .catch((e: Error) => setTop10Error(e.message))
      .finally(() => setTop10Loading(false));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Top 10 Candidate Combinations</h1>
      <p className="text-sm text-gray-500 mb-6">
        Scores 100,000 weighted samples on number frequency, range coverage, and pair patterns · Power 6/55
      </p>

      <button
        onClick={handleTop10}
        disabled={top10Loading}
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {top10Loading ? 'Generating…' : 'Generate Top 10 Predictions'}
      </button>

      {top10Error && <p className="mt-6 text-red-500 text-sm">{top10Error}</p>}

      {top10Result && !top10Error && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Numbers</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Ranges Covered</th>
                <th className="px-4 py-3">Consecutive Pairs</th>
                <th className="px-4 py-3">Pseudo Pairs</th>
                <th className="px-4 py-3">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {top10Result.predictions.map((c, idx) => {
                const rank = top10Result.predictions.length - idx;
                return (
                  <tr key={idx} className={`hover:bg-gray-50 ${rank === top10Result.predictions.length ? 'bg-indigo-50' : ''}`}>
                    <td className="px-4 py-3 font-bold text-gray-700">#{rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {c.numbers.map((n) => (
                          <span
                            key={n}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{c.score.toFixed(4)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.rangesCovered.join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {c.consecutivePairs.length > 0
                        ? c.consecutivePairs.map(([a, b]) => `${a}-${b}`).join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {c.pseudoPairs.length > 0
                        ? c.pseudoPairs.map(([a, b]) => `${a}-${b}`).join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs italic">{buildWhyText(c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
            Generated at {new Date(top10Result.generatedAt).toLocaleString()} · Rank 1 = lowest score, Rank {top10Result.predictions.length} = highest score
          </p>
        </div>
      )}
    </div>
  );
}
