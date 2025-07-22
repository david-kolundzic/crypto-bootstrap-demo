import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
}

@Injectable({
  providedIn: 'root'
})
export class CsvImportService {
  private holdingsSubject = new BehaviorSubject<CryptoHolding[]>([]);
  public holdings$ = this.holdingsSubject.asObservable();

  constructor() { }

  // Parsiraj CSV fajl
  parseCsvFile(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      Papa.parse<any>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normaliziraj header nazive
          return header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        },
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const importResult = this.processPapaParseResults(results);
            
            if (importResult.success && importResult.data) {
              this.updateHoldings(importResult.data);
            }
            
            resolve(importResult);
          } catch (error) {
            resolve({
              success: false,
              errors: [`Error processing file: ${error}`]
            });
          }
        },
        error: (error: Error) => {
          resolve({
            success: false,
            errors: [`Parse error: ${error.message}`]
          });
        }
      });
    });
  }

  // Parsiraj CSV string koristeći PapaParse
  parseCsvString(csvString: string): Promise<ImportResult> {
    return new Promise((resolve) => {
      Papa.parse<any>(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          return header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        },
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const importResult = this.processPapaParseResults(results);
            resolve(importResult);
          } catch (error) {
            resolve({
              success: false,
              errors: [`Error processing CSV: ${error}`]
            });
          }
        },
        error: (error: Error) => {
          resolve({
            success: false,
            errors: [`Parse error: ${error.message}`]
          });
        }
      });
    });
  }

  // Procesiraj rezultate iz PapaParse
  private processPapaParseResults(results: Papa.ParseResult<any>): ImportResult {
    const errors: string[] = [];
    const holdings: CryptoHolding[] = [];

    // Dodaj PapaParse greške ako postoje
    if (results.errors && results.errors.length > 0) {
      results.errors.forEach(error => {
        const rowInfo = error.row !== undefined ? ` (Row ${error.row + 1})` : '';
        errors.push(`Parse error${rowInfo}: ${error.message}`);
      });
    }

    // Provjeri da li imamo podatke
    if (!results.data || results.data.length === 0) {
      return {
        success: false,
        errors: ['No valid data found in CSV file']
      };
    }

    // Provjeri header kolone - očekujemo normalized nazive
    const firstRow = results.data[0];
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
    results.data.forEach((row: any, index: number) => {
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

  // Ažuriraj holdings podatke
  updateHoldings(holdings: CryptoHolding[]): void {
    this.holdingsSubject.next(holdings);
  }

  // Dobij trenutne holdings
  getCurrentHoldings(): CryptoHolding[] {
    return this.holdingsSubject.value;
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
}
