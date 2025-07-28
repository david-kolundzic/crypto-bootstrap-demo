import { Injectable, signal, effect, computed } from '@angular/core';
import { catchError, Observable, of, BehaviorSubject } from 'rxjs';
import * as Papa from 'papaparse';

export interface CryptoHolding {
  symbol: string;
  name: string;
  price: number;
  holdings: number;
  value: number;
  change24h: number;
  changePercent24h: number;
}

export interface ImportResult {
  success: boolean;
  data?: CryptoHolding[];
  errors?: string[];
  exchange?: string;
}

export interface ExchangeTradeData {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  timestamp: string;
  exchange: string;
}

@Injectable({
  providedIn: 'root'
})
export class CsvImportService {
  // ✅ Angular 20 - Primary signal for holdings state
  private readonly holdingsSignal = signal<CryptoHolding[]>([]);
  
  // ✅ Angular 20 - Readonly computed signal for external access
  readonly holdings = this.holdingsSignal.asReadonly();

  // ✅ Angular 20 - Computed signals for portfolio statistics
  readonly totalHoldings = computed(() => this.holdingsSignal().length);
  readonly totalValue = computed(() => 
    this.holdingsSignal().reduce((sum, holding) => sum + holding.value, 0)
  );
  readonly isEmpty = computed(() => this.holdingsSignal().length === 0);
  readonly hasHoldings = computed(() => this.holdingsSignal().length > 0);

  // 🔄 Backward compatibility for Observable-based consumers
  private readonly holdingsSubject = new BehaviorSubject<CryptoHolding[]>([]);
  readonly holdings$ = this.holdingsSubject.asObservable();

  // ✅ Angular 20 - Computed signals for better UI state management
  readonly isProcessing = signal<boolean>(false);
  readonly lastImportResult = signal<ImportResult | null>(null);
  readonly lastError = signal<string | null>(null);

  // ✅ Angular 20 - Computed signals for UI feedback
  readonly hasData = computed(() => this.holdingsSignal().length > 0);
  readonly canExport = computed(() => this.hasData() && !this.isProcessing());
  readonly statusMessage = computed(() => {
    if (this.isProcessing()) return 'Processing CSV data...';
    if (this.lastError()) return this.lastError();
    if (this.hasData()) return `${this.totalHoldings()} assets loaded`;
    return 'No data loaded';
  });

  constructor() {
    // ✅ Angular 20 - Sync signal with Observable for backward compatibility
    effect(() => {
      this.holdingsSubject.next(this.holdingsSignal());
    });
  }

  // ✅ Angular 20 - Exchange detection patterns for different CSV formats
  private readonly exchangePatterns = {
    binance: ['Date(UTC)', 'Pair', 'Side', 'Price', 'Executed', 'Amount', 'Fee'],
    bitpanda: ['Transaction ID', 'Timestamp', 'Transaction Type', 'In/Out', 'Amount Fiat', 'Fiat', 'Amount Asset', 'Asset'],
    coinbase: ['Timestamp', 'Transaction Type', 'Asset', 'Quantity Transacted', 'EUR Spot Price at Transaction'],
    kraken: ['pair', 'time', 'type', 'price', 'vol'], // Key columns for detection
    kucoin: ['Symbol', 'Deal Price', 'Deal Volume', 'Direction', 'Created'] // Key columns for detection
  } as const;

