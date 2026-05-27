# Top-10 Probabilistic Prediction Candidates — Power 6/55

## Overview

Scores 100,000 weighted 7-number candidates against three statistical dimensions from historical draw data. Returns the top 10 combinations sorted ascending by composite score (rank 10 = most likely).

## Scoring Algorithm

Each 7-number candidate receives a composite score:

```
score = 0.5 × numberScore + 0.3 × rangeScore + 0.2 × pairScore
```

### numberScore (weight 0.5)

Average of each number's historical appearance ratio:

```
numberScore = mean(ratio[n] for n in candidate)
```

Numbers that appear more often historically push this score higher (~0.10–0.15 range per number).

### rangeScore (weight 0.3)

For each of the 6 ranges (1–9, 10–19, 20–29, 30–39, 40–49, 50–55):
- Add `rangeRatio` if the candidate covers that range
- Add `1 - rangeRatio` if not

```
rangeScore = sum / 6
```

Rewards candidates whose range coverage mirrors the historical distribution.

### pairScore (weight 0.2)

```
pairScore = consecBonus + pseudoBonus + pairStrength

consecBonus  = consecutiveSummary.drawsWithPairRatio   if ≥1 consecutive pair (n, n+1) found
             = 1 - drawsWithPairRatio                  otherwise

pseudoBonus  = pseudoSummary.drawsWithPairRatio         if ≥1 pseudo pair (n, n+2) found
             = 1 - drawsWithPairRatio                  otherwise

pairStrength = Σ consecutiveStats[pair].ratio for each consecutive pair found
             + Σ pseudoStats[pair].ratio for each pseudo pair found
```

Historical data: ~56.9% of draws contain ≥1 consecutive pair; ~55.3% contain ≥1 pseudo pair.

## Candidate Generation

1. Build base weights from `numberStats` (historical ratios, no recency decay)
2. Run 100,000 weighted roulette samples using `weightedSampleWithoutReplacement`
3. Deduplicate by sorted comma-joined key
4. Score every unique candidate with the composite formula above
5. Sort all candidates descending by score, take top 10
6. Re-sort ascending before output (rank 1 = lowest score, rank 10 = best)

## API

```
POST /api/predict/top10
```

Response: full `Top10PredictResult` object (see Output Format below).
Requires `data/power-55-analyse.json` to exist (run `POST /api/analyse/export` first).
Output is also written to `temp/power-55-top10-predict.json`.

## Output Format

```typescript
interface PredictionCandidate {
  numbers: number[];              // 7 distinct numbers, sorted ascending
  score: number;                  // composite score
  numberScore: number;
  rangeScore: number;
  pairScore: number;
  rangesCovered: string[];        // e.g. ["1 – 9", "20 – 29", "40 – 49"]
  consecutivePairs: [number, number][];
  pseudoPairs: [number, number][];
}

interface Top10PredictResult {
  predictions: PredictionCandidate[];  // 10 items, ascending score
  generatedAt: string;                 // ISO timestamp
}
```

Example entry:

```json
{
  "numbers": [7, 14, 22, 23, 36, 44, 51],
  "score": 0.5123,
  "numberScore": 0.1312,
  "rangeScore": 0.7201,
  "pairScore": 1.1840,
  "rangesCovered": ["1 – 9", "10 – 19", "20 – 29", "30 – 39", "40 – 49", "50 – 55"],
  "consecutivePairs": [[22, 23]],
  "pseudoPairs": []
}
```

## Implementation

| File | Role |
|---|---|
| `backend/src/services/predictor.ts` | `scoreCombination()`, `generateTop10Predictions()`, `exportTop10Predictions()` |
| `backend/src/services/analyser.ts` | Provides `AnalyseResult` type (read-only dependency) |
| `backend/src/routes/api.ts` | `POST /api/predict/top10` route |
| `frontend/src/services/resultsService.ts` | `PredictionCandidate`, `Top10PredictResult` interfaces, `getTop10Predictions()` |
| `frontend/src/pages/PredictionPage.tsx` | Table UI with Rank / Numbers / Score / Ranges / Pairs / Why columns |

## Operational Order

```
POST /api/crawl               → refreshes power-55-result.json
POST /api/analyse/export      → refreshes power-55-analyse.json
POST /api/predict/top10       → scores 100k candidates, writes power-55-top10-predict.json
```
