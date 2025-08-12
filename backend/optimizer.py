import numpy as np
from typing import Dict, List, Tuple

class PortfolioOptimizer:
    def __init__(self, max_position_size: float = 0.05, alpha: float = 2.0):
        self.max_position_size = max_position_size
        self.alpha = alpha  # Power factor for scores
        
    def optimize_weights(self, 
                        scores: Dict[str, float], 
                        volatilities: Dict[str, float],
                        min_score: float = 50.0) -> Dict[str, float]:
        
        # Filter stocks by minimum score
        filtered_stocks = {
            ticker: score 
            for ticker, score in scores.items() 
            if score >= min_score
        }
        
        if not filtered_stocks:
            return {}
        
        # Calculate raw weights: score^alpha / volatility
        raw_weights = {}
        for ticker in filtered_stocks:
            score = scores[ticker]
            volatility = volatilities.get(ticker, 0.25)  # Default vol if missing
            
            # Ensure we don't divide by zero
            if volatility < 0.01:
                volatility = 0.25
            
            # Core formula: w = S^α / σ
            raw_weight = (score ** self.alpha) / (volatility * 10000)  # Scale factor
            raw_weights[ticker] = raw_weight
        
        # Apply position size cap
        capped_weights = {}
        for ticker, weight in raw_weights.items():
            capped_weights[ticker] = min(weight, self.max_position_size)
        
        # Normalize to sum to 1.0
        total_weight = sum(capped_weights.values())
        if total_weight > 0:
            normalized_weights = {
                ticker: weight / total_weight 
                for ticker, weight in capped_weights.items()
            }
        else:
            normalized_weights = {}
        
        # Final check: ensure no position exceeds max size after normalization
        final_weights = {}
        needs_renormalization = False
        
        for ticker, weight in normalized_weights.items():
            if weight > self.max_position_size:
                final_weights[ticker] = self.max_position_size
                needs_renormalization = True
            else:
                final_weights[ticker] = weight
        
        # Renormalize if we hit caps
        if needs_renormalization:
            total = sum(final_weights.values())
            final_weights = {
                ticker: weight / total 
                for ticker, weight in final_weights.items()
            }
        
        return final_weights
    
    def calculate_portfolio_metrics(self, 
                                   weights: Dict[str, float],
                                   volatilities: Dict[str, float],
                                   scores: Dict[str, float]) -> Dict:
        
        if not weights:
            return {
                "portfolio_volatility": 0,
                "weighted_score": 0,
                "concentration": 0,
                "num_positions": 0
            }
        
        # Portfolio volatility (simplified - no correlation)
        portfolio_var = sum(
            (weights[ticker] ** 2) * (volatilities.get(ticker, 0.25) ** 2)
            for ticker in weights
        )
        portfolio_vol = np.sqrt(portfolio_var)
        
        # Weighted average score
        weighted_score = sum(
            weights[ticker] * scores.get(ticker, 0)
            for ticker in weights
        )
        
        # Concentration (Herfindahl index)
        concentration = sum(w ** 2 for w in weights.values())
        
        return {
            "portfolio_volatility": float(portfolio_vol),
            "weighted_score": float(weighted_score),
            "concentration": float(concentration),
            "num_positions": len(weights)
        }
    
    def apply_constraints(self, 
                         weights: Dict[str, float],
                         sector_map: Dict[str, str],
                         sector_limits: Dict[str, float] = None) -> Dict[str, float]:
        
        if not sector_limits:
            return weights
        
        # Group by sector
        sector_weights = {}
        for ticker, weight in weights.items():
            sector = sector_map.get(ticker, "Unknown")
            if sector not in sector_weights:
                sector_weights[sector] = 0
            sector_weights[sector] += weight
        
        # Check sector limits and adjust if needed
        adjusted_weights = weights.copy()
        
        for sector, limit in sector_limits.items():
            if sector in sector_weights and sector_weights[sector] > limit:
                # Scale down all positions in this sector
                scale_factor = limit / sector_weights[sector]
                for ticker, weight in weights.items():
                    if sector_map.get(ticker) == sector:
                        adjusted_weights[ticker] = weight * scale_factor
        
        # Renormalize
        total = sum(adjusted_weights.values())
        if total > 0:
            adjusted_weights = {
                ticker: weight / total 
                for ticker, weight in adjusted_weights.items()
            }
        
        return adjusted_weights