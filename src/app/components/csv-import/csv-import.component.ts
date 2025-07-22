import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvImportService, ImportResult } from '../../services/csv-import.service';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="csv-import-container">
      <!-- Import Button -->
      <div class="d-flex gap-2 mb-3">
        <button 
          class="btn btn-outline-primary"
          (click)="fileInput.click()"
          [disabled]="isImporting()">
          <i class="bi bi-upload me-2"></i>
          {{ isImporting() ? 'Importing...' : 'Import CSV' }}
        </button>
        
        <button 
          class="btn btn-outline-secondary"
          (click)="downloadTemplate()"
          title="Download CSV template">
          <i class="bi bi-download me-2"></i>
          Template
        </button>
        
        <button 
          class="btn btn-outline-success"
          (click)="exportCsv()"
          [disabled]="!hasData()"
          title="Export current data">
          <i class="bi bi-file-earmark-arrow-down me-2"></i>
          Export
        </button>
      </div>

      <!-- Hidden File Input -->
      <input 
        #fileInput
        type="file" 
        accept=".csv,.txt"
        (change)="onFileSelected($event)"
        class="d-none">

      <!-- Import Status -->
      <div *ngIf="importStatus()" class="mb-3">
        <div 
          [class]="'alert alert-' + (importStatus()?.success ? 'success' : 'danger')"
          class="mb-0">
          <div class="d-flex align-items-center">
            <i [class]="'bi me-2 ' + (importStatus()?.success ? 'bi-check-circle' : 'bi-exclamation-triangle')"></i>
            <div class="flex-grow-1">
              <strong>
                {{ importStatus()?.success ? 'Import Successful!' : 'Import Failed' }}
              </strong>
              <div *ngIf="importStatus()?.success && importStatus()?.data" class="small">
                Successfully imported {{ importStatus()?.data?.length }} records
              </div>
            </div>
            <button 
              type="button" 
              class="btn-close" 
              (click)="clearStatus()">
            </button>
          </div>
          
          <!-- Error Details -->
          <div *ngIf="importStatus()?.errors && importStatus()!.errors!.length > 0" class="mt-2">
            <details>
              <summary class="text-danger">Show {{ importStatus()!.errors!.length }} error(s)</summary>
              <ul class="mt-2 mb-0">
                <li *ngFor="let error of importStatus()!.errors" class="small">{{ error }}</li>
              </ul>
            </details>
          </div>
        </div>
      </div>

      <!-- CSV Format Guide -->
      <div class="card border-0 bg-light">
        <div class="card-body py-3">
          <h6 class="card-title mb-2">
            <i class="bi bi-info-circle me-2"></i>CSV Format Guide
          </h6>
          <p class="card-text small mb-2">
            Your CSV file should contain the following columns:
          </p>
          <div class="row">
            <div class="col-md-6">
              <ul class="small mb-0">
                <li><code>Symbol</code> - Crypto symbol (e.g., BTC, ETH)</li>
                <li><code>Name</code> - Full name (e.g., Bitcoin, Ethereum)</li>
                <li><code>Price</code> - Current price in USD</li>
                <li><code>Holdings</code> - Amount you own</li>
              </ul>
            </div>
            <div class="col-md-6">
              <ul class="small mb-0">
                <li><code>Value</code> - Total value (optional, will be calculated)</li>
                <li><code>Change24h</code> - 24h price change in USD</li>
                <li><code>ChangePercent24h</code> - 24h change percentage</li>
              </ul>
            </div>
          </div>
          <div class="mt-2">
            <small class="text-muted">
              <strong>Example:</strong> BTC,Bitcoin,67500.00,0.5,33750.00,1234.56,1.86
            </small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .csv-import-container {
      max-width: 100%;
    }
    
    .alert {
      border-radius: 0.5rem;
    }
    
    .btn {
      border-radius: 0.375rem;
    }
    
    code {
      background-color: rgba(13, 110, 253, 0.1);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.875em;
    }
    
    details summary {
      cursor: pointer;
      user-select: none;
    }
    
    details summary:hover {
      text-decoration: underline;
    }
  `]
})
export class CsvImportComponent {
  @Output() dataImported = new EventEmitter<any[]>();
  
  isImporting = signal(false);
  importStatus = signal<ImportResult | null>(null);

  constructor(private csvImportService: CsvImportService) {}

  async onFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    // Validacija file type
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      this.importStatus.set({
        success: false,
        errors: ['Please select a CSV file (.csv or .txt)']
      });
      return;
    }

    // Validacija file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.importStatus.set({
        success: false,
        errors: ['File size too large. Maximum size is 5MB.']
      });
      return;
    }

    this.isImporting.set(true);
    this.importStatus.set(null);

    try {
      const result = await this.csvImportService.parseCsvFile(file);
      this.importStatus.set(result);
      
      if (result.success && result.data) {
        this.dataImported.emit(result.data);
      }
    } catch (error) {
      this.importStatus.set({
        success: false,
        errors: [`Unexpected error: ${error}`]
      });
    } finally {
      this.isImporting.set(false);
      // Clear file input
      event.target.value = '';
    }
  }

  downloadTemplate(): void {
    this.csvImportService.downloadTemplate();
  }

  exportCsv(): void {
    this.csvImportService.downloadCsv();
  }

  hasData(): boolean {
    return this.csvImportService.getCurrentHoldings().length > 0;
  }

  clearStatus(): void {
    this.importStatus.set(null);
  }
}
