# Why the Predictions Miss the Actual Draw

## Actual draw vs. top prediction

| | Numbers | Extra |
|---|---|---|
| **Actual** | 2, 8, 20, 24, 25, 42 | 44 |
| **Prediction #1** | 9, 11, 29, 30, 44, 51 | — |
| **Overlap** | 0 of 6 | — |

---

## Per-number breakdown — why each winning number scores low

| Number | Ratio rank | In last 5 draws? | Algorithm effect |
|--------|-----------|-----------------|-----------------|
| **2** | Bottom 10 (0.0956) | No | Low sampling weight due to poor historical frequency |
| **8** | Top 10 (0.1178) | **Yes** — draw 5 (16/05) | Weight ×0.1, numberScore contribution = **0** |
| **20** | Average (~0.108) | **Yes** — draw 3 (21/05) | Weight ×0.1, numberScore contribution = **0** |
| **24** | Average (~0.108) | No | Eligible, but low ratio relative to top picks |
| **25** | Average (~0.110) | **Yes** — draw 5 (16/05) | Weight ×0.1, numberScore contribution = **0** |
| **42** | Above average (~0.115) | No | Eligible, appears in some predictions |

**3 of 6 winning numbers were crippled by the recency penalty before scoring even began.**

---

## Score simulation for the actual draw

Estimating how [2, 8, 20, 24, 25, 42] would score under the current algorithm:

**numberScore** = mean of ratio contributions, where recent numbers contribute 0:
```
(0 + 0 + ~0.108 + 0 + ~0.110 + ~0.115) / 6 ≈ 0.056
```
Compare to top predictions: **~0.115** (2× higher)

**rangeScore** — actual draw covers:
- 1–9 ✓ (2, 8)
- 10–19 ✗
- 20–29 ✓ (20, 24, 25)
- 30–39 ✗
- 40–49 ✓ (42)
- 50–55 ✗

Only 3 of 6 ranges → rangeScore ≈ **0.55** vs top predictions at **~0.675**

**pairScore** — actual draw has:
- Consecutive pairs: 24-25 → consecBonus = 0.437
- Pseudo pairs: none → pseudoBonus = 0

pairScore ≈ **0.46** vs top predictions at **~0.90**

**Estimated total score:**
```
0.5 × 0.056 + 0.3 × 0.55 + 0.2 × 0.46 ≈ 0.028 + 0.165 + 0.092 = 0.285
```
Compare to #1 prediction score: **0.4411**. The actual draw would rank thousands of places below the top 10.

---

## Root causes

### 1. Recency penalty is the gambler's fallacy

The algorithm assumes numbers that appeared recently are "due a rest." This is the classic gambler's fallacy. Power 6/55 is drawn by a physical machine — each ball has exactly the same probability every draw, regardless of previous results. Three of the six winning numbers (8, 20, 25) had appeared in the prior 5 draws and were systematically excluded.

### 2. Frequency ratios carry almost no real signal

Over 1,350 draws, the most frequent number (22: 12.89%) vs. the least frequent (4: 8.89%) differs by only **~4 percentage points**. Each number is expected to appear roughly `1350 × 6 / 55 ≈ 147` times. The observed spread is entirely consistent with random sampling noise — there is no statistically meaningful "hot" or "cold" number.

### 3. Range-spread reward punishes natural clustering

The rangeScore formula rewards covering as many of the 6 ranges as possible (1 number per range = best score). But the actual draw had **3 numbers in 20–29 alone**. Clustering in one range happens regularly in real draws, but the algorithm treats it as a negative signal and steers predictions away from it.

### 4. pairScore disproportionately dominates

When a combination has both consecutive and pseudo pairs, it earns:
```
consecBonus (0.437) + pseudoBonus (0.444) = 0.881 base pairScore
```
Multiplied by weight 0.2, this adds **+0.176** to the final score — larger than any individual numberScore contribution (~0.023 per number). The algorithm strongly filters toward combinations that look "pair-rich," but only ~44% of real draws contain either type of pair.

### 5. The seeded PRNG freezes predictions until the analysis is updated

The seed is `analysis.totalDraws` (currently 1,350). Every call to generate predictions with the same analysis file returns the **exact same 10 combinations**. Predictions won't change until `npm run analyse` is re-run after new draws are crawled.

---

## Fundamental limitation

Power 6/55 has **C(55,6) = 341,055,480** possible combinations. The algorithm samples 100,000 of them and ranks by heuristic score. Even if the heuristics were perfect, the winning combination is one of 341 million — no frequency or pattern analysis can meaningfully narrow that down.

The predictions are internally self-consistent (they reflect the algorithm's beliefs about what a "good" combination looks like), but those beliefs are not predictive of a memoryless random draw.

---

## What would improve accuracy (marginally)

| Change | Rationale |
|--------|-----------|
| Remove recency penalty entirely | It's gambler's fallacy for a random draw |
| Remove or heavily reduce frequency weighting | 4% spread over 1350 draws is noise, not signal |
| Allow same-range clustering | Real draws frequently cluster; penalising it skews results |
| Reduce pairScore weight | Pairs occur ~44% of the time; currently over-rewarded |

Even with all these changes, the improvement in hit rate would be marginal. The game is designed to be unpredictable.