  /**
   * Parse CSV file and import holdings data
   * @param file The CSV file to parse
   * @param mergeWithExisting Whether to merge with current holdings or replace them
   * @returns Observable with import result
   */
  parseCsvFile(file: File, mergeWithExisting: boolean = false): Observable<ImportResult> {
    this.isProcessing.set(true);
    this.lastError.set(null);
    
    return new Observable<ImportResult>((observer) => {
      Papa.parse<any>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const exchange = this.detectExchange(results);
            const importResult = this.processExchangeData(results, exchange);
            
            if (importResult.success && importResult.data) {
              if (mergeWithExisting) {
                console.log('🔄 Merging with existing holdings:', {
                  existing: this.getCurrentHoldings().length,
                  new: importResult.data.length
                });
                const mergedHoldings = this.mergeHoldings(this.getCurrentHoldings(), importResult.data);
                console.log('🔄 Merged result:', mergedHoldings.length, 'holdings');
                this.updateHoldings(mergedHoldings);
                importResult.data = mergedHoldings;
              } else {
                console.log('🔄 Replacing existing holdings:', {
                  old: this.getCurrentHoldings().length,
                  new: importResult.data.length
                });
                this.updateHoldings(importResult.data);
              }
              this.lastImportResult.set(importResult);
            } else {
              this.lastError.set(importResult.errors?.[0] || 'Unknown error occurred');
            }
            
            this.isProcessing.set(false);
            observer.next(importResult);
            observer.complete();
          }  catch (error) {
            this.isProcessing.set(false);
            const errorMessage = `Error processing file: ${error}`;
            this.lastError.set(errorMessage);
            observer.error(new Error(errorMessage));
          }
        },
        error: (error: Error) => {
          this.isProcessing.set(false);
          const errorMessage = `Parse error: ${error.message}`;
          this.lastError.set(errorMessage);
          observer.error(new Error(errorMessage));
        }
      });
    }).pipe(
      catchError(error => {
        this.isProcessing.set(false);
        this.lastError.set(error.message);
        return of({
          success: false,
          errors: [`Error processing file: ${error.message}`]
        });
      })
    );
  }

  /**
   * Parse CSV string using PapaParse
   * @param csvString The CSV content as string
   * @returns Observable with import result
   */
  parseCsvString(csvString: string): Observable<ImportResult> {
    return new Observable<ImportResult>((observer) => {
      Papa.parse<any>(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const exchange = this.detectExchange(results);
            const importResult = this.processExchangeData(results, exchange);
            observer.next(importResult);

          } catch (error) {
            observer.error(new Error(`Error processing string: ${error}`));
          }
        },
        error: (error: Error) => {
          observer.error(new Error(`Parse error: ${error.message}`));
        }
      });
    }).pipe(
      catchError(error => of({
        success: false,
        errors: [ `Error processing string: ${error.message}`]
      }))
    );
  }

  // Procesiraj rezultate iz PapaParse (fallback za generični format)
  private processPapaParseResults(results: Papa.ParseResult<any>): ImportResult {
    const errors: string[] = [];
    const holdings: CryptoHolding[] = [];

    // Normalize headers for generic parsing
    const normalizedData = results.data.map(row => {
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        normalizedRow[normalizedKey] = row[key];
      });
      return normalizedRow;
    });

    // Dodaj PapaParse greške ako postoje
    if (results.errors && results.errors.length > 0) {
      results.errors.forEach(error => {
        const rowInfo = error.row !== undefined ? ` (Row ${error.row + 1})` : '';
        errors.push(`Parse error${rowInfo}: ${error.message}`);
      });
    }

    // Provjeri da li imamo podatke
    if (!normalizedData || normalizedData.length === 0) {
      return {
        success: false,
        errors: ['No valid data found in CSV file']
      };
    }

    // Provjeri header kolone - očekujemo normalized nazive
    const firstRow = normalizedData[0];
    const requiredFields = ['symbol', 'name', 'price', 'holdings'];
    const availableFields = Object.keys(firstRow);
    
    const missingFields = requiredFields.filter(field => 
      !availableFields.some(available => 
        available.includes(field) || field.includes(available)
      )
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        errors: [
          `Missing required columns: ${missingFields.join(', ')}`,
          `Available columns: ${availableFields.join(', ')}`,
          'Expected columns: Symbol, Name, Price, Holdings (Value, Change24h, ChangePercent24h are optional)'
        ]
      };
    }

    // Procesiraj svaki red podataka
    normalizedData.forEach((row: any, index: number) => {
      try {
        // Fleksibilno mapiranje kolona
        const symbol = this.getFieldValue(row, ['symbol', 'coin', 'ticker']);
        const name = this.getFieldValue(row, ['name', 'coinname', 'cryptocurrency']);
        const priceStr = this.getFieldValue(row, ['price', 'currentprice', 'value']);
        const holdingsStr = this.getFieldValue(row, ['holdings', 'amount', 'quantity', 'balance']);
        const valueStr = this.getFieldValue(row, ['value', 'totalvalue', 'worth', 'marketvalue']);
        const change24hStr = this.getFieldValue(row, ['change24h', 'change', 'dailychange']);
        const changePercent24hStr = this.getFieldValue(row, ['changepercent24h', 'percentchange', 'changepercent']);

        // Validacija osnovnih podataka
        if (!symbol || !name) {
          errors.push(`Row ${index + 2}: Missing symbol or name`);
          return;
        }

        const price = this.parseNumber(priceStr);
        const holdingsAmount = this.parseNumber(holdingsStr);

        if (price <= 0 || holdingsAmount <= 0) {
          errors.push(`Row ${index + 2}: Invalid price (${priceStr}) or holdings (${holdingsStr}) value`);
          return;
        }

        // Kalkuliraj ili koristi postojeće value
        let value = this.parseNumber(valueStr);
        if (value <= 0) {
          value = price * holdingsAmount;
        }

        const holding: CryptoHolding = {
          symbol: symbol.toUpperCase(),
          name: name,
          price: price,
          holdings: holdingsAmount,
          value: value,
          change24h: this.parseNumber(change24hStr) || 0,
          changePercent24h: this.parseNumber(changePercent24hStr) || 0
        };

        holdings.push(holding);
      } catch (error) {
        errors.push(`Row ${index + 2}: Error processing data - ${error}`);
      }
    });

    return {
      success: holdings.length > 0,
      data: holdings,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Helper metoda za fleksibilno dobavljanje vrijednosti iz reda
  private getFieldValue(row: any, possibleKeys: string[]): string {
    for (const key of possibleKeys) {
      // Traži exact match
      if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim();
      }
      
      // Traži partial match u ključevima
      const matchingKey = Object.keys(row).find(rowKey => 
        rowKey.includes(key) || key.includes(rowKey)
      );
      
      if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
        return String(row[matchingKey]).trim();
      }
    }
    
    return '';
  }

  private parseNumber(value: string): number {
    if (!value) return 0;
    
    // Ukloni sve što nije broj, tačka ili minus
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleanValue);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  // ✅ Angular 20 - Update holdings signal (primary state management)
  updateHoldings(holdings: CryptoHolding[]): void {
    this.holdingsSignal.set(holdings);
  }

  // ✅ Angular 20 - Add single holding using signal-based merge
  addHolding(newHolding: CryptoHolding): void {
    const currentHoldings = this.holdingsSignal();
    const mergedHoldings = this.mergeHoldings(currentHoldings, [newHolding]);
    this.holdingsSignal.set(mergedHoldings);
  }

  // ✅ Angular 20 - Remove holding by symbol using signal update
  removeHolding(symbol: string): void {
    const currentHoldings = this.holdingsSignal();
    const filteredHoldings = currentHoldings.filter(h => 
      h.symbol.toUpperCase() !== symbol.toUpperCase()
    );
    this.holdingsSignal.set(filteredHoldings);
  }

  // ✅ Angular 20 - Get current holdings from signal
  getCurrentHoldings(): CryptoHolding[] {
    return this.holdingsSignal();
  }

  // Export trenutnih podataka kao CSV
  exportToCsv(): string {
    const holdings = this.getCurrentHoldings();
    
    if (holdings.length === 0) {
      return '';
    }

    // Koristi PapaParse za generiranje CSV-a
    const csvData = holdings.map(holding => ({
      Symbol: holding.symbol,
      Name: holding.name,
      Price: holding.price,
      Holdings: holding.holdings,
      Value: holding.value,
      Change24h: holding.change24h,
      ChangePercent24h: holding.changePercent24h
    }));

    return Papa.unparse(csvData, {
      header: true,
      delimiter: ',',
      newline: '\n'
    });
  }

  // Download CSV fajl
  downloadCsv(filename: string = 'portfolio-holdings.csv'): void {
    const csvContent = this.exportToCsv();
    
    if (!csvContent) {
      console.warn('No data to export');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Generiraj template CSV fajl za download
  generateTemplateCsv(): string {
    const templateData = [
      {
        Symbol: 'BTC',
        Name: 'Bitcoin',
        Price: 45000,
        Holdings: 0.5,
        Value: 22500,
        Change24h: 1250.75,
        ChangePercent24h: 2.85
      },
      {
        Symbol: 'ETH',
        Name: 'Ethereum',
        Price: 3200,
        Holdings: 2.5,
        Value: 8000,
        Change24h: -150.25,
        ChangePercent24h: -1.84
      }
    ];

    return Papa.unparse(templateData, {
      header: true,
      delimiter: ',',
      newline: '\n'
    });
  }

  // Download template CSV fajl
  downloadTemplate(filename: string = 'portfolio-template.csv'): void {
    const csvContent = this.generateTemplateCsv();
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Detect which exchange the CSV file is from
  private detectExchange(results: Papa.ParseResult<any>): string {
    if (!results.data || results.data.length === 0) {
      return 'unknown';
    }

    const headers = Object.keys(results.data[0]);
    console.log('🔍 CSV Headers detected:', headers);
    
    // Special detection for common exchange patterns
    const headersLower = headers.map(h => h.toLowerCase());
    
    // Kraken specific detection
    if (headersLower.includes('pair') && headersLower.includes('time') && headersLower.includes('type')) {
      console.log('✅ Exchange detected: kraken (specific pattern)');
      return 'kraken';
    }
    
    // KuCoin specific detection
    if (headersLower.some(h => h.includes('deal')) && headersLower.includes('symbol') && headersLower.includes('direction')) {
      console.log('✅ Exchange detected: kucoin (specific pattern)');
      return 'kucoin';
    }
    
    // Check each exchange pattern
    for (const [exchange, pattern] of Object.entries(this.exchangePatterns)) {
      const matches = pattern.filter(col => 
        headers.some(header => {
          const headerLower = header.toLowerCase();
          const colLower = col.toLowerCase();
          return headerLower.includes(colLower) || 
                 colLower.includes(headerLower) ||
                 headerLower === colLower;
        })
      );
      
      console.log(`🔍 ${exchange} matches:`, matches.length, '/', pattern.length, matches);
      
      // If most columns match, it's likely this exchange
      if (matches.length >= Math.ceil(pattern.length * 0.6)) {
        console.log(`✅ Exchange detected: ${exchange}`);
        return exchange;
      }
    }
    
    console.log('❌ No exchange detected, using generic parsing');
    return 'unknown';
  }

  // Process data based on detected exchange
  private processExchangeData(results: Papa.ParseResult<any>, exchange: string): ImportResult {
    const errors: string[] = [];
    
    try {
      let trades: ExchangeTradeData[] = [];
      
      switch (exchange) {
        case 'binance':
          trades = this.parseBinanceData(results.data);
          break;
        case 'bitpanda':
          trades = this.parseBitpandaData(results.data);
          break;
        case 'coinbase':
          trades = this.parseCoinbaseData(results.data);
          break;
        case 'kraken':
          trades = this.parseKrakenData(results.data);
          break;
        case 'kucoin':
          trades = this.parseKuCoinData(results.data);
          break;
        default:
          // Fallback to generic parsing
          return this.processPapaParseResults(results);
      }

      const holdings = this.convertTradesToHoldings(trades);
      
      return {
        success: holdings.length > 0,
        data: holdings,
        exchange: exchange,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [`Error processing ${exchange} data: ${error}`],
        exchange: exchange
      };
    }
  }

  // Helper to normalize trade side
  private normalizeTradeSide(side: string): 'BUY' | 'SELL' {
    const normalizedSide = side?.toUpperCase();
    return normalizedSide === 'BUY' || normalizedSide === 'Buy' ? 'BUY' : 'SELL';
  }

  // Parse Binance CSV format
  private parseBinanceData(data: any[]): ExchangeTradeData[] {
    return data.map(row => ({
      symbol: this.extractSymbolFromPair(row['Pair']),
      side: this.normalizeTradeSide(row['Side']),
      quantity: parseFloat(row['Amount']) || 0,
      price: parseFloat(row['Price']) || 0,
      fee: this.parseNumber(row['Fee']) || 0,
      timestamp: row['Date(UTC)'],
      exchange: 'binance'
    })).filter(trade => trade.quantity > 0 && trade.price > 0);
  }

  // Parse Bitpanda CSV format
  private parseBitpandaData(data: any[]): ExchangeTradeData[] {
    return data.map(row => ({
      symbol: row['Asset'],
      side: this.normalizeTradeSide(row['Transaction Type']),
      quantity: parseFloat(row['Amount Asset']) || 0,
      price: parseFloat(row['Asset market price']) || 0,
      fee: parseFloat(row['Fee amount']) || 0,
      timestamp: row['Timestamp'],
      exchange: 'bitpanda'
    })).filter(trade => trade.quantity > 0 && trade.price > 0);
  }

  // Parse Coinbase CSV format
  private parseCoinbaseData(data: any[]): ExchangeTradeData[] {
    return data.map(row => ({
      symbol: row['Asset'],
      side: this.normalizeTradeSide(row['Transaction Type']),
      quantity: parseFloat(row['Quantity Transacted']) || 0,
      price: parseFloat(row['EUR Spot Price at Transaction']) || 0,
      fee: parseFloat(row['EUR Fees']) || 0,
      timestamp: row['Timestamp'],
      exchange: 'coinbase'
    })).filter(trade => trade.quantity > 0 && trade.price > 0);
  }

  // Parse Kraken CSV format
  private parseKrakenData(data: any[]): ExchangeTradeData[] {
    console.log('🟠 Parsing Kraken data, first row:', data[0]);
    console.log('🟠 Available columns:', Object.keys(data[0] || {}));
    
    return data.map((row, index) => {
      try {
        const symbol = this.extractSymbolFromPair(row['pair'] || row['Pair']);
        const side = this.normalizeTradeSide(row['type'] || row['Type']);
        const quantity = parseFloat(row['vol'] || row['Vol'] || row['volume'] || row['Volume']) || 0;
        const price = parseFloat(row['price'] || row['Price']) || (parseFloat(row['cost'] || row['Cost']) / parseFloat(row['vol'] || row['Vol'])) || 0;
        const fee = parseFloat(row['fee'] || row['Fee']) || 0;
        const timestamp = row['time'] || row['Time'] || row['timestamp'] || row['Timestamp'];
        
        if (index < 3) { // Debug first few rows
          console.log(`🟠 Kraken row ${index}:`, { symbol, side, quantity, price, fee, timestamp });
        }
        
        return {
          symbol,
          side,
          quantity,
          price,
          fee,
          timestamp,
          exchange: 'kraken'
        };
      } catch (error) {
        console.error(`❌ Error parsing Kraken row ${index}:`, error, row);
        return null;
      }
    }).filter((trade): trade is ExchangeTradeData => 
      trade !== null && trade.quantity > 0 && trade.price > 0
    );
  }

  // Parse KuCoin CSV format
  private parseKuCoinData(data: any[]): ExchangeTradeData[] {
    console.log('🔵 Parsing KuCoin data, first row:', data[0]);
    console.log('🔵 Available columns:', Object.keys(data[0] || {}));
    
    return data.map((row, index) => {
      try {
        const symbol = this.extractSymbolFromPair(row['Symbol'] || row['symbol']);
        const side = this.normalizeTradeSide(row['Direction'] || row['direction'] || row['Side'] || row['side']);
        const quantity = parseFloat(row['Deal Volume'] || row['deal volume'] || row['Volume'] || row['volume'] || row['Amount'] || row['amount']) || 0;
        const price = parseFloat(row['Deal Price'] || row['deal price'] || row['Price'] || row['price']) || 0;
        const fee = parseFloat(row['Fee'] || row['fee']) || 0;
        const timestamp = row['Created Date'] || row['created date'] || row['Date'] || row['date'] || row['Time'] || row['time'];
        
        if (index < 3) { // Debug first few rows
          console.log(`🔵 KuCoin row ${index}:`, { symbol, side, quantity, price, fee, timestamp });
        }
        
        return {
          symbol,
          side,
          quantity,
          price,
          fee,
          timestamp,
          exchange: 'kucoin'
        };
      } catch (error) {
        console.error(`❌ Error parsing KuCoin row ${index}:`, error, row);
        return null;
      }
    }).filter((trade): trade is ExchangeTradeData => 
      trade !== null && trade.quantity > 0 && trade.price > 0
    );
  }

  // Extract symbol from trading pair (e.g., "BTCEUR" -> "BTC")
  private extractSymbolFromPair(pair: string): string {
    if (!pair) return '';
    
    pair = pair.toUpperCase().trim();
    
    // ✅ Handle separators first (most common and reliable)
    if (pair.includes('-')) {
      return pair.split('-')[0];
    }
    
    if (pair.includes('_')) {
      return pair.split('_')[0];
    }
    
    if (pair.includes('/')) {
      return pair.split('/')[0];
    }
    
    // ✅ Handle common base currencies (for pairs without separators like "BTCEUR")
    // Order matters: longer strings first to avoid false matches
    const baseCurrencies = [
      'USDT', 'USDC', 'BUSD', // Stablecoins first (longer strings)
      'EUR', 'USD', 'GBP', 'JPY', // Fiat currencies
      'BTC', 'ETH', 'BNB'  // Crypto base currencies
    ];
    
    for (const base of baseCurrencies) {
      if (pair.endsWith(base) && pair.length > base.length) {
        return pair.substring(0, pair.length - base.length);
      }
    }
    
    return pair;
  }

  // Convert trades to portfolio holdings
  private convertTradesToHoldings(trades: ExchangeTradeData[]): CryptoHolding[] {
    const holdings = new Map<string, { quantity: number, totalValue: number, trades: ExchangeTradeData[] }>();
    
    // Aggregate trades by symbol
    trades.forEach(trade => {
      const symbol = trade.symbol.toUpperCase();
      
      if (!holdings.has(symbol)) {
        holdings.set(symbol, { quantity: 0, totalValue: 0, trades: [] });
      }
      
      const holding = holdings.get(symbol)!;
      holding.trades.push(trade);
      
      if (trade.side === 'BUY') {
        holding.quantity += trade.quantity;
        holding.totalValue += trade.quantity * trade.price;
      } else {
        holding.quantity -= trade.quantity;
        holding.totalValue -= trade.quantity * trade.price;
      }
    });
    
    // Convert to CryptoHolding format
    const result: CryptoHolding[] = [];
    
    holdings.forEach((holding, symbol) => {
      if (holding.quantity > 0) { // Only include assets we still hold
        const currentPrice = this.getCurrentPrice(symbol, holding.trades);
        
        result.push({
          symbol: symbol,
          name: this.getCryptoName(symbol),
          price: currentPrice,
          holdings: holding.quantity,
          value: holding.quantity * currentPrice,
          change24h: 0, // Would need real-time data
          changePercent24h: 0 // Would need real-time data
        });
      }
    });
    
    return result;
  }

  // Get the most recent price for a symbol
  private getCurrentPrice(symbol: string, trades: ExchangeTradeData[]): number {
    if (trades.length === 0) return 0;
    
    // Sort by timestamp and get the most recent
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedTrades[0].price;
  }

  // Get crypto name from symbol
  private getCryptoName(symbol: string): string {
    const cryptoNames: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'BNB': 'Binance Coin',
      'USDC': 'USD Coin',
      'USDT': 'Tether',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'LINK': 'Chainlink'
    };
    
    return cryptoNames[symbol.toUpperCase()] || symbol;
  }

  // Spoji postojeće holdings s novim podacima
  private mergeHoldings(existingHoldings: CryptoHolding[], newHoldings: CryptoHolding[]): CryptoHolding[] {
    console.log('🔀 mergeHoldings called:', {
      existing: existingHoldings.length,
      new: newHoldings.length,
      existingSymbols: existingHoldings.map(h => h.symbol),
      newSymbols: newHoldings.map(h => h.symbol)
    });
    
    const mergedMap = new Map<string, CryptoHolding>();
    
    // Dodaj postojeće holdings
    existingHoldings.forEach(holding => {
      mergedMap.set(holding.symbol.toUpperCase(), { ...holding });
    });
    
    // Spoji s novim holdings
    newHoldings.forEach(newHolding => {
      const symbol = newHolding.symbol.toUpperCase();
      const existing = mergedMap.get(symbol);
      
      if (existing) {
        // Ako kriptovaluta već postoji, dodaj količine i ažuriraj prosječnu cijenu
        const totalHoldings = existing.holdings + newHolding.holdings;
        console.log(`🔀 Merging ${symbol}: ${existing.holdings} + ${newHolding.holdings} = ${totalHoldings}`);
        
        mergedMap.set(symbol, {
          symbol: symbol,
          name: existing.name, // Koristi postojeće ime
          price: newHolding.price, // Koristi novu cijenu (najnoviju)
          holdings: totalHoldings,
          value: totalHoldings * newHolding.price,
          change24h: newHolding.change24h, // Koristi novu promjenu
          changePercent24h: newHolding.changePercent24h
        });
      } else {
        // Ako je nova kriptovaluta, samo je dodaj
        console.log(`🔀 Adding new ${symbol}: ${newHolding.holdings}`);
        mergedMap.set(symbol, { ...newHolding });
      }
    });
    
    const result = Array.from(mergedMap.values()).filter(holding => holding.holdings > 0);
    console.log('🔀 Merge complete:', {
      result: result.length,
      symbols: result.map(h => `${h.symbol}:${h.holdings}`)
    });
    
    return result;
  }
}
