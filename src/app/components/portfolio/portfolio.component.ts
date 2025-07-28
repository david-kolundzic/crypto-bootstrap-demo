import {
  Component,
  signal,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LineChartComponent } from '../charts/line-chart/line-chart.component';
import { PieChartComponent } from '../charts/pie-chart/pie-chart.component';
import { CsvImportComponent } from '../csv-import/csv-import.component';
import {
  CsvImportService,
  CryptoHolding,
} from '../../services/csv-import.service';
import { HoldingsDataService } from '../../services/holdings-data.service';
import { PortfolioCalculationService } from '../../services/portfolio-calculation.service';
import { TitleComponent } from '../../shared/title/title.component';
import { SummaryCircleComponent } from '../../shared/summary-circle/summary-circle.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    LineChartComponent,
    PieChartComponent,
    CsvImportComponent,
    TitleComponent,
    SummaryCircleComponent,
  ],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
})
export class PortfolioComponent {
  // ✅ Angular 20 - Inject services using modern pattern
  private readonly csvImportService = inject(CsvImportService);
  private readonly holdingsDataService = inject(HoldingsDataService);
  private readonly calculationService = inject(PortfolioCalculationService);
  
  // ✅ Angular 20 - Title as string
  readonly title = 'Portfolio Dashboard';
  
  // ✅ Angular 20 - Local holdings signal that syncs with service
  readonly holdings = signal<CryptoHolding[]>([]);
  
  // ✅ Angular 20 - Flag to track explicit user actions
  private readonly userExplicitlyClearedPortfolio = signal<boolean>(false);

  // ✅ Angular 20 - Computed signals for loading and error states
  readonly isLoadingDefaultData = this.holdingsDataService.isLoading;
  readonly defaultDataError = this.holdingsDataService.error;

  // ✅ Angular 20 - Computed signals for chart data (auto-update when holdings change)
  readonly portfolioPerformanceData = this.calculationService.generatePortfolioPerformanceData(this.holdings);
  readonly portfolioLabels = this.calculationService.generatePortfolioLabels(this.holdings);
  
  // ✅ Angular 20 - Asset allocation computed signals
  readonly assetAllocationData = this.calculationService.generateAssetAllocationData(this.holdings);
  readonly assetAllocationLabels = this.calculationService.generateAssetAllocationLabels(this.holdings);
  readonly assetAllocationColors = this.calculationService.generateEnhancedAssetAllocationColors(this.holdings);

  // ✅ Angular 20 - Portfolio summary computed signals
  readonly totalPortfolioValueSignal = this.calculationService.calculateTotalValue(this.holdings);
  readonly totalChange24hSignal = this.calculationService.calculateTotal24hChange(this.holdings);
  readonly totalChangePercent24hSignal = this.calculationService.calculateTotal24hChangePercent(
    this.totalPortfolioValueSignal,
    this.totalChange24hSignal
  );

  // ✅ Angular 20 - Effects for reactive data management
  private readonly initializeDefaultHoldings = effect(() => {
    const defaultHoldings = this.holdingsDataService.defaultHoldings();
    const currentImportedHoldings = this.csvImportService.holdings();
    const currentLocalHoldings = this.holdings();
    const isLoading = this.holdingsDataService.isLoading();
    
    // Trigger loading if data not loaded and not currently loading
    if (defaultHoldings.length === 0 && !isLoading) {
      this.holdingsDataService.loadDefaultHoldings().subscribe();
    }
    
    // Set default holdings if available and no data exists (unless user explicitly cleared)
    if (defaultHoldings.length > 0 && 
        currentImportedHoldings.length === 0 && 
        currentLocalHoldings.length === 0 && 
        !this.userExplicitlyClearedPortfolio()) {
      this.holdings.set(defaultHoldings);
      this.csvImportService.updateHoldings(defaultHoldings);
    }
  });

  private readonly syncImportedHoldings = effect(() => {
    const importedHoldings = this.csvImportService.holdings();
    // Always sync holdings (including empty arrays for clearing)
    this.holdings.set(importedHoldings);
  });

  // ✅ Angular 20 - Event handlers for CSV import
  onDataImported(importedData: CryptoHolding[]): void {
    // Manage user action flags (holdings sync handled by effect)
    if (importedData.length === 0) {
      this.userExplicitlyClearedPortfolio.set(true);
    } else {
      this.userExplicitlyClearedPortfolio.set(false);
    }
  }

  // ✅ Angular 20 - Method to reset portfolio to default holdings
  resetToDefaultHoldings(): void {
    this.userExplicitlyClearedPortfolio.set(false);
    const defaultHoldings = this.holdingsDataService.defaultHoldings();
    if (defaultHoldings.length > 0) {
      this.holdings.set(defaultHoldings);
      this.csvImportService.updateHoldings(defaultHoldings);
    } else {
      // If default holdings not loaded, load them first
      this.holdingsDataService.loadDefaultHoldings().subscribe(() => {
        const newDefaultHoldings = this.holdingsDataService.defaultHoldings();
        this.holdings.set(newDefaultHoldings);
        this.csvImportService.updateHoldings(newDefaultHoldings);
      });
    }
  }
}
