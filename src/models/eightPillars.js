/**
 * Eight Pillars Framework Data Models
 * Comprehensive data structures for screening stocks against the Eight Pillars investment thesis
 */

/**
 * Individual Pillar Assessment
 * @typedef {Object} PillarAssessment
 * @property {boolean} passes - Whether the stock meets this pillar's criteria
 * @property {number} value - The actual calculated value
 * @property {number} threshold - The required threshold value
 * @property {string} trend - Trend direction: 'improving', 'stable', 'declining'
 * @property {number} percentile - Percentile ranking within sector/market
 * @property {string} details - Additional context or calculation details
 */

/**
 * Pillar 1: The Moat Test - ROIC > 20%
 * @typedef {Object} MoatMetrics
 * @property {number} roic - Return on Invested Capital (%)
 * @property {number} roic3YrAvg - 3-year average ROIC
 * @property {number} roic5YrAvg - 5-year average ROIC
 * @property {number} wacc - Weighted Average Cost of Capital
 * @property {number} roicSpread - ROIC minus WACC
 * @property {Array<{year: number, roic: number}>} roicHistory - Historical ROIC values
 * @property {PillarAssessment} assessment
 */

/**
 * Pillar 2: The Fortress Test - Debt-to-EBITDA < 2.5x
 * @typedef {Object} FortressMetrics
 * @property {number} debtToEbitda - Net Debt / EBITDA ratio
 * @property {number} netDebt - Total debt minus cash
 * @property {number} ebitda - Earnings Before Interest, Taxes, Depreciation, and Amortization
 * @property {number} interestCoverage - EBIT / Interest Expense
 * @property {string} creditRating - S&P/Moody's credit rating if available
 * @property {number} cashToDebt - Cash and equivalents / Total debt
 * @property {PillarAssessment} assessment
 */

/**
 * Pillar 3: The Engine Test - Revenue CAGR > 10%
 * @typedef {Object} EngineMetrics
 * @property {number} revenueCagr3Yr - 3-year revenue CAGR (%)
 * @property {number} revenueCagr5Yr - 5-year revenue CAGR (%)
 * @property {number} organicGrowth - Organic growth rate excluding acquisitions
 * @property {number} latestQuarterGrowth - Most recent quarter YoY growth
 * @property {Array<{year: number, revenue: number, growth: number}>} revenueHistory
 * @property {PillarAssessment} assessment
 */

/**
 * Pillar 4: The Efficiency Test - Rule of 40 > 40%
 * @typedef {Object} EfficiencyMetrics
 * @property {number} ruleOf40 - Revenue growth + EBITDA margin
 * @property {number} revenueGrowth - YoY revenue growth rate (%)
 * @property {number} ebitdaMargin - EBITDA / Revenue (%)
 * @property {number} fcfMargin - FCF / Revenue (%) alternative for mature companies
 * @property {string} preferredMetric - 'EBITDA' or 'FCF' based on company maturity
 * @property {PillarAssessment} assessment
 */

/**
 * Pillar 5: The Pricing Power Test - High Gross Margins
 * @typedef {Object} PricingPowerMetrics
 * @property {number} grossMargin - Gross profit / Revenue (%)
 * @property {number} grossMargin3YrAvg - 3-year average gross margin
 * @property {number} grossMarginTrend - Trend coefficient over 3 years
 * @property {number} industryMedian - Industry median gross margin
 * @property {number} industryPercentile - Position within industry
 * @property {Object} industryThresholds - Industry-specific thresholds
 * @property {string} @property industryThresholds.software - >70%
 * @property {string} @property industryThresholds.consumer - >50%
 * @property {string} @property industryThresholds.industrial - >35%
 * @property {PillarAssessment} assessment
 */

