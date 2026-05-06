import { useState } from 'react';
import { getPrediction, type PredictResult } from '../services/resultsService';

export default function PredictionPage() {
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handlePredict() {
    setLoading(true);
    setError('');
    getPrediction()
      .then(setResult)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Next Draw Prediction</h1>
      <p className="text-sm text-gray-500 mb-6">
        Uses historical appearance ratios with recency adjustment to suggest 7 numbers · Power 6/55
      </p>

      <button
        onClick={handlePredict}
        disabled={loading}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Predicting…' : 'Generate Prediction'}
      </button>

      {error && (
        <p className="mt-6 text-red-500 text-sm">{error}</p>
      )}

      {result && !error && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-3 mb-4">
            {result.predictedNumbers.map((n) => (
              <span
                key={n}
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg shadow"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Generated at {new Date(result.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
