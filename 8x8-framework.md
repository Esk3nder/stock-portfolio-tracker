# The 8x8 Framework: Complete System for Elite Compounder Selection

## Core Principle
8 pillars select exactly 8 stocks. No overrides. No diversity rules. No discretion. The framework decides everything.

## Part 1: The Scoring System (8 Points Per Pillar, 64 Maximum)

### Pillar 1: Moat Test (ROIC)
- **8 points:** ROIC > 40%
- **7 points:** ROIC 35-40%
- **6 points:** ROIC 30-35%
- **5 points:** ROIC 25-30%
- **4 points:** ROIC 20-25%
- **0 points:** Below 20% → ELIMINATED

### Pillar 2: Fortress Test (Debt-to-EBITDA)
- **8 points:** Net cash position
- **7 points:** 0 to 0.5x
- **6 points:** 0.5x to 1.0x
- **5 points:** 1.0x to 1.5x
- **4 points:** 1.5x to 2.5x
- **0 points:** Above 2.5x → ELIMINATED

### Pillar 3: Engine Test (Revenue CAGR 3-Year)
- **8 points:** > 30%
- **7 points:** 25-30%
- **6 points:** 20-25%
- **5 points:** 15-20%
- **4 points:** 10-15%
- **0 points:** Below 10% → ELIMINATED

### Pillar 4: Efficiency Test (Rule of 40)
- **8 points:** > 70%
- **7 points:** 60-70%
- **6 points:** 50-60%
- **5 points:** 45-50%
- **4 points:** 40-45%
- **0 points:** Below 40% → ELIMINATED

### Pillar 5: Pricing Power Test (Gross Margin vs Industry Peers)
- **8 points:** Top 5% of industry
- **7 points:** Top 10% of industry
- **6 points:** Top 20% of industry
- **5 points:** Top 30% of industry
- **4 points:** Top 40% of industry
- **0 points:** Below top 40% → ELIMINATED

### Pillar 6: Capital Allocation Test (ROE + Buyback Quality)
- **8 points:** ROE >30% + buybacks only below 15x FCF
- **7 points:** ROE >25% + disciplined buybacks
- **6 points:** ROE >20% + moderate buybacks
- **5 points:** ROE 15-20% + improving trend
- **4 points:** ROE >15% stable
- **0 points:** ROE <15% or declining → ELIMINATED

### Pillar 7: Cash Generation Test (FCF Margin)
- **8 points:** FCF margin > 30%
- **7 points:** FCF margin 25-30%
- **6 points:** FCF margin 20-25%
- **5 points:** FCF margin 15-20%
- **4 points:** FCF margin 12-15%
- **0 points:** Below 12% → ELIMINATED

### Pillar 8: Durability Test (Market Share Trend × TAM Growth)
- **8 points:** Gaining share in >20% TAM growth
- **7 points:** Gaining share in 15-20% TAM growth
- **6 points:** Stable share in >20% TAM growth
- **5 points:** Gaining share in 10-15% TAM growth
- **4 points:** Stable share in >10% TAM growth
- **0 points:** Losing share or TAM shrinking → ELIMINATED

### Scoring Rules
- **Minimum score to qualify:** 32 points (average 4 per pillar)
- **Maximum possible score:** 64 points (perfect 8s)
- **Any single 0:** Stock is eliminated regardless of other scores

## Part 2: The Selection Process

### Step 1: Calculate Scores
Score every stock in your universe (S&P 500, global stocks, etc.) from 0-64 points.

### Step 2: Rank
List all qualifying stocks (32+ points) from highest to lowest score.

### Step 3: Select Top 8
Take the 8 highest-scoring stocks. Period.
- If 8 are tech stocks, you own 8 tech stocks
- If 8 are large caps, you own 8 large caps
- No adjustments, no overrides

### Step 4: Handle Ties
If stocks have identical scores (both score 52):
1. Higher lowest pillar score wins (better consistency)
2. If still tied: higher median pillar score
3. If still tied: lower P/FCF multiple
4. If still tied: larger FCF absolute dollars

## Part 3: The Weighting Formula

### Calculate Each Position Size

**Formula:**
```
Weight = (Stock Score - 30) / Sum of All (Scores - 30)
```

### Example Calculation

**Your 8 stocks scored:**
- Stock A: 58 points
- Stock B: 56 points  
- Stock C: 53 points
- Stock D: 51 points
- Stock E: 49 points
- Stock F: 47 points
- Stock G: 45 points
- Stock H: 43 points

