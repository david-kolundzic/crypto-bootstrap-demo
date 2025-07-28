import { Component, input, computed } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <canvas
        baseChart
        [data]="pieChartData()"
        [options]="pieChartOptions"
        type="pie"
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
export class PieChartComponent {
  // ✅ Angular 20 - Modern input signals
  readonly data = input<number[]>([]);
  readonly labels = input<string[]>([]);
  readonly colors = input<string[]>([
    '#0d6efd', '#6f42c1', '#d63384', '#dc3545', 
    '#fd7e14', '#ffc107', '#198754', '#20c997'
  ]);

  // ✅ Angular 20 - Computed signal for reactive chart data
  readonly pieChartData = computed((): ChartConfiguration<'pie'>['data'] => ({
    labels: this.labels(),
    datasets: [{
      data: this.data(),
      backgroundColor: this.colors(),
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  }));

  // ✅ Angular 20 - Static chart options (immutable configuration)
  public readonly pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.formattedValue;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.raw as number / total) * 100).toFixed(1);
            return `${label}: £${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2
      }
    }
  };
}
