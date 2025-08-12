import pandas as pd
import numpy as np
from typing import Dict, List
from datetime import datetime

class ScoringEngine:
    def __init__(self):
        self.economics_weight = 0.6
        self.pricing_power_weight = 0.4
        
    def calculate_economics_score(self, fundamentals: Dict) -> float:
        scores = []
        
        # ROIC component (0-100)
        roic = fundamentals.get("roic", 0)
        roic_score = self._normalize_score(roic, 0, 30, 0, 100)
        scores.append(roic_score)
        
        # FCF Margin component (0-100)
        fcf_margin = fundamentals.get("fcf_margin", 0)
        fcf_score = self._normalize_score(fcf_margin, 0, 25, 0, 100)
        scores.append(fcf_score)
        
        # Revenue Growth component (0-100)
        revenue_growth = fundamentals.get("revenue_growth", 0)
        growth_score = self._normalize_score(revenue_growth, -10, 30, 0, 100)
        scores.append(growth_score)
        
        # Average of components
        economics_score = np.mean(scores) if scores else 0
        
        # Apply penalty for negative FCF
        if fundamentals.get("fcf", 0) < 0:
            economics_score = max(0, economics_score - 20)
        
        return float(economics_score)
    
    def calculate_pricing_power_score(self, fundamentals: Dict, historical_data: List[Dict] = None) -> float:
        scores = []
        
        # Gross Margin level and trend
        gross_margin = fundamentals.get("gross_margin", 0)
        
        # High gross margin indicates pricing power
        margin_score = self._normalize_score(gross_margin, 20, 60, 0, 100)
        scores.append(margin_score)
        
        # Revenue per unit proxy (using revenue growth vs industry average)
        revenue_growth = fundamentals.get("revenue_growth", 0)
        
        # Positive revenue growth with stable margins indicates pricing power
        if gross_margin > 30 and revenue_growth > 0:
            pricing_score = self._normalize_score(revenue_growth, 0, 20, 50, 100)
        else:
            pricing_score = self._normalize_score(revenue_growth, -10, 10, 0, 50)
        
        scores.append(pricing_score)
        
        # If we have historical data, calculate margin stability
        if historical_data and len(historical_data) > 2:
            margins = [d.get("gross_margin", 0) for d in historical_data]
            margin_stability = 100 - min(np.std(margins) * 10, 50)  # Lower volatility = higher score
            scores.append(margin_stability)
        
        pricing_power_score = np.mean(scores) if scores else 0
        
        return float(pricing_power_score)
    
    def calculate_final_score(self, economics_score: float, pricing_power_score: float) -> float:
        final_score = (
            self.economics_weight * economics_score + 
            self.pricing_power_weight * pricing_power_score
        )
        
        # Ensure score is between 0 and 100
        return float(max(0, min(100, final_score)))
    
    def _normalize_score(self, value: float, min_val: float, max_val: float, 
                        min_score: float, max_score: float) -> float:
        if value <= min_val:
            return min_score
        elif value >= max_val:
            return max_score
        else:
            # Linear interpolation
            ratio = (value - min_val) / (max_val - min_val)
            return min_score + ratio * (max_score - min_score)
    
    def rank_stocks(self, scores: Dict[str, float]) -> List[tuple]:
        sorted_stocks = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_stocks
    
    def apply_sector_adjustment(self, scores: Dict[str, float], 
                               sector_map: Dict[str, str]) -> Dict[str, float]:
        # Group by sector
        sector_scores = {}
        for ticker, score in scores.items():
            sector = sector_map.get(ticker, "Unknown")
            if sector not in sector_scores:
                sector_scores[sector] = []
            sector_scores[sector].append((ticker, score))
        
        # Normalize within sectors (percentile-based)
        adjusted_scores = {}
        for sector, ticker_scores in sector_scores.items():
            if len(ticker_scores) <= 1:
                # No adjustment needed for single stock sectors
                for ticker, score in ticker_scores:
                    adjusted_scores[ticker] = score
            else:
                # Convert to percentiles within sector
                values = [s for _, s in ticker_scores]
                for ticker, score in ticker_scores:
                    percentile = (score - min(values)) / (max(values) - min(values) + 0.001)
                    # Blend original score with percentile
                    adjusted_scores[ticker] = 0.7 * score + 0.3 * (percentile * 100)
        
        return adjusted_scores