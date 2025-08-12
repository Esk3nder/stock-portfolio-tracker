/**
 * Eight Pillars Calculation Engine
 * Core logic for analyzing stocks against the Eight Pillars Framework
 */

import financialDataService from './financialDataService';
import { 
  DEFAULT_THRESHOLDS, 
  RATING_CLASSIFICATIONS,
  PILLAR_NAMES 
} from '../models/eightPillars';

class EightPillarsEngine {
  constructor() {
    this.thresholds = DEFAULT_THRESHOLDS;
  }

  /**
   * Analyze a single stock against all Eight Pillars
   * @param {string} symbol - Stock ticker symbol
   * @returns {Promise<EightPillarsAnalysis>}
   */
  async analyzeStock(symbol) {
    try {
      // Fetch comprehensive financial data
      const financials = await financialDataService.getComprehensiveFinancials(symbol);
      
      if (!this.validateFinancialData(financials)) {
        throw new Error(`Insufficient financial data for ${symbol}`);
      }

      // Calculate each pillar
      const analysis = {
        symbol,
        companyName: financials.keyMetrics?.companyName || symbol,
        sector: financials.keyMetrics?.sector || 'Unknown',
        industry: financials.keyMetrics?.industry || 'Unknown',
        analysisDate: new Date(),
        
        // Calculate all eight pillars
        moat: this.calculateMoatMetrics(financials),
        fortress: this.calculateFortressMetrics(financials),
        engine: this.calculateEngineMetrics(financials),
        efficiency: this.calculateEfficiencyMetrics(financials),
        pricingPower: this.calculatePricingPowerMetrics(financials),
        capitalAllocation: this.calculateCapitalAllocationMetrics(financials),
        cashGeneration: this.calculateCashGenerationMetrics(financials),
        durability: this.calculateDurabilityMetrics(financials),
        
        // Calculate summary
        summary: null // Will be calculated after all pillars
      };

      // Calculate summary based on pillar results
      analysis.summary = this.calculateSummary(analysis);

      return analysis;
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Pillar 1: The Moat Test - ROIC > 20%
   */
  calculateMoatMetrics(financials) {
    const metrics = {
      roic: 0,
      roic3YrAvg: 0,
      roic5YrAvg: 0,
      wacc: 8, // Default WACC assumption
      roicSpread: 0,
      roicHistory: [],
      assessment: null
    };

    try {
      // Calculate ROIC for each available year
      if (financials.incomeStatement && financials.balanceSheet) {
        const roicValues = [];
        
        for (let i = 0; i < Math.min(5, financials.incomeStatement.length); i++) {
          const income = financials.incomeStatement[i];
          const balance = financials.balanceSheet[i];
          
          if (income && balance) {
            // ROIC = NOPAT / Invested Capital
            const taxRate = income.incomeTax ? income.incomeTax / income.ebit : 0.21; // Default 21% if not available
            const nopat = income.ebit * (1 - taxRate);
            const investedCapital = balance.totalAssets - balance.cashAndEquivalents - 
                                   (balance.currentLiabilities || 0) + (balance.totalDebt || 0);
            
            if (investedCapital > 0) {
              const roic = (nopat / investedCapital) * 100;
              roicValues.push(roic);
              metrics.roicHistory.push({
                year: income.fiscalYear,
                roic: roic
              });
            }
          }
        }

        // Calculate current and average ROIC
        if (roicValues.length > 0) {
          metrics.roic = roicValues[0]; // Most recent year
          metrics.roic3YrAvg = this.calculateAverage(roicValues.slice(0, 3));
          metrics.roic5YrAvg = this.calculateAverage(roicValues);
        }
      }

      // Alternative calculation using key metrics if available
      if (financials.keyMetrics?.roic) {
        metrics.roic = financials.keyMetrics.roic * 100;
      }

      // Calculate ROIC spread
      metrics.roicSpread = metrics.roic - metrics.wacc;

      // Assess the pillar
      metrics.assessment = {
        passes: metrics.roic > this.thresholds.roic,
        value: metrics.roic,
        threshold: this.thresholds.roic,
        trend: this.calculateTrend(metrics.roicHistory.map(h => h.roic)),
        percentile: this.calculatePercentile(metrics.roic, 'roic'),
        details: `ROIC of ${metrics.roic.toFixed(1)}% vs threshold of ${this.thresholds.roic}%`
      };
    } catch (error) {
      console.error('Error calculating MOAT metrics:', error);
    }

    return metrics;
  }

  /**
   * Pillar 2: The Fortress Test - Debt-to-EBITDA < 2.5x
   */
  calculateFortressMetrics(financials) {
    const metrics = {
      debtToEbitda: 0,
      netDebt: 0,
      ebitda: 0,
      interestCoverage: 0,
      creditRating: 'N/A',
      cashToDebt: 0,
      assessment: null
    };

    try {
      if (financials.balanceSheet && financials.incomeStatement) {
        const balance = financials.balanceSheet[0]; // Most recent
        const income = financials.incomeStatement[0];
        
        // Calculate net debt
        metrics.netDebt = (balance.totalDebt || 0) - (balance.cashAndEquivalents || 0);
        
        // Get EBITDA
        metrics.ebitda = income.ebitda || (income.ebit + (income.depreciation || 0));
        
        // Calculate debt-to-EBITDA
        if (metrics.ebitda > 0) {
          metrics.debtToEbitda = metrics.netDebt / metrics.ebitda;
        }
        
        // Calculate interest coverage
        if (income.interestExpense && income.interestExpense > 0) {
          metrics.interestCoverage = income.ebit / income.interestExpense;
        }
        
        // Calculate cash to debt ratio
        if (balance.totalDebt > 0) {
          metrics.cashToDebt = balance.cashAndEquivalents / balance.totalDebt;
        }
      }

      // Assess the pillar
      metrics.assessment = {
        passes: metrics.debtToEbitda < this.thresholds.debtToEbitda && metrics.debtToEbitda >= 0,
        value: metrics.debtToEbitda,
        threshold: this.thresholds.debtToEbitda,
        trend: 'stable', // Would need historical data to determine trend
        percentile: this.calculatePercentile(metrics.debtToEbitda, 'debtToEbitda', true), // Lower is better
        details: `Debt/EBITDA of ${metrics.debtToEbitda.toFixed(2)}x vs threshold of ${this.thresholds.debtToEbitda}x`
      };
    } catch (error) {
      console.error('Error calculating FORTRESS metrics:', error);
    }

    return metrics;
  }

  /**
   * Pillar 3: The Engine Test - Revenue CAGR > 10%
   */
  calculateEngineMetrics(financials) {
    const metrics = {
      revenueCagr3Yr: 0,
      revenueCagr5Yr: 0,
      organicGrowth: 0,
      latestQuarterGrowth: 0,
      revenueHistory: [],
      assessment: null
    };

    try {
      if (financials.incomeStatement && financials.incomeStatement.length > 1) {
        // Build revenue history
        for (const statement of financials.incomeStatement) {
          if (statement.revenue) {
            metrics.revenueHistory.push({
              year: statement.fiscalYear,
              revenue: statement.revenue,
              growth: 0 // Will calculate YoY growth
            });
          }
        }

        // Calculate YoY growth rates
        for (let i = 0; i < metrics.revenueHistory.length - 1; i++) {
          const current = metrics.revenueHistory[i].revenue;
          const previous = metrics.revenueHistory[i + 1].revenue;
          if (previous > 0) {
            metrics.revenueHistory[i].growth = ((current - previous) / previous) * 100;
          }
        }

        // Calculate CAGR
        if (metrics.revenueHistory.length >= 3) {
          const threeYearAgo = metrics.revenueHistory[Math.min(2, metrics.revenueHistory.length - 1)];
          metrics.revenueCagr3Yr = financialDataService.calculateCAGR(
            threeYearAgo.revenue,
            metrics.revenueHistory[0].revenue,
            3
          );
        }

        if (metrics.revenueHistory.length >= 5) {
          const fiveYearAgo = metrics.revenueHistory[Math.min(4, metrics.revenueHistory.length - 1)];
          metrics.revenueCagr5Yr = financialDataService.calculateCAGR(
            fiveYearAgo.revenue,
            metrics.revenueHistory[0].revenue,
            5
          );
        }

        // Use 3-year CAGR as primary metric, fallback to latest growth
        metrics.organicGrowth = metrics.revenueCagr3Yr || metrics.revenueHistory[0]?.growth || 0;
      }

      // Use growth data if available
      if (financials.growth && financials.growth.length > 0) {
        metrics.latestQuarterGrowth = financials.growth[0].revenueGrowth * 100;
      }

      // Assess the pillar
      const revenueGrowth = metrics.revenueCagr3Yr || metrics.revenueCagr5Yr || metrics.latestQuarterGrowth;
      metrics.assessment = {
        passes: revenueGrowth > this.thresholds.revenueCagr,
        value: revenueGrowth,
        threshold: this.thresholds.revenueCagr,
        trend: this.calculateTrend(metrics.revenueHistory.map(h => h.growth)),
        percentile: this.calculatePercentile(revenueGrowth, 'revenueGrowth'),
        details: `Revenue CAGR of ${revenueGrowth.toFixed(1)}% vs threshold of ${this.thresholds.revenueCagr}%`
      };
    } catch (error) {
      console.error('Error calculating ENGINE metrics:', error);
    }

    return metrics;
  }

  /**
   * Pillar 4: The Efficiency Test - Rule of 40 > 40%
   */
  calculateEfficiencyMetrics(financials) {
    const metrics = {
      ruleOf40: 0,
      revenueGrowth: 0,
      ebitdaMargin: 0,
      fcfMargin: 0,
      preferredMetric: 'EBITDA',
      assessment: null
    };

    try {
      if (financials.incomeStatement && financials.incomeStatement.length > 0) {
        const income = financials.incomeStatement[0];
        
        // Calculate revenue growth
        if (financials.incomeStatement.length > 1) {
          const previousRevenue = financials.incomeStatement[1].revenue;
          if (previousRevenue > 0) {
            metrics.revenueGrowth = ((income.revenue - previousRevenue) / previousRevenue) * 100;
          }
        }
        
        // Calculate EBITDA margin
        if (income.revenue > 0) {
          const ebitda = income.ebitda || (income.ebit + (income.depreciation || 0));
          metrics.ebitdaMargin = (ebitda / income.revenue) * 100;
        }
        
        // Calculate FCF margin for mature companies
        if (financials.cashFlow && financials.cashFlow.length > 0) {
          const cashflow = financials.cashFlow[0];
          if (income.revenue > 0 && cashflow.freeCashFlow) {
            metrics.fcfMargin = (cashflow.freeCashFlow / income.revenue) * 100;
          }
        }
        
        // Determine which metric to use (FCF for mature, EBITDA for growth)
        if (metrics.revenueGrowth < 15 && metrics.fcfMargin > 0) {
          metrics.preferredMetric = 'FCF';
          metrics.ruleOf40 = metrics.revenueGrowth + metrics.fcfMargin;
        } else {
          metrics.ruleOf40 = metrics.revenueGrowth + metrics.ebitdaMargin;
        }
      }

      // Assess the pillar
      metrics.assessment = {
        passes: metrics.ruleOf40 > this.thresholds.ruleOf40,
        value: metrics.ruleOf40,
        threshold: this.thresholds.ruleOf40,
        trend: 'stable',
        percentile: this.calculatePercentile(metrics.ruleOf40, 'ruleOf40'),
        details: `Rule of 40: ${metrics.ruleOf40.toFixed(1)}% (${metrics.revenueGrowth.toFixed(1)}% growth + ${metrics.preferredMetric === 'FCF' ? metrics.fcfMargin.toFixed(1) : metrics.ebitdaMargin.toFixed(1)}% margin)`
      };
    } catch (error) {
      console.error('Error calculating EFFICIENCY metrics:', error);
    }

    return metrics;
  }

  /**
   * Pillar 5: The Pricing Power Test - High Gross Margins
   */
  calculatePricingPowerMetrics(financials) {
    const metrics = {
      grossMargin: 0,
      grossMargin3YrAvg: 0,
      grossMarginTrend: 0,
      industryMedian: 0,
      industryPercentile: 0,
      industryThresholds: {},
      assessment: null
    };

    try {
      const sector = financials.keyMetrics?.sector || 'default';
      const grossMargins = [];

      if (financials.incomeStatement && financials.incomeStatement.length > 0) {
        // Calculate gross margins for available years
        for (const statement of financials.incomeStatement) {
          if (statement.revenue > 0 && statement.grossProfit) {
            const margin = (statement.grossProfit / statement.revenue) * 100;
            grossMargins.push(margin);
          }
        }

        if (grossMargins.length > 0) {
          metrics.grossMargin = grossMargins[0]; // Most recent
          metrics.grossMargin3YrAvg = this.calculateAverage(grossMargins.slice(0, 3));
          metrics.grossMarginTrend = this.calculateTrend(grossMargins);
        }
      }

      // Alternative from ratios
      if (financials.ratios?.grossMargin) {
        metrics.grossMargin = financials.ratios.grossMargin * 100;
      }

      // Get industry-specific thresholds
      metrics.industryThresholds = this.thresholds.grossMargin;
      const industryThreshold = financialDataService.getIndustryThresholds(sector);

      // Assess the pillar
      metrics.assessment = {
        passes: metrics.grossMargin > industryThreshold,
        value: metrics.grossMargin,
        threshold: industryThreshold,
        trend: metrics.grossMarginTrend > 0 ? 'improving' : metrics.grossMarginTrend < 0 ? 'declining' : 'stable',
        percentile: this.calculatePercentile(metrics.grossMargin, 'grossMargin', false, sector),
        details: `Gross margin of ${metrics.grossMargin.toFixed(1)}% vs ${sector} threshold of ${industryThreshold}%`
      };
    } catch (error) {
      console.error('Error calculating PRICING POWER metrics:', error);
    }

    return metrics;
  }

  /**
   * Pillar 6: The Capital Allocation Test - ROE Improvement + Disciplined Buybacks
   */
  calculateCapitalAllocationMetrics(financials) {
    const metrics = {
      roe: 0,
      roe3YrAvg: 0,
      roeTrend: 0,
      buybackYield: 0,
      averageBuybackPrice: 0,
      insiderOwnership: 0,
      totalPayoutRatio: 0,
      history: [],
      assessment: null
    };

    try {
      const roeValues = [];
      
      if (financials.incomeStatement && financials.balanceSheet) {
        // Calculate ROE for each available year
        for (let i = 0; i < Math.min(5, financials.incomeStatement.length); i++) {
          const income = financials.incomeStatement[i];
          const balance = financials.balanceSheet[i];
          
          if (income.netIncome && balance.shareholderEquity > 0) {
            const roe = (income.netIncome / balance.shareholderEquity) * 100;
            roeValues.push(roe);
            
            // Add to history with buyback data if available
            const buybacks = financials.cashFlow?.[i]?.stockRepurchased || 0;
            metrics.history.push({
              year: income.fiscalYear,
              roe: roe,
              buybacks: buybacks
            });
          }
        }

        if (roeValues.length > 0) {
          metrics.roe = roeValues[0]; // Most recent
          metrics.roe3YrAvg = this.calculateAverage(roeValues.slice(0, 3));
          metrics.roeTrend = this.calculateTrend(roeValues);
        }
      }

      // Alternative from key metrics
      if (financials.keyMetrics?.returnOnEquity) {
        metrics.roe = financials.keyMetrics.returnOnEquity * 100;
      }

      // Calculate buyback yield
      if (financials.cashFlow && financials.cashFlow.length > 0 && financials.quote) {
        const buybacks = financials.cashFlow[0].stockRepurchased || 0;
        const marketCap = financials.keyMetrics?.marketCap || 
                         (financials.quote.price * financials.balanceSheet[0].sharesOutstanding);
        
        if (marketCap > 0) {
          metrics.buybackYield = (buybacks / marketCap) * 100;
        }
      }

      // Calculate total payout ratio
      if (financials.cashFlow && financials.cashFlow.length > 0) {
        const cashflow = financials.cashFlow[0];
        const totalPayout = (cashflow.dividendsPaid || 0) + (cashflow.stockRepurchased || 0);
        const fcf = cashflow.freeCashFlow || 0;
        
        if (fcf > 0) {
          metrics.totalPayoutRatio = (totalPayout / fcf) * 100;
        }
      }

      // Assess the pillar (ROE > 20% and improving, plus disciplined buybacks)
      const roeImproving = metrics.roeTrend > 0 || metrics.roe > metrics.roe3YrAvg;
      const disciplinedBuybacks = metrics.buybackYield > 0 && metrics.buybackYield < 5; // Not excessive
      
      metrics.assessment = {
        passes: metrics.roe > this.thresholds.roe && (roeImproving || disciplinedBuybacks),
        value: metrics.roe,
        threshold: this.thresholds.roe,
        trend: metrics.roeTrend > 0 ? 'improving' : metrics.roeTrend < 0 ? 'declining' : 'stable',
        percentile: this.calculatePercentile(metrics.roe, 'roe'),
        details: `ROE of ${metrics.roe.toFixed(1)}% (${roeImproving ? 'improving' : 'stable'}), Buyback yield: ${metrics.buybackYield.toFixed(1)}%`
      };
    } catch (error) {
      console.error('Error calculating CAPITAL ALLOCATION metrics:', error);
    }

    return metrics;
  }

  /**
   * Pillar 7: The Cash Generation Test - FCF Margin > 15% + Conversion > 80%
   */
  calculateCashGenerationMetrics(financials) {
    const metrics = {
      fcfMargin: 0,
      fcfConversion: 0,
      fcf: 0,
      capexToRevenue: 0,
      workingCapitalEfficiency: 0,
      cashFlowStability: 0,
      assessment: null
    };

    try {
      if (financials.cashFlow && financials.incomeStatement && 
          financials.cashFlow.length > 0 && financials.incomeStatement.length > 0) {
        
        const cashflow = financials.cashFlow[0];
        const income = financials.incomeStatement[0];
        
        // Get FCF
        metrics.fcf = cashflow.freeCashFlow || 
                     (cashflow.operatingCashFlow - cashflow.capitalExpenditures);
        
        // Calculate FCF margin
        if (income.revenue > 0) {
          metrics.fcfMargin = (metrics.fcf / income.revenue) * 100;
        }
        
        // Calculate FCF conversion (FCF / Net Income)
        if (income.netIncome > 0) {
          metrics.fcfConversion = (metrics.fcf / income.netIncome) * 100;
        }
        
        // Calculate CapEx to revenue
        if (income.revenue > 0) {
          metrics.capexToRevenue = (cashflow.capitalExpenditures / income.revenue) * 100;
        }
        
        // Calculate cash flow stability (std dev of FCF over available years)
        const fcfValues = [];
        for (let i = 0; i < Math.min(3, financials.cashFlow.length); i++) {
          const cf = financials.cashFlow[i];
          const fcf = cf.freeCashFlow || (cf.operatingCashFlow - cf.capitalExpenditures);
          fcfValues.push(fcf);
        }
        
        if (fcfValues.length > 1) {
          metrics.cashFlowStability = this.calculateStandardDeviation(fcfValues);
        }
      }

      // Assess the pillar
      const passesFCFMargin = metrics.fcfMargin > this.thresholds.fcfMargin;
      const passesConversion = metrics.fcfConversion > this.thresholds.fcfConversion;
      
      metrics.assessment = {
        passes: passesFCFMargin && passesConversion,
        value: metrics.fcfMargin,
        threshold: this.thresholds.fcfMargin,
        trend: 'stable',
        percentile: this.calculatePercentile(metrics.fcfMargin, 'fcfMargin'),
        details: `FCF margin: ${metrics.fcfMargin.toFixed(1)}% (threshold: ${this.thresholds.fcfMargin}%), Conversion: ${metrics.fcfConversion.toFixed(0)}% (threshold: ${this.thresholds.fcfConversion}%)`
      };
    } catch (error) {
      console.error('Error calculating CASH GENERATION metrics:', error);
    }

    return metrics;
  }

  /**
   * Pillar 8: The Durability Test - Growing Market Share in Expanding TAMs
   */
  calculateDurabilityMetrics(financials) {
    const metrics = {
      marketShare: 0,
      marketShareChange: 0,
      tamSize: 0,
      tamGrowthRate: 0,
      competitivePosition: 'Unknown',
      secularTrends: [],
      customerRetention: 0,
      nps: 0,
      assessment: null
    };

    try {
      // This pillar requires external data sources that aren't typically in financial statements
      // We'll use revenue growth as a proxy for market share gains
      
      if (financials.incomeStatement && financials.incomeStatement.length > 2) {
        const currentRevenue = financials.incomeStatement[0].revenue;
        const threeYearAgoRevenue = financials.incomeStatement[Math.min(2, financials.incomeStatement.length - 1)].revenue;
        
        // If company is growing faster than 10% CAGR, assume gaining share
        const cagr = financialDataService.calculateCAGR(threeYearAgoRevenue, currentRevenue, 3);
        
        if (cagr > 15) {
          metrics.competitivePosition = 'Leader';
          metrics.marketShareChange = 2; // Assuming 2% share gain
        } else if (cagr > 10) {
          metrics.competitivePosition = 'Challenger';
          metrics.marketShareChange = 1;
        } else if (cagr > 5) {
          metrics.competitivePosition = 'Follower';
          metrics.marketShareChange = 0;
        } else {
          metrics.competitivePosition = 'Niche';
          metrics.marketShareChange = -1;
        }
      }

      // Identify secular trends based on sector
      const sector = financials.keyMetrics?.sector || '';
      if (sector.toLowerCase().includes('tech') || sector.toLowerCase().includes('software')) {
        metrics.secularTrends = ['Digital Transformation', 'Cloud Computing', 'AI/ML'];
        metrics.tamGrowthRate = 15; // Assume high TAM growth for tech
      } else if (sector.toLowerCase().includes('health')) {
        metrics.secularTrends = ['Aging Demographics', 'Healthcare Innovation'];
        metrics.tamGrowthRate = 10;
      } else if (sector.toLowerCase().includes('consumer')) {
        metrics.secularTrends = ['E-commerce', 'Sustainability'];
        metrics.tamGrowthRate = 8;
      } else {
        metrics.secularTrends = ['General Economic Growth'];
        metrics.tamGrowthRate = 5;
      }

      // Assess the pillar (simplified - need external data for accurate assessment)
      const growingShare = metrics.marketShareChange > 0;
      const expandingTAM = metrics.tamGrowthRate > 7;
      
      metrics.assessment = {
        passes: growingShare && expandingTAM,
        value: metrics.marketShareChange,
        threshold: 0, // Positive change required
        trend: metrics.marketShareChange > 0 ? 'improving' : 'declining',
        percentile: 50, // Default without comparative data
        details: `${metrics.competitivePosition} position with ${metrics.tamGrowthRate}% TAM growth`
      };
    } catch (error) {
      console.error('Error calculating DURABILITY metrics:', error);
    }

    return metrics;
  }

  /**
   * Calculate overall summary based on all pillars
   */
  calculateSummary(analysis) {
    const passedPillars = [];
    const failedPillars = [];
    let totalScore = 0;

    // Check each pillar
    const pillars = [
      { name: 'moat', display: PILLAR_NAMES.moat, data: analysis.moat },
      { name: 'fortress', display: PILLAR_NAMES.fortress, data: analysis.fortress },
      { name: 'engine', display: PILLAR_NAMES.engine, data: analysis.engine },
      { name: 'efficiency', display: PILLAR_NAMES.efficiency, data: analysis.efficiency },
      { name: 'pricingPower', display: PILLAR_NAMES.pricingPower, data: analysis.pricingPower },
      { name: 'capitalAllocation', display: PILLAR_NAMES.capitalAllocation, data: analysis.capitalAllocation },
      { name: 'cashGeneration', display: PILLAR_NAMES.cashGeneration, data: analysis.cashGeneration },
      { name: 'durability', display: PILLAR_NAMES.durability, data: analysis.durability }
    ];

    for (const pillar of pillars) {
      if (pillar.data.assessment?.passes) {
        passedPillars.push(pillar.display);
        totalScore++;
      } else {
        failedPillars.push(pillar.display);
      }
    }

    // Find strongest and weakest pillars
    let primaryStrength = '';
    let primaryWeakness = '';
    let maxValue = -Infinity;
    let minValue = Infinity;

    for (const pillar of pillars) {
      const value = pillar.data.assessment?.value || 0;
      const threshold = pillar.data.assessment?.threshold || 1;
      const ratio = threshold > 0 ? value / threshold : 0;
      
      if (ratio > maxValue) {
        maxValue = ratio;
        primaryStrength = pillar.display;
      }
      if (ratio < minValue) {
        minValue = ratio;
        primaryWeakness = pillar.display;
      }
    }

    // Determine overall rating
    const overallRating = RATING_CLASSIFICATIONS[totalScore] || 'Unknown';
    
    // Determine recommendation
    let recommendation = 'Hold';
    if (totalScore >= 7) {
      recommendation = 'Strong Buy';
    } else if (totalScore >= 6) {
      recommendation = 'Buy';
    } else if (totalScore >= 4) {
      recommendation = 'Watch';
    } else if (totalScore < 3) {
      recommendation = 'Avoid';
    }

    // Calculate confidence score based on data completeness
    let dataPoints = 0;
    let availablePoints = 0;
    for (const pillar of pillars) {
      if (pillar.data.assessment) {
        availablePoints++;
        if (pillar.data.assessment.value !== 0) {
          dataPoints++;
        }
      }
    }
    const confidenceScore = (dataPoints / 8) * 100;

    return {
      totalScore,
      passedPillars,
      failedPillars,
      overallRating,
      meetsFramework: totalScore >= this.thresholds.minimumPillarsRequired,
      primaryStrength,
      primaryWeakness,
      confidenceScore,
      recommendation
    };
  }

  /**
   * Screen multiple stocks against the Eight Pillars
   */
  async screenStocks(symbols, options = {}) {
    const {
      minPillars = this.thresholds.minimumPillarsRequired,
      includePartialData = false,
      sortBy = 'totalScore',
      limit = 50
    } = options;

    const results = {
      stocks: [],
      statistics: {
        totalScreened: symbols.length,
        totalPassed: 0,
        averageScore: 0,
        topPerformers: []
      },
      screeningDate: new Date()
    };

    // Analyze each stock
    for (const symbol of symbols) {
      try {
        const analysis = await this.analyzeStock(symbol);
        
        // Filter based on criteria
        if (analysis.summary.totalScore >= minPillars || includePartialData) {
          results.stocks.push(analysis);
          
          if (analysis.summary.meetsFramework) {
            results.statistics.totalPassed++;
          }
        }
      } catch (error) {
        console.error(`Failed to analyze ${symbol}:`, error);
      }
    }

    // Sort results
    results.stocks.sort((a, b) => {
      switch (sortBy) {
        case 'totalScore':
          return b.summary.totalScore - a.summary.totalScore;
        case 'roic':
          return b.moat.roic - a.moat.roic;
        case 'growth':
          return b.engine.revenueCagr3Yr - a.engine.revenueCagr3Yr;
        default:
          return b.summary.totalScore - a.summary.totalScore;
      }
    });

    // Apply limit
    if (limit && results.stocks.length > limit) {
      results.stocks = results.stocks.slice(0, limit);
    }

    // Calculate statistics
    if (results.stocks.length > 0) {
      const totalScores = results.stocks.map(s => s.summary.totalScore);
      results.statistics.averageScore = this.calculateAverage(totalScores);
      results.statistics.topPerformers = results.stocks
        .slice(0, 5)
        .map(s => `${s.symbol} (${s.summary.totalScore}/8)`);
    }

    return results;
  }

  /**
   * Validate that we have sufficient financial data
   */
  validateFinancialData(financials) {
    return !!(
      financials &&
      financials.incomeStatement &&
      financials.incomeStatement.length > 0 &&
      (financials.balanceSheet || financials.keyMetrics || financials.ratios)
    );
  }

  /**
   * Helper: Calculate trend (positive, negative, or neutral)
   */
  calculateTrend(values) {
    if (!values || values.length < 2) return 'stable';
    
    // Simple linear regression slope
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.5) return 'improving';
    if (slope < -0.5) return 'declining';
    return 'stable';
  }

  /**
   * Helper: Calculate average
   */
  calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Helper: Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    if (!values || values.length < 2) return 0;
    
    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateAverage(squaredDiffs);
    
    return Math.sqrt(variance);
  }

