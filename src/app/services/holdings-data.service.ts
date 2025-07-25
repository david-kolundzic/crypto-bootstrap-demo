import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { CryptoHolding } from './csv-import.service';

@Injectable({
  providedIn: 'root'
})
export class HoldingsDataService {
  private readonly http = inject(HttpClient);
  
  // Signal to store default holdings
  private readonly defaultHoldingsSignal = signal<CryptoHolding[]>([]);
  
  // Read-only signal for components to access
  readonly defaultHoldings = this.defaultHoldingsSignal.asReadonly();
  
  // Loading state signal
  private readonly loadingSignal = signal<boolean>(false);
  readonly isLoading = this.loadingSignal.asReadonly();
  
  // Error state signal
  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();
  
  /**
   * Load default holdings from default-holdings.json
   * Returns an Observable for component subscription if needed
   */
  loadDefaultHoldings(): Observable<CryptoHolding[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http.get<CryptoHolding[]>('default-holdings.json').pipe(
      map((holdings: CryptoHolding[]) => {
        // Update the signal with loaded data
        this.defaultHoldingsSignal.set(holdings);
        this.loadingSignal.set(false);
        return holdings;
      }),
      catchError((error) => {
        console.error('Failed to load default holdings:', error);
        this.errorSignal.set('Failed to load default holdings data');
        this.loadingSignal.set(false);
        
        // Return fallback data instead of empty array
        const fallback: CryptoHolding[] = [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 67500.0,
            holdings: 0.6543,
            value: 44166.25,
            change24h: 1234.56,
            changePercent24h: 1.86,
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3420.5,
            holdings: 5.2341,
            value: 17904.73,
            change24h: 567.89,
            changePercent24h: 3.28,
          }
        ];
        this.defaultHoldingsSignal.set(fallback);
        return of(fallback);
      })
    );
  }
  
  /**
   * Get default holdings synchronously from the signal
   * Note: This will return empty array if data hasn't been loaded yet
   */
  getDefaultHoldings(): CryptoHolding[] {
    return this.defaultHoldingsSignal();
  }
  
  /**
   * Check if default holdings have been loaded
   */
  get hasData(): boolean {
    return this.defaultHoldingsSignal().length > 0;
  }
  
  /**
   * Reset the service state
   */
  reset(): void {
    this.defaultHoldingsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
