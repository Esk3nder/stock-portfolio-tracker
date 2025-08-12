# Eight Pillars Stock Analyzer Guide

## Quick Start

```bash
# Analyze any stock
node analyze-stock.js NVDA

# Analyze multiple stocks
node analyze-stock.js AAPL MSFT GOOGL

# View statistics
node analyze-stock.js --stats
```

## What It Does

This tool:
1. **Fetches** real financial data for any stock ticker
2. **Calculates** Eight Pillars investment metrics
3. **Stores** results in a local database
4. **Tracks** quality stocks in a watchlist
5. **Exports** data for further analysis

## The Eight Pillars

| Pillar | Metric | Threshold | What It Measures |
|--------|--------|-----------|------------------|
| 1. Moat | ROIC | >20% | Competitive advantage |
| 2. Fortress | Debt/EBITDA | <2.5x | Financial strength |
| 3. Engine | Revenue CAGR | >10% | Growth momentum |
| 4. Efficiency | Rule of 40 | >40% | Growth + profitability |
| 5. Pricing Power | Gross Margin | Varies | Pricing strength |
| 6. Capital Allocation | ROE | >20% | Management quality |
| 7. Cash Generation | FCF Margin | >15% | Cash efficiency |
| 8. Durability | Market Position | Qualitative | Long-term viability |

## Commands

### Analysis
```bash
node analyze-stock.js TICKER         # Single stock
node analyze-stock.js T1 T2 T3       # Multiple stocks
```

### Management
```bash
node analyze-stock.js --watchlist    # View watchlist
node analyze-stock.js --portfolio    # View portfolio
node analyze-stock.js --stats        # View statistics
```

### Portfolio
```bash
node analyze-stock.js --add-portfolio AAPL 100 250.50
# Adds 100 shares of AAPL at $250.50
```

## Data Storage

All data is stored locally in `eight-pillars-data/`:
- `database.json` - Central database
- `TICKER_analysis_DATE.json` - Analysis results
- `TICKER_raw_DATE.json` - Raw API data
- `export_DATE.csv` - CSV exports

## Quality Ratings

- **7-8 pillars**: Strong Compounder ✅
- **6 pillars**: Quality Growth ✅
- **4-5 pillars**: Mixed Signals ⚠️
- **<4 pillars**: Weak Fundamentals ❌

## Example Results

Recent analyses:
- **NVDA**: 7/8 pillars - Strong Compounder
- **V (Visa)**: 7/8 pillars - Strong Compounder
- **GOOGL**: 6/8 pillars - Quality Growth
- **AAPL**: 4/8 pillars - Mixed Signals
- **TSLA**: 1/8 pillars - Weak Fundamentals

## Tips

1. Quality stocks (6+ pillars) are automatically flagged
2. The tool prompts to add quality stocks to watchlist
3. All historical analyses are preserved
4. Export to CSV for Excel analysis
5. Free API tier allows 250 calls/day