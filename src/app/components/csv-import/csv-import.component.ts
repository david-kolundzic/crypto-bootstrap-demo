import { Component, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CsvImportService,
  ImportResult,
} from '../../services/csv-import.service';
import { finalize, Subscription, tap } from 'rxjs';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './csv-import.component.html',
  styleUrls: [],
})
export class CsvImportComponent {
  // ✅ Novi output() function umjesto @Output()
  readonly dataImported = output<any[]>();

  // ✅ Output za reset na default holdings
  readonly resetToDefault = output<void>();

  isImporting = signal(false);
  importStatus = signal<ImportResult | null>(null);
  mergeMode = signal(false); // Default: Replace portfolio (not merge)

  // ✅ Angular 20 computed signal za success poruku
  readonly successMessage = computed(() => {
    const status = this.importStatus();
    if (!status?.success || !status?.data) return '';

    const count = status.data.length || 0;
    const mode = this.mergeMode() ? 'added' : 'imported';
    const exchange = status.exchange || 'unknown';
    const exchangeInfo = this.getExchangeDisplayInfo(exchange);

    if (exchange === 'cleared') {
      return '🗑️ Portfolio has been completely cleared - all crypto data removed';
    }

    return `✅ ${count} crypto${count === 1 ? '' : 's'} ${mode} from ${exchangeInfo.name}`;
  });

  // ✅ Angular 20 computed signal for status title
  readonly statusTitle = computed(() => {
    const status = this.importStatus();
    if (!status) return '';

    return status.success ? 'Import Successful!' : 'Import Error';
  });

  // ✅ Angular 20 computed signal za hasData - koristi signal iz servisa
  readonly hasDataSignal = computed(() => {
    return this.csvImportService.holdings().length > 0;
  });

  // ✅ Angular 20 computed signal za holdings count - koristi signal iz servisa
  readonly currentHoldingsCount = computed(() => {
    return this.csvImportService.holdings().length;
  });

  // 🔄 Backward compatibility metode za template
  hasData(): boolean {
    return this.hasDataSignal();
  }

  getCurrentHoldingsCount(): number {
    return this.currentHoldingsCount();
  }

  // ✅ Cancel import method
  cancelImport(): void {
    this.isImporting.set(false);
    this.importStatus.set({
      success: false,
      errors: ['Import was cancelled by user'],
    });
  }

  private readonly subscription = new Subscription();

  // ✅ Dodaj signal za drag & drop state
  isDragging = signal(false);

  constructor(private readonly csvImportService: CsvImportService) {}

