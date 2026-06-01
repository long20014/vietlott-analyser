# Top-10 Probabilistic Prediction Candidates — Power 6/55 — Algorithm v3

## Why v2 Failed

Algorithm v2 was tested against the actual draw on 28/05/2026: **[2, 8, 20, 24, 25, 42]**.
The prediction scored that combination at approximately **0.285** — far below the #1 prediction at **0.4411**. Zero of 6 numbers matched.

Diagnosis (see `prediction-accuracy-analysis.md`):

| Problem | v2 behaviour | Impact |
|---|---|---|
| Recency penalty (gambler's fallacy) | Numbers in last 5 draws → weight ×0.1, numberScore = 0 | 3 of 6 winners were penalised to near-zero |
| Frequency noise treated as signal | 4% spread across 1,350 draws is within random variance | Algorithm over-concentrates on a narrow band of "hot" numbers |
| Range-spread reward | Penalises combinations where multiple numbers land in the same range | Real draws cluster frequently; v2 steers away from that |
| pairScore overweighted | Both pair bonuses together contribute more than any single number | All top-10 picks had pairs; ~56% of real draws have none |
| Frozen PRNG | Seed = totalDraws → same result every call until analysis is regenerated | No diversity between calls with same data |

---

## Algorithm v3 Design

### Core principle change

v2 modelled "what combination looks unusual / statistically rare to avoid". v3 models "what combination is consistent with the historical base rate of each draw characteristic" — without penalising randomness.

The lottery is memoryless. No number is "due." v3 removes all recency-based penalties and reduces reliance on narrow frequency rankings.

---

## Scoring

```
score = 0.4 × numberScore + 0.35 × rangeScore + 0.25 × pairScore
```

Weight changes from v2: numberScore reduced (0.5 → 0.4), rangeScore slightly up (0.3 → 0.35), pairScore up slightly (0.2 → 0.25) to better reflect that pair-containing draws are roughly as common as non-pair draws.

### numberScore (weight 0.4)

Reward numbers that have historically appeared more often, with **no recency penalty**.

```
numberScore = mean(ratio[n] for n in candidate)
```

Numbers in the last 5 draws are treated identically to any other number. The ~4% spread between hottest and coldest is real historical data and contributes a gentle tilt, not a hard exclusion.

### rangeScore (weight 0.35)

Unchanged from v2 — historical range coverage ratios are more stable and meaningful than individual number ratios.

```
for each range (1–9, 10–19, 20–29, 30–39, 40–49, 50–55):
  add rangeRatio   if candidate covers that range
  add 1-rangeRatio if not

rangeScore = sum / 6
```

### pairScore (weight 0.25)

Unchanged formula from v2 (after the v2 fix that set no-pair bonus to 0):

```
pairScore = consecBonus + pseudoBonus + pairStrength

consecBonus  = drawsWithPairRatio   if ≥1 consecutive pair (n, n+1) present, else 0
pseudoBonus  = drawsWithPairRatio   if ≥1 pseudo pair (n, n+2) present, else 0
pairStrength = Σ ratio[pair] for each consecutive pair found
             + Σ ratio[pair] for each pseudo pair found
```

Historical base rates: ~43.7% consecutive, ~44.4% pseudo. These bonuses are now proportionate — a pair is rewarded, but absence of a pair is not punished (bonus = 0, not a negative).

---

## Candidate Generation

1. Read last 5 draws, build `recentNumbers` (still used for 50–55 range rule, not for penalising)
2. Read last 2 draws, build `last2Numbers`
3. Build base weights: `ratio[n]` for all numbers — **no ×0.1 penalty for recent numbers**
   - Exception: numbers 50–55 that appeared in `last2Numbers` get weight **0** (those high-end numbers do repeat less reliably in consecutive short windows)
4. Seed PRNG with `analysis.totalDraws` (deterministic)
5. Run 100,000 weighted roulette samples of 6 numbers
6. Check if all 4 of the last 4 draws contained at least one pair (consecutive or pseudo)
   - If yes → pairs are optional in predictions (no minimum enforced)
   - If no → at least 1 pair required per candidate
   - Either way: maximum 2 total pairs per candidate
7. Deduplicate by sorted key
8. Score every unique candidate
9. Sort descending, return top 10

---

## Key rule changes from v2

| Rule | v2 | v3 |
|---|---|---|
| Recent numbers (last 5 draws) | Weight ×0.1, numberScore = 0 | Full weight, full numberScore |
| High-end numbers (50–55) in last 2 draws | Weight ×0.1 | Weight = 0 (excluded) |
| numberScore weight | 0.5 | 0.4 |
| rangeScore weight | 0.3 | 0.35 |
| pairScore weight | 0.2 | 0.25 |
| Pair count per candidate | ≤2 total | ≤2 total; minimum 1 only when last 4 draws did NOT all have pairs |

---

## Output Format

```typescript
interface PredictionCandidate {
  numbers: number[];              // 6 distinct numbers, sorted ascending
  score: number;
  numberScore: number;
  rangeScore: number;
  pairScore: number;
  rangesCovered: string[];
  consecutivePairs: [number, number][];
  pseudoPairs: [number, number][];
}

interface Top10PredictResult {
  predictions: PredictionCandidate[];  // 10 items, descending score (rank 1 = highest)
  generatedAt: string;
}
```

---

## Implementation

| File | Change |
|---|---|
| `backend/src/services/predictor.ts` | Remove recency penalty from `baseWeights`; adjust score weights; update `numberScore` in `scoreCombination` |
| `backend/src/services/analyser.ts` | No change |
| `backend/src/routes/api.ts` | No change |
| `frontend/` | No change |

---

## Operational Order

```
POST /api/crawl               → refreshes power-55-result.json
POST /api/analyse/export      → refreshes power-55-analyse.json
POST /api/predict/top10       → scores 100k candidates, writes power-55-top10-predict.json
```

---

## Honest caveat

Power 6/55 has **341,055,480** possible combinations. No historical analysis can meaningfully predict a memoryless random draw. v3 removes the most harmful incorrect assumptions from v2 (gambler's fallacy, recency bias), making predictions that better reflect the actual statistical profile of past draws — but hit rate will remain near zero. The value of the algorithm is exploration and entertainment, not prediction.