  /**
   * Helper: Calculate percentile (simplified - would need market data for accuracy)
   */
  calculatePercentile(value, metric, lowerIsBetter = false, sector = null) {
    // Simplified percentile calculation based on typical ranges
    const ranges = {
      roic: { min: -10, max: 50, median: 15 },
      debtToEbitda: { min: 0, max: 10, median: 3 },
      revenueGrowth: { min: -20, max: 100, median: 10 },
      ruleOf40: { min: 0, max: 100, median: 30 },
      grossMargin: { min: 10, max: 90, median: 40 },
      roe: { min: -20, max: 50, median: 15 },
      fcfMargin: { min: -10, max: 40, median: 10 }
    };
    
    const range = ranges[metric] || { min: 0, max: 100, median: 50 };
    
    if (lowerIsBetter) {
      // For metrics where lower is better (like debt ratios)
      if (value <= range.min) return 100;
      if (value >= range.max) return 0;
      return 100 - ((value - range.min) / (range.max - range.min)) * 100;
    } else {
      // For metrics where higher is better
      if (value <= range.min) return 0;
      if (value >= range.max) return 100;
      return ((value - range.min) / (range.max - range.min)) * 100;
    }
  }

  /**
   * Update configuration thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

// Export singleton instance
const eightPillarsEngine = new EightPillarsEngine();
export default eightPillarsEngine;