  // ✅ Drag & Drop Event Handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.processFile(file);
    }
  }

  // ✅ Refaktoriraj postojeći onFileSelected da koristi processFile
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.processFile(file);
    
    // Clear file input
    event.target.value = '';
  }

  // ✅ Centraliziraj file processing logiku
  private processFile(file: File): void {
    // Validacija file type
    if (
      !file.name.toLowerCase().endsWith('.csv') &&
      !file.name.toLowerCase().endsWith('.txt')
    ) {
      this.importStatus.set({
        success: false,
        errors: ['Please select a CSV file (.csv or .txt)'],
      });
      return;
    }

    // Validacija file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.importStatus.set({
        success: false,
        errors: ['File size too large. Maximum size is 5MB.'],
      });
      return;
    }

    this.isImporting.set(true);
    this.importStatus.set(null);

    // Parse CSV file with error handling
    this.subscription.add(
      this.csvImportService
        .parseCsvFile(file, this.mergeMode())
        .pipe(
          tap((result) => {
            console.log('📁 CSV Import Component - mergeMode:', this.mergeMode());
            console.log('📁 CSV Import Component - result:', result);
            this.importStatus.set(result);
            if (result.success && result.data) {
              this.dataImported.emit(result.data);
              console.log('✅ CSV import successful:', result.data.length, 'holdings');
            }
          }),
          finalize(() => {
            // Reset import status after processing
            this.isImporting.set(false);
          })
        ) // End of pipe
        .subscribe({
          next: (result) => {
            this.importStatus.set(result);
          },
          error: (error) => {
            console.error('❌ CSV import error:', error);
            this.importStatus.set({
              success: false,
              errors: [`Unexpected error: ${error.message || error}`],
            });
          },
        }) // End of subscribe
    ); // End of subscription.add
  }

  downloadTemplate(): void {
    this.csvImportService.downloadTemplate();
  }

  exportCsv(): void {
    this.csvImportService.downloadCsv();
  }

  clearStatus(): void {
    this.importStatus.set(null);
  }

  // ✅ Clearer exchange descriptions
  getExchangeDisplayInfo(
    exchange: string
  ): { name: string; description: string; icon: string } {
    const exchangeInfo: {
      [key: string]: { name: string; description: string; icon: string };
    } = {
      binance: {
        name: 'Binance',
        description: 'Spot & Futures trading',
        icon: 'bi-currency-bitcoin',
      },
      bitpanda: {
        name: 'Bitpanda',
        description: 'European crypto platform',
        icon: 'bi-gem',
      },
      coinbase: {
        name: 'Coinbase Pro',
        description: 'US crypto exchange',
        icon: 'bi-shield-check',
      },
      kraken: {
        name: 'Kraken',
        description: 'Professional crypto exchange',
        icon: 'bi-bank',
      },
      kucoin: {
        name: 'KuCoin',
        description: 'Global crypto platform',
        icon: 'bi-globe',
      },
      unknown: {
        name: 'Custom Format',
        description: 'Symbol, Name, Price, Amount',
        icon: 'bi-file-earmark-spreadsheet',
      },
    };

    return exchangeInfo[exchange] || exchangeInfo['unknown'];
  }

  toggleMergeMode(): void {
    this.mergeMode.set(!this.mergeMode());
  }

  setImportMode(merge: boolean): void {
    this.mergeMode.set(merge);
  }

  clearAllData(): void {
    const currentCount = this.getCurrentHoldingsCount();
    const recordWord = currentCount === 1 ? 'crypto' : 'cryptos';

    const message =
      `🚨 PERMANENT DELETION OF ENTIRE PORTFOLIO!\n\n` +
      `⚠️ DANGER: This action will PERMANENTLY delete:\n\n` +
      `❌ ${currentCount} ${recordWord} from your portfolio\n` +
      `❌ All imported data (Binance, Coinbase, Kraken, etc.)\n` +
      `❌ All content - portfolio will be completely empty\n\n` +
      `🔴 CRITICAL: THIS ACTION CANNOT BE UNDONE!\n` +
      `🔴 No "Undo" option - data will be lost forever!\n\n` +
      `If you continue, you will need to re-import all CSV files.\n\n` +
      `💀 Do you REALLY want to PERMANENTLY DELETE the entire portfolio with ${currentCount} ${recordWord}?`;

    if (confirm(message)) {
      // Additional security check
      const doubleCheck = confirm(
        `⚠️ LAST CHANCE!\n\nAre you 100% certain you want to delete all ${currentCount} ${recordWord}?\n\nClick "OK" for PERMANENT DELETION or "Cancel" to go back.`
      );

      if (doubleCheck) {
        console.log('🔴 Clear All Data: Starting clearance process');
        console.log('🔴 Clear All Data: Current holdings before clear:', this.csvImportService.holdings().length);
        
        this.csvImportService.updateHoldings([]);
        console.log('🔴 Clear All Data: Holdings updated to empty array');
        console.log('🔴 Clear All Data: Service holdings after clear:', this.csvImportService.holdings().length);
        
        this.importStatus.set({
          success: true,
          data: [],
          exchange: 'cleared',
        });
        console.log('🔴 Clear All Data: Import status set to cleared');

        // Emit empty data to parent component
        this.dataImported.emit([]);
        console.log('🔴 Clear All Data: Emitted empty array to parent');
      }
    }
  }

  resetToDefaultHoldings(): void {
    this.resetToDefault.emit();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
