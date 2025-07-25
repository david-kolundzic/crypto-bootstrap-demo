import { Injectable, signal, effect } from '@angular/core';
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
  // ✅ Angular 20 signal umjesto BehaviorSubject
  private readonly holdingsSignal = signal<CryptoHolding[]>([]);
  
  // ✅ Readonly getter za holdings signal
  get holdings() {
    return this.holdingsSignal.asReadonly();
  }

  // 🔄 Backward compatibility za Observable (ako je negdje korišten)
  private readonly holdingsSubject = new BehaviorSubject<CryptoHolding[]>([]);
  public holdings$ = this.holdingsSubject.asObservable();

  constructor() {
    // ✅ Sinkronizacija signala sa BehaviorSubject za backward compatibility
    effect(() => {
      this.holdingsSubject.next(this.holdingsSignal());
    });
  }

  // Exchange detection patterns
  private readonly exchangePatterns = {
    binance: ['Date(UTC)', 'Pair', 'Side', 'Price', 'Executed', 'Amount', 'Fee'],
    bitpanda: ['Transaction ID', 'Timestamp', 'Transaction Type', 'In/Out', 'Amount Fiat', 'Fiat', 'Amount Asset', 'Asset'],
    coinbase: ['Timestamp', 'Transaction Type', 'Asset', 'Quantity Transacted', 'EUR Spot Price at Transaction'],
    kraken: ['txid', 'ordertxid', 'pair', 'time', 'type', 'ordertype', 'price', 'cost', 'fee', 'vol'],
    kucoin: ['UID', 'Account Type', 'Order ID', 'Symbol', 'Deal Price', 'Deal Value', 'Deal Volume', 'Direction']
  };

  // Parsiraj CSV fajl
  parseCsvFile(file: File, mergeWithExisting: boolean = false): Observable<ImportResult> {
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
                const mergedHoldings = this.mergeHoldings(this.getCurrentHoldings(), importResult.data);
                this.updateHoldings(mergedHoldings);
                importResult.data = mergedHoldings;
              } else {
                this.updateHoldings(importResult.data);
              }
            }
            
            observer.next(importResult);
            observer.complete();
          }  catch (error) {
            observer.error(new Error(`Error processing file: ${error}`));
          }
        },
        error: (error: Error) => {
          observer.error(new Error(`Parse error: ${error.message}`));
        }
      });
    }).pipe(
      catchError(error => of({
        success: false,
        errors: [`Error processing file: ${error.message}`]
      }))
    );
  }

  // Parsiraj CSV string koristeći PapaParse
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

  // ✅ Ažuriraj holdings podatke sa signal
  updateHoldings(holdings: CryptoHolding[]): void {
    this.holdingsSignal.set(holdings);
  }

  // Dodaj pojedinačni holding k postojećima
  addHolding(newHolding: CryptoHolding): void {
    const currentHoldings = this.getCurrentHoldings();
    const mergedHoldings = this.mergeHoldings(currentHoldings, [newHolding]);
    this.updateHoldings(mergedHoldings);
  }

  // Ukloni holding po simbolu
  removeHolding(symbol: string): void {
    const currentHoldings = this.getCurrentHoldings();
    const filteredHoldings = currentHoldings.filter(h => h.symbol.toUpperCase() !== symbol.toUpperCase());
    this.updateHoldings(filteredHoldings);
  }

  // ✅ Dobij trenutne holdings iz signal
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
    
    // Check each exchange pattern
    for (const [exchange, pattern] of Object.entries(this.exchangePatterns)) {
      const matches = pattern.filter(col => 
        headers.some(header => 
          header.toLowerCase().includes(col.toLowerCase()) || 
          col.toLowerCase().includes(header.toLowerCase())
        )
      );
      
      // If most columns match, it's likely this exchange
      if (matches.length >= Math.ceil(pattern.length * 0.6)) {
        return exchange;
      }
    }
    
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
    return data.map(row => ({
      symbol: this.extractSymbolFromPair(row['pair']),
      side: this.normalizeTradeSide(row['type']),
      quantity: parseFloat(row['vol']) || 0,
      price: parseFloat(row['price']) || (parseFloat(row['cost']) / parseFloat(row['vol'])) || 0,
      fee: parseFloat(row['fee']) || 0,
      timestamp: row['time'],
      exchange: 'kraken'
    })).filter(trade => trade.quantity > 0 && trade.price > 0);
  }

  // Parse KuCoin CSV format
  private parseKuCoinData(data: any[]): ExchangeTradeData[] {
    return data.map(row => ({
      symbol: this.extractSymbolFromPair(row['Symbol']),
      side: this.normalizeTradeSide(row['Direction']),
      quantity: parseFloat(row['Deal Volume']) || 0,
      price: parseFloat(row['Deal Price']) || 0,
      fee: parseFloat(row['Fee']) || 0,
      timestamp: row['Created Date'],
      exchange: 'kucoin'
    })).filter(trade => trade.quantity > 0 && trade.price > 0);
  }

  // Extract symbol from trading pair (e.g., "BTCEUR" -> "BTC")
  private extractSymbolFromPair(pair: string): string {
    if (!pair) return '';
    
    // Common base currencies to remove
    const baseCurrencies = ['EUR', 'USD', 'USDT', 'USDC', 'BTC', 'ETH'];
    
    for (const base of baseCurrencies) {
      if (pair.endsWith(base)) {
        return pair.replace(base, '');
      }
      if (pair.includes('-')) {
        return pair.split('-')[0];
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
        mergedMap.set(symbol, { ...newHolding });
      }
    });
    
    return Array.from(mergedMap.values()).filter(holding => holding.holdings > 0);
  }
}
