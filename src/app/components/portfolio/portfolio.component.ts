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
  // Inject services using the new Angular pattern
  private readonly csvImportService = inject(CsvImportService);
  private readonly holdingsDataService = inject(HoldingsDataService);
  private readonly calculationService = inject(PortfolioCalculationService);
  
  // Use signal for title to allow reactive updates
  titleSignal = signal('Portfolio Dashboard');
  
  // Holdings signal - will be populated from service or CSV import
  holdings = signal<CryptoHolding[]>([]);

  // ✅ Effect za inicijalizaciju default holdings - automatski se pokreće
  private readonly initializeDefaultHoldings = effect(() => {
    const defaultHoldings = this.holdingsDataService.defaultHoldings();
    const currentImportedHoldings = this.csvImportService.holdings();
    const isLoading = this.holdingsDataService.isLoading();
    
    // Pokreni učitavanje ako podaci nisu učitani i nije u tijeku učitavanje
    if (defaultHoldings.length === 0 && !isLoading) {
      this.holdingsDataService.loadDefaultHoldings().subscribe();
    }
    
    // Postavi default holdings samo ako nema uvezenih podataka i default podaci su učitani
    if (defaultHoldings.length > 0 && currentImportedHoldings.length === 0) {
      this.holdings.set(defaultHoldings);
      this.csvImportService.updateHoldings(defaultHoldings);
    }
  });

  // ✅ Effect za praćenje promjena u csvImportService.holdings signal
  private readonly syncImportedHoldings = effect(() => {
    const importedHoldings = this.csvImportService.holdings();
    if (importedHoldings.length > 0) {
      this.holdings.set(importedHoldings);
      // No need to call updateChartData() - computed signals will update automatically
    }
  });

  // Access loading and error states from the service
  readonly isLoadingDefaultData = this.holdingsDataService.isLoading;
  readonly defaultDataError = this.holdingsDataService.error;

  // Chart data - computed via calculation service
  readonly portfolioPerformanceData = this.calculationService.generatePortfolioPerformanceData(this.holdings);
  readonly portfolioLabels = this.calculationService.generatePortfolioLabels(this.holdings);
  
  // Asset allocation chart data - computed via calculation service  
  readonly assetAllocationData = this.calculationService.generateAssetAllocationData(this.holdings);
  readonly assetAllocationLabels = this.calculationService.generateAssetAllocationLabels(this.holdings);
  readonly assetAllocationColors = this.calculationService.generateEnhancedAssetAllocationColors(this.holdings);

  // Portfolio summary calculations - computed via calculation service
  readonly totalPOrtfolioValueSignal = this.calculationService.calculateTotalValue(this.holdings);
  readonly totalChange24hSignal = this.calculationService.calculateTotal24hChange(this.holdings);
  readonly totalChangePercent24hSignal = this.calculationService.calculateTotal24hChangePercent(
    this.totalPOrtfolioValueSignal,
    this.totalChange24hSignal
  );

  onDataImported(importedData: CryptoHolding[]): void {
    // Ova metoda će biti pozvana kada CSV import komponenta uspješno učita podatke
    this.holdings.set(importedData);
    // No need to call updateChartData() - computed signals will update automatically
  }
}