/**
 * Pillar 6: The Capital Allocation Test - ROE Improvement + Disciplined Buybacks
 * @typedef {Object} CapitalAllocationMetrics
 * @property {number} roe - Return on Equity (%)
 * @property {number} roe3YrAvg - 3-year average ROE
 * @property {number} roeTrend - ROE improvement trend
 * @property {number} buybackYield - Annual buyback as % of market cap
 * @property {number} averageBuybackPrice - Volume-weighted average buyback price
 * @property {number} insiderOwnership - Percentage owned by insiders
 * @property {number} totalPayoutRatio - (Dividends + Buybacks) / FCF
 * @property {Array<{year: number, roe: number, buybacks: number}>} history
 * @property {PillarAssessment} assessment
 */

/**
 * Pillar 7: The Cash Generation Test - FCF Margin > 15% + Conversion > 80%
 * @typedef {Object} CashGenerationMetrics
 * @property {number} fcfMargin - Free Cash Flow / Revenue (%)
 * @property {number} fcfConversion - FCF / Net Income (%)
 * @property {number} fcf - Free Cash Flow absolute value
 * @property {number} capexToRevenue - Capital expenditure as % of revenue
 * @property {number} workingCapitalEfficiency - Working capital / Revenue
 * @property {number} cashFlowStability - Standard deviation of FCF over 3 years
 * @property {PillarAssessment} assessment
 */

/**
 * Pillar 8: The Durability Test - Growing Market Share in Expanding TAMs
 * @typedef {Object} DurabilityMetrics
 * @property {number} marketShare - Current market share (%)
 * @property {number} marketShareChange - Change in market share over 3 years
 * @property {number} tamSize - Total Addressable Market size
 * @property {number} tamGrowthRate - TAM annual growth rate (%)
 * @property {string} competitivePosition - 'Leader', 'Challenger', 'Follower', 'Niche'
 * @property {Array<string>} secularTrends - Key secular trends benefiting the company
 * @property {number} customerRetention - Customer retention rate if available
 * @property {number} nps - Net Promoter Score if available
 * @property {PillarAssessment} assessment
 */

/**
 * Complete Eight Pillars Analysis for a Stock
 * @typedef {Object} EightPillarsAnalysis
 * @property {string} symbol - Stock ticker symbol
 * @property {string} companyName - Full company name
 * @property {string} sector - GICS sector classification
 * @property {string} industry - GICS industry classification
 * @property {Date} analysisDate - Date of analysis
 * @property {MoatMetrics} moat - Pillar 1 metrics
 * @property {FortressMetrics} fortress - Pillar 2 metrics
 * @property {EngineMetrics} engine - Pillar 3 metrics
 * @property {EfficiencyMetrics} efficiency - Pillar 4 metrics
 * @property {PricingPowerMetrics} pricingPower - Pillar 5 metrics
 * @property {CapitalAllocationMetrics} capitalAllocation - Pillar 6 metrics
 * @property {CashGenerationMetrics} cashGeneration - Pillar 7 metrics
 * @property {DurabilityMetrics} durability - Pillar 8 metrics
 * @property {EightPillarsSummary} summary - Overall assessment
 */

/**
 * Summary of Eight Pillars Assessment
 * @typedef {Object} EightPillarsSummary
 * @property {number} totalScore - Number of pillars passed (0-8)
 * @property {Array<string>} passedPillars - Names of pillars that passed
 * @property {Array<string>} failedPillars - Names of pillars that failed
 * @property {string} overallRating - 'Elite', 'Strong', 'Moderate', 'Weak'
 * @property {boolean} meetsFramework - True if meets 6+ pillars
 * @property {string} primaryStrength - Strongest pillar
 * @property {string} primaryWeakness - Weakest pillar
 * @property {number} confidenceScore - Data quality/completeness score (0-100)
 * @property {string} recommendation - 'Buy', 'Watch', 'Hold', 'Avoid'
 */