**Points above 30 base:**
- A: 28
- B: 26
- C: 23
- D: 21
- E: 19
- F: 17
- G: 15
- H: 13

**Sum: 162**

**Final weights:**
- Stock A: 28/162 = **17.3%**
- Stock B: 26/162 = **16.0%**
- Stock C: 23/162 = **14.2%**
- Stock D: 21/162 = **13.0%**
- Stock E: 19/162 = **11.7%**
- Stock F: 17/162 = **10.5%**
- Stock G: 15/162 = **9.3%**
- Stock H: 13/162 = **8.0%**

**Total: 100%**

## Part 4: The Execution Protocol

### Initial Implementation
1. Score entire universe (Day 1)
2. Select top 8 stocks
3. Calculate weights
4. Place all trades immediately
5. Fully invested same day (no timing)

### Quarterly Rebalancing (Every 3 Months)
**First Monday of quarter:**
1. Re-score entire universe
2. Identify new top 8
3. Calculate new weights

**Rebalancing Rules:**
- If stock drops out of top 8 → SELL ENTIRE POSITION
- If new stock enters top 8 → BUY FULL POSITION
- If stock remains but weight changes >3% → ADJUST
- If stock remains and weight changes <3% → NO ACTION

### Emergency Protocol
**Monthly pillar check:**
- If any holding scores 0 on any pillar → IMMEDIATE SALE
- Replace with next highest scorer
- No waiting for quarter-end

## Part 5: Practical Implementation Guide

### What You Need
1. **Data sources for each pillar:**
   - ROIC: Annual report or financial databases
   - Debt/EBITDA: Latest quarterly filing
   - Revenue CAGR: 3-year calculation
   - Rule of 40: Revenue growth + FCF margin
   - Gross margins: Latest quarter vs peers
   - ROE: Trailing twelve months
   - FCF margin: TTM free cash flow / revenue
   - Market share: Industry reports

2. **Universe definition:**
   - Option A: S&P 500 (easiest)
   - Option B: Russell 1000 (broader)
   - Option C: Global large caps (most opportunity)

3. **Scoring spreadsheet:**
   - Row per stock
   - Column per pillar
   - Auto-calculate total
   - Auto-rank

### The Quarterly Routine
**Time required: 4-6 hours per quarter**

**Hour 1-3:** Update pillar data for all stocks
**Hour 4:** Calculate scores
**Hour 5:** Rank and identify top 8
**Hour 6:** Calculate weights and place trades

### What You Never Do
- Never override the framework
- Never hold cash
- Never have 7 or 9 stocks
- Never "wait for a better price"
- Never check prices between quarters
- Never add diversity rules
- Never make exceptions

## Part 6: Example Quarter

### Q1 2025 Scoring Results (Hypothetical)

**Top 10 by score:**
1. NVDA: 61 points (Technology)
2. MSFT: 59 points (Technology)
3. GOOGL: 57 points (Technology)
4. MA: 56 points (Financials)
5. COST: 55 points (Consumer)
6. ASML: 54 points (Technology)
7. META: 53 points (Technology)
8. LLY: 52 points (Healthcare)
9. V: 51 points (Financials)
10. AVGO: 50 points (Technology)

**Your Portfolio:** NVDA, MSFT, GOOGL, MA, COST, ASML, META, LLY

**Weights:**
- NVDA: 31/292 = 18.8%
- MSFT: 29/292 = 17.1%
- GOOGL: 27/292 = 15.4%
- MA: 26/292 = 13.7%
- COST: 25/292 = 12.3%
- ASML: 24/292 = 10.3%
- META: 23/292 = 7.9%
- LLY: 22/292 = 4.5%

Note: 5 tech stocks, no problem. Framework decides.

## Part 7: Commitment Rules

By using this framework, you commit to:

1. **Trust the math:** Top 8 scorers become your portfolio
2. **No market timing:** Rebalance on schedule regardless of market conditions
3. **No optimization:** Don't try to "improve" the framework
4. **No exceptions:** If your favorite stock scores 9th, it's out
5. **No partial positions:** Either own per formula or don't own
6. **No selling between quarters:** Unless emergency protocol triggers
7. **No adding criteria:** 8 pillars are complete
8. **No human judgment:** The framework is the portfolio manager

## Conclusion

This is the complete 8x8 Framework. Nothing hidden, nothing missing, no escape hatches. 

8 pillars score stocks from 32-64 points. Top 8 become your portfolio. Weights determined by score. Rebalance quarterly.

The framework makes every decision. Your only job is to calculate scores and execute trades.

**Total simplicity through total discipline.**