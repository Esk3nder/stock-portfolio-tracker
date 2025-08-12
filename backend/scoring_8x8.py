"""
8x8 Framework Scoring Engine
Implements the 8-pillar scoring system with 0-8 points per pillar
"""

from typing import Dict, Optional, Tuple, List
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EightByEightScorer:
    """Implements the 8x8 Framework scoring logic"""
    
    @staticmethod
    def score_moat(roic: float) -> int:
        """
        Pillar 1: ROIC-based moat assessment
        Measures the company's return on invested capital
        """
        if roic is None or roic < 0.20:
            return 0  # Eliminated
        if roic >= 0.40:
            return 8
        if roic >= 0.35:
            return 7
        if roic >= 0.30:
            return 6
        if roic >= 0.25:
            return 5
        return 4  # 20-25%
    
    @staticmethod
    def score_fortress(debt_to_ebitda: Optional[float]) -> int:
        """
        Pillar 2: Balance sheet strength
        Lower debt relative to earnings indicates financial fortress
        """
        if debt_to_ebitda is None or debt_to_ebitda < 0:
            return 8  # Net cash position
        if debt_to_ebitda > 2.5:
            return 0  # Eliminated
        if debt_to_ebitda <= 0.5:
            return 7
        if debt_to_ebitda <= 1.0:
            return 6
        if debt_to_ebitda <= 1.5:
            return 5
        return 4  # 1.5-2.5x
    
    @staticmethod
    def score_engine(revenue_cagr_3y: float) -> int:
        """
        Pillar 3: Revenue growth engine
        3-year compound annual growth rate
        """
        if revenue_cagr_3y is None or revenue_cagr_3y < 0.10:
            return 0  # Eliminated
        if revenue_cagr_3y > 0.30:
            return 8
        if revenue_cagr_3y >= 0.25:
            return 7
        if revenue_cagr_3y >= 0.20:
            return 6
        if revenue_cagr_3y >= 0.15:
            return 5
        return 4  # 10-15%
    
    @staticmethod
    def score_efficiency(rule_of_40: float) -> int:
        """
        Pillar 4: Growth + profitability efficiency
        Revenue growth % + FCF margin %
        """
        if rule_of_40 is None or rule_of_40 < 40:
            return 0  # Eliminated
        if rule_of_40 > 70:
            return 8
        if rule_of_40 >= 60:
            return 7
        if rule_of_40 >= 50:
            return 6
        if rule_of_40 >= 45:
            return 5
        return 4  # 40-45
    
    @staticmethod
    def score_pricing_power(gross_margin_percentile: float) -> int:
        """
        Pillar 5: Pricing power vs industry peers
        Percentile ranking of gross margin within industry
        """
        if gross_margin_percentile is None or gross_margin_percentile < 60:
            return 0  # Below top 40% - Eliminated
        if gross_margin_percentile >= 95:
            return 8  # Top 5%
        if gross_margin_percentile >= 90:
            return 7  # Top 10%
        if gross_margin_percentile >= 80:
            return 6  # Top 20%
        if gross_margin_percentile >= 70:
            return 5  # Top 30%
        return 4  # Top 40%
    
    @staticmethod
    def score_capital_allocation(roe: float, buyback_quality: str = 'none') -> int:
        """
        Pillar 6: Management capital allocation
        Return on equity and buyback discipline
        """
        if roe is None or roe < 0.15:
            return 0  # Eliminated
        
        if roe > 0.30 and buyback_quality == 'disciplined':
            return 8
        if roe > 0.25 and buyback_quality in ['disciplined', 'moderate']:
            return 7
        if roe > 0.20:
            return 6
        if roe >= 0.15 and roe <= 0.20:
            return 5
        return 4
    
    @staticmethod
    def score_cash_generation(fcf_margin: float) -> int:
        """
        Pillar 7: Free cash flow generation
        FCF as percentage of revenue
        """
        if fcf_margin is None or fcf_margin < 0.12:
            return 0  # Eliminated
        if fcf_margin > 0.30:
            return 8
        if fcf_margin >= 0.25:
            return 7
        if fcf_margin >= 0.20:
            return 6
        if fcf_margin >= 0.15:
            return 5
        return 4  # 12-15%
    
    @staticmethod
    def score_durability(market_share_trend: str, tam_growth: float) -> int:
        """
        Pillar 8: Competitive position durability
        Market share dynamics in growing TAM
        """
        if market_share_trend is None or tam_growth is None:
            return 4  # Default to minimum passing if data unavailable
            
        if market_share_trend == 'losing' or tam_growth < 0:
            return 0  # Eliminated
        
        if market_share_trend == 'gaining':
            if tam_growth > 0.20:
                return 8
            if tam_growth >= 0.15:
                return 7
            if tam_growth >= 0.10:
                return 5
            return 4
        
        # Stable share
        if tam_growth > 0.20:
            return 6
        if tam_growth >= 0.10:
            return 4
        return 0  # Eliminated if stable in shrinking market
    
    @classmethod
    def calculate_total_score(cls, fundamentals: Dict) -> Tuple[Dict[str, int], int, bool, List[str]]:
        """
        Calculate all pillar scores and total
        Returns: (pillar_scores, total_score, is_eliminated, elimination_reasons)
        """
        try:
            scores = {
                'moat': cls.score_moat(fundamentals.get('roic', 0)),
                'fortress': cls.score_fortress(fundamentals.get('debt_to_ebitda')),
                'engine': cls.score_engine(fundamentals.get('revenue_cagr_3y', 0)),
                'efficiency': cls.score_efficiency(fundamentals.get('rule_of_40', 0)),
                'pricing_power': cls.score_pricing_power(
                    fundamentals.get('industry_gross_margin_percentile', 0)
                ),
                'capital_allocation': cls.score_capital_allocation(
                    fundamentals.get('roe', 0),
                    fundamentals.get('buyback_quality', 'none')
                ),
                'cash_generation': cls.score_cash_generation(
                    fundamentals.get('fcf_margin', 0)
                ),
                'durability': cls.score_durability(
                    fundamentals.get('market_share_trend', 'stable'),
                    fundamentals.get('tam_growth_rate', 0.10)
                )
            }
            
            # Check for elimination (any 0 score)
            elimination_reasons = [k for k, v in scores.items() if v == 0]
            is_eliminated = len(elimination_reasons) > 0
            
            # Calculate total score (0 if eliminated)
            total_score = sum(scores.values()) if not is_eliminated else 0
            
            # Minimum qualifying score is 32 (average 4 per pillar)
            if total_score < 32 and not is_eliminated:
                is_eliminated = True
                elimination_reasons = ['below_minimum_score']
            
            return scores, total_score, is_eliminated, elimination_reasons
            
        except Exception as e:
            logger.error(f"Error calculating score: {e}")
            # Return minimum scores on error
            default_scores = {k: 4 for k in ['moat', 'fortress', 'engine', 'efficiency', 
                                             'pricing_power', 'capital_allocation', 
                                             'cash_generation', 'durability']}
            return default_scores, 32, False, []
    
    @staticmethod
    def calculate_tie_breakers(scores: Dict[str, int], fundamentals: Dict) -> Dict:
        """
        Calculate tie-breaker metrics for ranking
        """
        pillar_values = list(scores.values())
        
        return {
            'lowest_pillar_score': min(pillar_values),
            'median_pillar_score': np.median(pillar_values),
            'p_fcf': fundamentals.get('fcf_multiple', float('inf')),
            'fcf_absolute': fundamentals.get('fcf', 0)
        }
    
    @staticmethod
    def format_elimination_reason(reasons: List[str]) -> str:
        """
        Format elimination reasons for display
        """
        if not reasons:
            return ""
        
        pillar_names = {
            'moat': 'ROIC < 20%',
            'fortress': 'Debt/EBITDA > 2.5x',
            'engine': 'Revenue CAGR < 10%',
            'efficiency': 'Rule of 40 < 40',
            'pricing_power': 'Gross margin below top 40% of industry',
            'capital_allocation': 'ROE < 15%',
            'cash_generation': 'FCF margin < 12%',
            'durability': 'Losing market share or TAM shrinking',
            'below_minimum_score': 'Total score below 32'
        }
        
        return ', '.join([pillar_names.get(r, r) for r in reasons])