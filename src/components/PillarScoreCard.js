import React from 'react';
import './PillarScoreCard.css';

const PillarScoreCard = ({ scores, compact = false }) => {
  const pillars = [
    { key: 'moat', label: 'Moat', fullLabel: 'ROIC', icon: '🏰', color: '#ff6b6b' },
    { key: 'fortress', label: 'Fortress', fullLabel: 'Debt/EBITDA', icon: '🛡️', color: '#4ecdc4' },
    { key: 'engine', label: 'Engine', fullLabel: 'Revenue Growth', icon: '🚀', color: '#45b7d1' },
    { key: 'efficiency', label: 'Efficiency', fullLabel: 'Rule of 40', icon: '⚡', color: '#96ceb4' },
    { key: 'pricing_power', label: 'Pricing', fullLabel: 'Gross Margin', icon: '💎', color: '#ffeaa7' },
    { key: 'capital_allocation', label: 'Capital', fullLabel: 'ROE + Buybacks', icon: '🎯', color: '#dfe6e9' },
    { key: 'cash_generation', label: 'Cash', fullLabel: 'FCF Margin', icon: '💰', color: '#fdcb6e' },
    { key: 'durability', label: 'Durability', fullLabel: 'Market Share', icon: '🔒', color: '#6c5ce7' }
  ];

  const getScoreColor = (score) => {
    if (score === 0) return '#ff0000';  // Red for elimination
    if (score <= 4) return '#ffa500';   // Orange for minimum
    if (score <= 6) return '#ffff00';   // Yellow for good
    return '#00ff00';                   // Green for excellent
  };

  const getScoreClass = (score) => {
    if (score === 0) return 'eliminated';
    if (score <= 4) return 'minimum';
    if (score <= 6) return 'good';
    return 'excellent';
  };

  if (compact) {
    return (
      <div className="pillar-scores-compact">
        {pillars.map(pillar => {
          const score = scores[pillar.key] || 0;
          return (
            <div 
              key={pillar.key} 
              className={`pillar-score-compact ${getScoreClass(score)}`}
              title={`${pillar.fullLabel}: ${score}/8`}
            >
              <span className="pillar-icon">{pillar.icon}</span>
              <span className="pillar-value">{score}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="pillar-scores-card">
      <div className="pillar-scores-grid">
        {pillars.map(pillar => {
          const score = scores[pillar.key] || 0;
          return (
            <div key={pillar.key} className={`pillar-score ${getScoreClass(score)}`}>
              <div className="pillar-header">
                <span className="pillar-icon">{pillar.icon}</span>
                <span className="pillar-label">{pillar.label}</span>
              </div>
              <div className="pillar-subtitle">{pillar.fullLabel}</div>
              <div className="score-bar-container">
                <div className="score-bar-background">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="score-segment" />
                  ))}
                </div>
                <div 
                  className="score-bar-fill"
                  style={{
                    width: `${(score / 8) * 100}%`,
                    background: getScoreColor(score)
                  }}
                />
              </div>
              <div className="score-value">
                {score}<span className="score-max">/8</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PillarScoreCard;