# Probabilistic Prediction Algorithm — Power 6/55

## Overview

Given the full draw history and pre-computed statistical analysis, predict the 7 most probable numbers for the next Power 6/55 draw using weighted random sampling.

## Inputs

| Input | Source | Description |
|---|---|---|
| `results` | `data/power-55-result.json` | All historical draws, sorted newest-first |
| `analysis` | `data/power-55-analyse.json` | Pre-computed statistics over all draws |

`analysis` must be generated first via `POST /api/analyse/export`.

## Algorithm

### Step 1 — Base weights

Each number 1–55 is assigned a base weight equal to its historical appearance ratio:

```
weight[n] = numberStats[n].count / totalDraws
```

Numbers that appear more often historically receive proportionally higher selection probability.

### Step 2 — Recency adjustment

For each of the 5 most recent draws (index 0 = latest), reduce the weight of any number that appeared in that draw:

```
weight[n] *= (1 - RECENCY_DECAY[i])
```

| Draw index | Decay factor | Weight retained |
|---|---|---|
| 0 (latest) | 0.15 | 85% |
| 1 | 0.12 | 88% |
| 2 | 0.09 | 91% |
| 3 | 0.06 | 94% |
| 4 (oldest of 5) | 0.03 | 97% |

A number appearing in all 5 recent draws retains approximately 62% of its base weight. No weight ever reaches zero.

Rationale: recent draws exhibit a mild regression-to-mean pattern — numbers just drawn are slightly less likely to appear again immediately.

### Step 3 — Weighted roulette sampling without replacement

Pick 7 distinct numbers using fitness-proportionate selection:

```
for each pick (1..7):
  total = sum of all remaining weights
  threshold = Math.random() * total
  iterate pool until cumulative_weight >= threshold
  select that number, remove from pool
```

The 7 selected numbers are sorted ascending and returned.

## Output

Written to `data/power-55-predict.json`:

```json
{
  "predictedNumbers": [6, 22, 25, 26, 31, 51, 53],
  "generatedAt": "2026-05-06T09:13:09.057Z"
}
```

## API

```
POST /api/predict/export
```

Response:
```json
{ "success": true, "file": "power-55-predict.json" }
```

Each call produces a fresh prediction (stochastic — result varies per call).

## Implementation

| File | Role |
|---|---|
| `backend/src/services/predictor.ts` | `predictNextDraw()`, `exportPrediction()` |
| `backend/src/services/analyser.ts` | Provides `AnalyseResult` type and `exportAnalysis()` |
| `backend/src/routes/api.ts` | `POST /api/predict/export` route |

## Operational order

```
POST /api/crawl           → refreshes power-55-result.json
POST /api/analyse/export  → refreshes power-55-analyse.json
POST /api/predict/export  → writes  power-55-predict.json
```