/**
 * Configuration for Eight Pillars Thresholds
 * @typedef {Object} EightPillarsConfig
 * @property {Object} thresholds
 * @property {number} thresholds.roic - Default: 20
 * @property {number} thresholds.debtToEbitda - Default: 2.5
 * @property {number} thresholds.revenueCagr - Default: 10
 * @property {number} thresholds.ruleOf40 - Default: 40
 * @property {Object} thresholds.grossMargin - Industry-specific
 * @property {number} thresholds.fcfMargin - Default: 15
 * @property {number} thresholds.fcfConversion - Default: 80
 * @property {Object} weights - Relative importance of each pillar
 * @property {number} minimumPillarsRequired - Default: 6
 */

/**
 * Screening Request Parameters
 * @typedef {Object} ScreeningRequest
 * @property {Array<string>} symbols - Stock symbols to screen
 * @property {Array<string>} sectors - Sectors to include
 * @property {number} minMarketCap - Minimum market capitalization
 * @property {number} minPillars - Minimum pillars to pass (default: 6)
 * @property {boolean} includePartialData - Include stocks with incomplete data
 * @property {string} sortBy - 'totalScore', 'roic', 'growth', etc.
 * @property {number} limit - Maximum results to return
 */

/**
 * Screening Result
 * @typedef {Object} ScreeningResult
 * @property {Array<EightPillarsAnalysis>} stocks - Analyzed stocks
 * @property {Object} statistics
 * @property {number} statistics.totalScreened - Total stocks screened
 * @property {number} statistics.totalPassed - Stocks meeting criteria
 * @property {number} statistics.averageScore - Average pillars passed
 * @property {Array<string>} statistics.topPerformers - Best scoring stocks
 * @property {Date} screeningDate
 */

// Export the model schemas for use in other modules
export const EightPillarsModels = {
  // Pillar-specific models
  MoatMetrics: 'MoatMetrics',
  FortressMetrics: 'FortressMetrics',
  EngineMetrics: 'EngineMetrics',
  EfficiencyMetrics: 'EfficiencyMetrics',
  PricingPowerMetrics: 'PricingPowerMetrics',
  CapitalAllocationMetrics: 'CapitalAllocationMetrics',
  CashGenerationMetrics: 'CashGenerationMetrics',
  DurabilityMetrics: 'DurabilityMetrics',
  
  // Composite models
  EightPillarsAnalysis: 'EightPillarsAnalysis',
  EightPillarsSummary: 'EightPillarsSummary',
  
  // Configuration and screening
  EightPillarsConfig: 'EightPillarsConfig',
  ScreeningRequest: 'ScreeningRequest',
  ScreeningResult: 'ScreeningResult'
};

// Default configuration values
export const DEFAULT_THRESHOLDS = {
  roic: 20,
  debtToEbitda: 2.5,
  revenueCagr: 10,
  ruleOf40: 40,
  grossMargin: {
    software: 70,
    consumer: 50,
    industrial: 35,
    financial: 40,
    healthcare: 60,
    energy: 30,
    utilities: 25,
    realestate: 35,
    materials: 30,
    communication: 45,
    default: 40
  },
  roe: 20,
  fcfMargin: 15,
  fcfConversion: 80,
  minimumPillarsRequired: 6
};

// Rating classifications based on pillars passed
export const RATING_CLASSIFICATIONS = {
  8: 'Elite Compounder',
  7: 'Strong Compounder',
  6: 'Quality Growth',
  5: 'Moderate Quality',
  4: 'Mixed Signals',
  3: 'Below Framework',
  2: 'Weak Fundamentals',
  1: 'Poor Quality',
  0: 'Avoid'
};

// Pillar names for display
export const PILLAR_NAMES = {
  moat: 'Moat Test (ROIC > 20%)',
  fortress: 'Fortress Test (Debt/EBITDA < 2.5x)',
  engine: 'Engine Test (Revenue CAGR > 10%)',
  efficiency: 'Efficiency Test (Rule of 40)',
  pricingPower: 'Pricing Power Test (Gross Margins)',
  capitalAllocation: 'Capital Allocation Test (ROE + Buybacks)',
  cashGeneration: 'Cash Generation Test (FCF)',
  durability: 'Durability Test (Market Share + TAM)'
};