import { Component, input, computed } from '@angular/core';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <canvas
        baseChart
        [data]="lineChartData()"
        [options]="lineChartOptions"
        type="line"
        class="chart">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }
    .chart {
      max-height: 300px;
    }
  `]
})
export class LineChartComponent {
  // ✅ Angular 20 - Modern input signals
  readonly data = input<number[]>([]);
  readonly labels = input<string[]>([]);
  readonly label = input<string>('Portfolio Value');
  readonly borderColor = input<string>('#0d6efd');
  readonly backgroundColor = input<string>('rgba(13, 110, 253, 0.1)');

  // ✅ Angular 20 - Static chart configuration
  public readonly lineChartType: ChartType = 'line';

  // ✅ Angular 20 - Computed signal for reactive chart data
  readonly lineChartData = computed((): ChartConfiguration<'line'>['data'] => ({
    labels: this.labels(),
    datasets: [{
      data: this.data(),
      label: this.label(),
      borderColor: this.borderColor(),
      backgroundColor: this.backgroundColor(),
      fill: true,
      tension: 0.4
    }]
  }));

  // ✅ Angular 20 - Static chart options (immutable configuration)
  public readonly lineChartOptions: ChartOptions<'line'> = {
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
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 3,
        hoverRadius: 6
      }
    }
  };
}
