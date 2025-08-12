/**
 * Eight Pillars Guide Component
 * Educational guide explaining the Eight Pillars Framework
 */

import React, { useState } from 'react';
import './EightPillarsGuide.css';

const EightPillarsGuide = () => {
  const [selectedPillar, setSelectedPillar] = useState(null);

  const pillars = [
    {
      id: 'moat',
      number: 1,
      name: 'The Moat Test',
      metric: 'ROIC > 20%',
      icon: '🏰',
      description: 'Return on Invested Capital measures how efficiently a company uses investor money to generate profits.',
      why: 'A sustained ROIC above 20% indicates a strong economic moat that protects the business from competition.',
      calculation: 'ROIC = NOPAT / Invested Capital',
      example: 'Microsoft consistently achieves 30%+ ROIC due to its software monopoly and subscription model.',
      threshold: '20% (2x typical cost of capital)',
      interpretation: {
        excellent: '> 30%: Exceptional moat, monopolistic positioning',
        good: '20-30%: Strong competitive advantages',
        poor: '< 20%: Weak or no moat'
      }
    },
    {
      id: 'fortress',
      number: 2,
      name: 'The Fortress Test',
      metric: 'Debt-to-EBITDA < 2.5x',
      icon: '🛡️',
      description: 'Measures financial leverage and the company\'s ability to pay off debt.',
      why: 'Low debt ensures survival during downturns and flexibility for growth opportunities.',
      calculation: 'Debt-to-EBITDA = Net Debt / EBITDA',
      example: 'Apple maintains near-zero net debt despite massive cash generation.',
      threshold: '< 2.5x',
      interpretation: {
        excellent: '< 1x: Fortress balance sheet',
        good: '1-2.5x: Healthy leverage',
        poor: '> 2.5x: Risky debt levels'
      }
    },
    {
      id: 'engine',
      number: 3,
      name: 'The Engine Test',
      metric: 'Revenue CAGR > 10%',
      icon: '🚀',
      description: 'Compound Annual Growth Rate of revenue over 3-5 years.',
      why: 'Sustainable revenue growth drives long-term value creation.',
      calculation: 'CAGR = (Ending Value / Beginning Value)^(1/Years) - 1',
      example: 'Amazon grew revenue at 20%+ CAGR for two decades.',
      threshold: '> 10% (3x GDP growth)',
      interpretation: {
        excellent: '> 20%: Hypergrowth',
        good: '10-20%: Strong growth',
        poor: '< 10%: Slow or no growth'
      }
    },
    {
      id: 'efficiency',
      number: 4,
      name: 'The Efficiency Test',
      metric: 'Rule of 40 > 40%',
      icon: '⚡',
      description: 'Sum of revenue growth rate and profit margin.',
      why: 'Balances growth and profitability for optimal value creation.',
      calculation: 'Rule of 40 = Revenue Growth % + EBITDA Margin %',
      example: 'Salesforce: 20% growth + 25% margin = 45% (passes)',
      threshold: '> 40%',
      interpretation: {
        excellent: '> 50%: Elite efficiency',
        good: '40-50%: Well-balanced',
        poor: '< 40%: Inefficient growth'
      }
    },
    {
      id: 'pricing',
      number: 5,
      name: 'The Pricing Power Test',
      metric: 'High Gross Margins',
      icon: '💎',
      description: 'Gross profit as a percentage of revenue.',
      why: 'High margins indicate pricing power and product differentiation.',
      calculation: 'Gross Margin = (Revenue - COGS) / Revenue',
      example: 'Adobe: 88% gross margins due to software scalability.',
      threshold: 'Industry-specific (Software: 70%+, Consumer: 50%+)',
      interpretation: {
        excellent: 'Top quartile in industry',
        good: 'Above industry median',
        poor: 'Below industry median'
      }
    },
    {
      id: 'allocation',
      number: 6,
      name: 'The Capital Allocation Test',
      metric: 'ROE > 20% + Buybacks',
      icon: '🎯',
      description: 'Return on Equity and disciplined share repurchases.',
      why: 'Superior capital allocation amplifies compounding.',
      calculation: 'ROE = Net Income / Shareholder Equity',
      example: 'AutoZone: 1000%+ ROE through aggressive buybacks.',
      threshold: '> 20% ROE',
      interpretation: {
        excellent: '> 30% ROE with buybacks at low valuations',
        good: '20-30% ROE with disciplined buybacks',
        poor: '< 20% ROE or poorly timed buybacks'
      }
    },
    {
      id: 'cash',
      number: 7,
      name: 'The Cash Generation Test',
      metric: 'FCF Margin > 15% & Conversion > 80%',
      icon: '💰',
      description: 'Free cash flow margin and conversion from net income.',
      why: 'Cash, not accounting earnings, drives intrinsic value.',
      calculation: 'FCF Margin = FCF / Revenue; Conversion = FCF / Net Income',
      example: 'Visa: 50%+ FCF margins with 100%+ conversion.',
      threshold: '> 15% margin & > 80% conversion',
      interpretation: {
        excellent: '> 25% margin & > 100% conversion',
        good: '15-25% margin & 80-100% conversion',
        poor: '< 15% margin or < 80% conversion'
      }
    },
    {
      id: 'durability',
      number: 8,
      name: 'The Durability Test',
      metric: 'Growing Market Share in Expanding TAMs',
      icon: '🌱',
      description: 'Market share gains in growing Total Addressable Markets.',
      why: 'Long-term compounding requires both market growth and competitive success.',
      calculation: 'Track relative market share and TAM growth rates',
      example: 'Tesla: Growing share in expanding EV market.',
      threshold: 'Positive market share change in growing TAM',
      interpretation: {
        excellent: 'Leader in high-growth market',
        good: 'Gaining share in growing market',
        poor: 'Losing share or shrinking market'
      }
    }
  ];

  const caseStudies = [
    {
      company: 'Microsoft (MSFT)',
      period: '2014-2024',
      pillarsPass: 8,
      returns: '27% annual',
      highlights: [
        'ROIC consistently above 30%',
        'Minimal debt, fortress balance sheet',
        'Cloud transformation drove 15%+ revenue CAGR',
        '88% gross margins in cloud services'
      ]
    },
    {
      company: 'Costco (COST)',
      period: '2004-2024',
      pillarsPass: 7,
      returns: '15% annual',
      highlights: [
        'Unique membership model creates moat',
        'Conservative leverage < 1x',
        'Steady 7% revenue growth',
        'Best-in-class capital allocation'
      ]
    },
    {
      company: 'ASML',
      period: '2010-2024',
      pillarsPass: 8,
      returns: '22% annual',
      highlights: [
        'Monopoly in EUV lithography',
        'ROIC above 40%',
        'Growing share in critical semiconductor market',
        'Exceptional cash generation'
      ]
    }
  ];

  return (
    <div className="eight-pillars-guide">
      <div className="guide-header">
        <h1>The Eight Pillars Framework</h1>
        <p className="guide-subtitle">
          A Systematic Approach to Identifying Elite Compounding Equities
        </p>
      </div>

      <div className="framework-overview">
        <div className="overview-card">
          <h2>What is the Eight Pillars Framework?</h2>
          <p>
            The Eight Pillars Framework is a comprehensive investment methodology that identifies 
            companies capable of generating superior long-term returns through compounding. 
            By screening stocks across eight critical dimensions of business quality, 
            investors can systematically identify elite businesses with sustainable competitive advantages.
          </p>
          <div className="key-principles">
            <h3>Key Principles</h3>
            <ul>
              <li>✅ Quality over Value: Premium businesses justify premium valuations</li>
              <li>✅ Compounding Focus: Seek businesses that can compound at 15%+ annually</li>
              <li>✅ Holistic Analysis: Excellence required across multiple dimensions</li>
              <li>✅ Quantitative Rigor: Specific, measurable thresholds for each pillar</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pillars-section">
        <h2>The Eight Pillars Explained</h2>
        <div className="pillars-grid">
          {pillars.map(pillar => (
            <div 
              key={pillar.id}
              className={`pillar-card ${selectedPillar?.id === pillar.id ? 'expanded' : ''}`}
              onClick={() => setSelectedPillar(pillar.id === selectedPillar?.id ? null : pillar)}
            >
              <div className="pillar-header">
                <span className="pillar-icon">{pillar.icon}</span>
                <div className="pillar-title">
                  <span className="pillar-number">Pillar {pillar.number}</span>
                  <h3>{pillar.name}</h3>
                </div>
                <span className="pillar-metric">{pillar.metric}</span>
              </div>
              
              {selectedPillar?.id === pillar.id && (
                <div className="pillar-details">
                  <p className="pillar-description">{pillar.description}</p>
                  
                  <div className="detail-section">
                    <h4>Why It Matters</h4>
                    <p>{pillar.why}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Calculation</h4>
                    <code>{pillar.calculation}</code>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Real Example</h4>
                    <p>{pillar.example}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Interpretation</h4>
                    <ul className="interpretation-list">
                      <li className="excellent">🟢 {pillar.interpretation.excellent}</li>
                      <li className="good">🟡 {pillar.interpretation.good}</li>
                      <li className="poor">🔴 {pillar.interpretation.poor}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="scoring-section">
        <h2>Scoring & Classification</h2>
        <div className="scoring-grid">
          <div className="score-tier elite">
            <span className="tier-score">8/8</span>
            <span className="tier-name">Elite Compounder</span>
            <span className="tier-desc">Exceptional businesses with fortress moats</span>
          </div>
          <div className="score-tier strong">
            <span className="tier-score">7/8</span>
            <span className="tier-name">Strong Compounder</span>
            <span className="tier-desc">High-quality growth with minor weaknesses</span>
          </div>
          <div className="score-tier quality">
            <span className="tier-score">6/8</span>
            <span className="tier-name">Quality Growth</span>
            <span className="tier-desc">Meets framework minimum requirements</span>
          </div>
          <div className="score-tier moderate">
            <span className="tier-score">4-5/8</span>
            <span className="tier-name">Moderate Quality</span>
            <span className="tier-desc">Mixed signals, requires careful analysis</span>
          </div>
          <div className="score-tier weak">
            <span className="tier-score">0-3/8</span>
            <span className="tier-name">Below Framework</span>
            <span className="tier-desc">Does not meet quality thresholds</span>
          </div>
        </div>
      </div>

      <div className="case-studies">
        <h2>Proven Success Stories</h2>
        <div className="studies-grid">
          {caseStudies.map(study => (
            <div key={study.company} className="case-study">
              <h3>{study.company}</h3>
              <div className="study-stats">
                <span className="stat">
                  <strong>Period:</strong> {study.period}
                </span>
                <span className="stat">
                  <strong>Pillars:</strong> {study.pillarsPass}/8
                </span>
                <span className="stat">
                  <strong>Returns:</strong> {study.returns}
                </span>
              </div>
              <ul className="study-highlights">
                {study.highlights.map((highlight, idx) => (
                  <li key={idx}>{highlight}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="implementation-guide">
        <h2>How to Use the Framework</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Screen</h3>
            <p>Use the screening tool to analyze stocks against all eight pillars</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Filter</h3>
            <p>Focus on stocks meeting 6+ pillars (framework minimum)</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Analyze</h3>
            <p>Deep dive into pillar details and trend analysis</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <h3>Build</h3>
            <p>Construct a concentrated portfolio of 15-25 elite compounders</p>
          </div>
          <div className="step">
            <span className="step-number">5</span>
            <h3>Monitor</h3>
            <p>Quarterly review to ensure pillars remain intact</p>
          </div>
        </div>
      </div>

      <div className="framework-footer">
        <p className="disclaimer">
          <strong>Disclaimer:</strong> This framework is for educational purposes. 
          Past performance does not guarantee future results. Always conduct your own due diligence.
        </p>
      </div>
    </div>
  );
};

export default EightPillarsGuide;