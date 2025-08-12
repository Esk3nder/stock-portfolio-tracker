"""
8x8 Framework Portfolio Optimizer
Implements strict 8-stock selection and score-based weighting
"""

from typing import List, Dict, Tuple
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class EightByEightOptimizer:
    """Implements strict 8x8 portfolio selection and weighting"""
    
    @staticmethod
    def select_top_8(scored_stocks: List[Dict]) -> List[Dict]:
        """
        Select exactly 8 highest-scoring stocks
        
        Args:
            scored_stocks: List of dicts with scoring information
            
        Returns:
            List of exactly 8 stocks (or fewer if insufficient qualified stocks)
        """
        # Filter out eliminated stocks
        qualified = [s for s in scored_stocks if not s.get('is_eliminated', True)]
        
        # Must have at least 32 points to qualify (average 4 per pillar)
        qualified = [s for s in qualified if s.get('total_score', 0) >= 32]
        
        if not qualified:
            logger.warning("No stocks qualified for 8x8 portfolio")
            return []
        
        # Sort by total score (descending), then by tie-breakers
        qualified.sort(key=lambda x: (
            x.get('total_score', 0),                      # Primary: highest total score
            x.get('lowest_pillar_score', 0),              # Tie-breaker 1: higher minimum score
            x.get('median_pillar_score', 0),              # Tie-breaker 2: higher median score
            -x.get('p_fcf', float('inf')),                # Tie-breaker 3: lower P/FCF
            x.get('fcf_absolute', 0)                      # Tie-breaker 4: higher absolute FCF
        ), reverse=True)
        
        # Return exactly top 8 (or all if fewer than 8 qualified)
        selected = qualified[:8]
        
        if len(selected) < 8:
            logger.warning(f"Only {len(selected)} stocks qualified for portfolio")
        
        return selected
    
    @staticmethod
    def calculate_weights(selected_stocks: List[Dict]) -> Dict[str, float]:
        """
        Calculate position weights using 8x8 formula
        Weight = (Stock Score - 30) / Sum of All (Scores - 30)
        
        Args:
            selected_stocks: List of selected stocks with scores
            
        Returns:
            Dictionary mapping ticker to weight (0-1)
        """
        if not selected_stocks:
            return {}
        
        weights = {}
        points_above_base = []
        
        # Calculate points above base (30) for each stock
        for stock in selected_stocks:
            ticker = stock.get('ticker', 'UNKNOWN')
            score = stock.get('total_score', 32)
            
            # Score minus 30 base
            points = max(score - 30, 1)  # Minimum 1 to avoid zero weights
            points_above_base.append((ticker, points, score))
        
        # Sum total points above base
        total_points = sum(p for _, p, _ in points_above_base)
        
        if total_points == 0:
            # Equal weight if somehow all at base
            logger.warning("All stocks at base score, using equal weights")
            for ticker, _, _ in points_above_base:
                weights[ticker] = 1.0 / len(points_above_base)
        else:
            # Calculate weights
            for ticker, points, score in points_above_base:
                weight = points / total_points
                weights[ticker] = weight
                logger.info(f"{ticker}: Score={score}, Points above base={points}, Weight={weight:.1%}")
        
        # Verify weights sum to 1
        weight_sum = sum(weights.values())
        if abs(weight_sum - 1.0) > 0.001:
            logger.warning(f"Weights sum to {weight_sum}, normalizing...")
            # Normalize if needed
            for ticker in weights:
                weights[ticker] /= weight_sum
        
        return weights
    
    @staticmethod
    def create_portfolio_allocation(selected_stocks: List[Dict], weights: Dict[str, float]) -> List[Dict]:
        """
        Create final portfolio allocation with all details
        
        Args:
            selected_stocks: Selected stocks with scores
            weights: Calculated weights
            
        Returns:
            List of portfolio positions with full details
        """
        portfolio = []
        
        for rank, stock in enumerate(selected_stocks, 1):
            ticker = stock.get('ticker', 'UNKNOWN')
            
            position = {
                'rank': rank,
                'ticker': ticker,
                'name': stock.get('name', ticker),
                'sector': stock.get('sector', 'Unknown'),
                'industry': stock.get('industry', 'Unknown'),
                'weight': weights.get(ticker, 0),
                'total_score': stock.get('total_score', 0),
                'points_above_base': stock.get('total_score', 32) - 30,
                'pillar_scores': stock.get('scores', {}),
                'fundamentals': {
                    'roic': stock.get('fundamentals', {}).get('roic'),
                    'debt_to_ebitda': stock.get('fundamentals', {}).get('debt_to_ebitda'),
                    'revenue_cagr_3y': stock.get('fundamentals', {}).get('revenue_cagr_3y'),
                    'rule_of_40': stock.get('fundamentals', {}).get('rule_of_40'),
                    'gross_margin': stock.get('fundamentals', {}).get('gross_margin'),
                    'roe': stock.get('fundamentals', {}).get('roe'),
                    'fcf_margin': stock.get('fundamentals', {}).get('fcf_margin'),
                    'market_share_trend': stock.get('fundamentals', {}).get('market_share_trend'),
                    'tam_growth_rate': stock.get('fundamentals', {}).get('tam_growth_rate')
                },
                'tie_breakers': {
                    'lowest_pillar_score': stock.get('lowest_pillar_score'),
                    'median_pillar_score': stock.get('median_pillar_score'),
                    'p_fcf': stock.get('p_fcf'),
                    'fcf_absolute': stock.get('fcf_absolute')
                }
            }
            
            portfolio.append(position)
        
        return portfolio
    
    @staticmethod
    def validate_portfolio(portfolio: List[Dict]) -> Tuple[bool, List[str]]:
        """
        Validate that portfolio meets 8x8 Framework requirements
        
        Args:
            portfolio: List of portfolio positions
            
        Returns:
            Tuple of (is_valid, list_of_issues)
        """
        issues = []
        
        # Check exactly 8 positions (unless insufficient qualified stocks)
        if len(portfolio) != 8:
            if len(portfolio) < 8:
                issues.append(f"Portfolio has only {len(portfolio)} positions (insufficient qualified stocks)")
            else:
                issues.append(f"Portfolio has {len(portfolio)} positions, should have exactly 8")
        
        # Check weights sum to 1
        total_weight = sum(p.get('weight', 0) for p in portfolio)
        if abs(total_weight - 1.0) > 0.001:
            issues.append(f"Weights sum to {total_weight:.4f}, not 1.0")
        
        # Check all scores >= 32
        for position in portfolio:
            score = position.get('total_score', 0)
            if score < 32:
                issues.append(f"{position.get('ticker')} has score {score} below minimum 32")
        
        # Check no eliminated stocks
        for position in portfolio:
            pillar_scores = position.get('pillar_scores', {})
            for pillar, score in pillar_scores.items():
                if score == 0:
                    issues.append(f"{position.get('ticker')} has 0 score in {pillar}")
        
        is_valid = len(issues) == 0
        return is_valid, issues
    
    @staticmethod
    def compare_portfolios(old_portfolio: List[Dict], new_portfolio: List[Dict]) -> Dict:
        """
        Compare two portfolios to identify changes
        
        Args:
            old_portfolio: Previous portfolio
            new_portfolio: New portfolio
            
        Returns:
            Dictionary with additions, removals, and weight changes
        """
        old_tickers = {p['ticker']: p for p in old_portfolio}
        new_tickers = {p['ticker']: p for p in new_portfolio}
        
        additions = []
        removals = []
        weight_changes = []
        
        # Find additions
        for ticker in new_tickers:
            if ticker not in old_tickers:
                additions.append({
                    'ticker': ticker,
                    'weight': new_tickers[ticker]['weight'],
                    'score': new_tickers[ticker]['total_score']
                })
        
        # Find removals
        for ticker in old_tickers:
            if ticker not in new_tickers:
                removals.append({
                    'ticker': ticker,
                    'weight': old_tickers[ticker]['weight'],
                    'score': old_tickers[ticker]['total_score']
                })
        
        # Find weight changes (for stocks in both)
        for ticker in old_tickers:
            if ticker in new_tickers:
                old_weight = old_tickers[ticker]['weight']
                new_weight = new_tickers[ticker]['weight']
                weight_diff = new_weight - old_weight
                
                # Only report if change > 3% (0.03)
                if abs(weight_diff) > 0.03:
                    weight_changes.append({
                        'ticker': ticker,
                        'old_weight': old_weight,
                        'new_weight': new_weight,
                        'change': weight_diff,
                        'old_score': old_tickers[ticker]['total_score'],
                        'new_score': new_tickers[ticker]['total_score']
                    })
        
        return {
            'additions': additions,
            'removals': removals,
            'weight_changes': weight_changes,
            'total_changes': len(additions) + len(removals) + len(weight_changes)
        }