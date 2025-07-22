import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

export interface CandlestickData {
  x: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

@Component({
  selector: 'app-candlestick-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <canvas
        baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="bar"
        class="chart">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
    }
    .chart {
      max-height: 400px;
    }
  `]
})
export class CandlestickChartComponent implements OnInit {
  @Input() data: CandlestickData[] = [];
  @Input() label: string = 'Price Movement';

  public chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  public chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      }
    }
  };

  ngOnInit() {
    this.updateChart();
  }

  ngOnChanges() {
    this.updateChart();
  }

  private updateChart() {
    if (!this.data || this.data.length === 0) return;

    const labels = this.data.map(item => item.x);
    const highs = this.data.map(item => item.high);
    const lows = this.data.map(item => item.low);
    const opens = this.data.map(item => item.open);
    const closes = this.data.map(item => item.close);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'High',
          data: highs,
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: '#28a745',
          borderWidth: 1
        },
        {
          label: 'Low',
          data: lows,
          backgroundColor: 'rgba(220, 53, 69, 0.8)',
          borderColor: '#dc3545',
          borderWidth: 1
        },
        {
          label: 'Open',
          data: opens,
          backgroundColor: 'rgba(0, 123, 255, 0.6)',
          borderColor: '#007bff',
          borderWidth: 1
        },
        {
          label: 'Close',
          data: closes,
          backgroundColor: 'rgba(108, 117, 125, 0.6)',
          borderColor: '#6c757d',
          borderWidth: 1
        }
      ]
    };
  }
}
