import { Injectable, computed, Signal } from '@angular/core';
import { CryptoHolding } from './csv-import.service';

@Injectable({
  providedIn: 'root'
})
export class PortfolioCalculationService {

  /**
   * Calculate total portfolio value from holdings
   */
  calculateTotalValue(holdings: Signal<CryptoHolding[]>) {
    return computed(() =>
      holdings().reduce((total, holding) => total + holding.value, 0)
    );
  }

  /**
   * Calculate total 24h change in absolute value
   */
  calculateTotal24hChange(holdings: Signal<CryptoHolding[]>) {
    return computed(() =>
      holdings().reduce((total, holding) => total + holding.change24h, 0)
    );
  }

  /**
   * Calculate total 24h change percentage
   */
  calculateTotal24hChangePercent(
    totalValue: Signal<number>, 
    totalChange: Signal<number>
  ) {
    return computed(() => {
      const value = totalValue();
      const change = totalChange();
      return value > 0 ? (change / value) * 100 : 0;
    });
  }

  /**
   * Generate simulated portfolio performance data
   */
  generatePortfolioPerformanceData(holdings: Signal<CryptoHolding[]>) {
    return computed(() => {
      const currentHoldings = holdings();
      if (currentHoldings.length === 0) return [];
      
      // Generate simulated historical data based on current portfolio value
      const currentTotal = currentHoldings.reduce((sum, holding) => sum + holding.value, 0);
      const dataPoints = 14; // 14 points for 2 weeks of data
      const performance: number[] = [];
      
      // Generate realistic portfolio performance over time
      for (let i = 0; i < dataPoints; i++) {
        // Create variation based on individual coin changes
        const dayVariation = currentHoldings.reduce((variation, holding) => {
          // Simulate daily variation based on 24h change percentage
          const dailyChange = (holding.changePercent24h / 100) * (Math.random() * 0.5 + 0.75);
          return variation + (holding.value * dailyChange * (i / dataPoints));
        }, 0);
        
        // Add some randomness and trend
        const trendFactor = (i / dataPoints) * 0.1; // Slight upward trend
        const randomFactor = (Math.random() - 0.5) * 0.05; // ±5% random variation
        const point = currentTotal * (1 + trendFactor + randomFactor) + dayVariation;
        
        performance.push(Math.round(point));
      }
      
      return performance;
    });
  }

  /**
   * Generate date labels for portfolio performance chart
   */
  generatePortfolioLabels(holdings: Signal<CryptoHolding[]>) {
    return computed(() => {
      const currentHoldings = holdings();
      if (currentHoldings.length === 0) return [];
      
      // Generate labels for the last 14 days
      const labels: string[] = [];
      const today = new Date();
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Format as "MMM DD"
        const label = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        labels.push(label);
      }
      
      return labels;
    });
  }

  /**
   * Extract asset allocation data (values) from holdings
   */
  generateAssetAllocationData(holdings: Signal<CryptoHolding[]>) {
    return computed(() => {
      const currentHoldings = holdings();
      return currentHoldings.map((holding) => holding.value);
    });
  }

  /**
   * Extract asset allocation labels (names) from holdings
   */
  generateAssetAllocationLabels(holdings: Signal<CryptoHolding[]>) {
    return computed(() => {
      const currentHoldings = holdings();
      return currentHoldings.map((holding) => holding.name);
    });
  }

  /**
   * Generate dynamic colors for asset allocation chart
   */
  generateAssetAllocationColors(holdings: Signal<CryptoHolding[]>) {
    return computed(() => {
      const currentHoldings = holdings();
      const colorPalette = [
        '#F7931A', // Bitcoin Orange
        '#627EEA', // Ethereum Blue
        '#3468C7', // Cardano Blue
        '#9945FF', // Solana Purple
        '#8247E5', // Polygon Purple
        '#375BD2', // Chainlink Blue
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Light Blue
        '#96CEB4', // Light Green
        '#FFEAA7', // Light Yellow
        '#DDA0DD', // Plum
        '#98D8C8', // Mint
        '#6C757D', // Gray (fallback)
      ];
      
      return currentHoldings.map((_, index) => 
        colorPalette[index % colorPalette.length]
      );
    });
  }

  /**
   * Get crypto-specific color by symbol (for consistent branding)
   */
  getCryptoColor(symbol: string): string {
    const cryptoColors: Record<string, string> = {
      'BTC': '#F7931A',
      'ETH': '#627EEA', 
      'ADA': '#3468C7',
      'SOL': '#9945FF',
      'MATIC': '#8247E5',
      'LINK': '#375BD2',
      'DOT': '#E6007A',
      'AVAX': '#E84142',
      'ATOM': '#2E3148',
      'LUNA': '#F9D71C',
    };
    
    return cryptoColors[symbol.toUpperCase()] || '#6C757D';
  }

  /**
   * Generate enhanced asset allocation colors using crypto-specific colors
   */
  generateEnhancedAssetAllocationColors(holdings: Signal<CryptoHolding[]>) {
    return computed(() => {
      const currentHoldings = holdings();
      return currentHoldings.map((holding, index) => {
        // Try to get crypto-specific color first
        const cryptoColor = this.getCryptoColor(holding.symbol);
        if (cryptoColor !== '#6C757D') {
          return cryptoColor;
        }
        
        // Fallback to palette if no specific color found
        const fallbackPalette = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
          '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF8A80'
        ];
        return fallbackPalette[index % fallbackPalette.length];
      });
    });
  }
}
