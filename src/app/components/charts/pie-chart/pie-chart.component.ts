import { Component, Input, OnInit } from '@angular/core';
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
        [data]="pieChartData"
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
export class PieChartComponent implements OnInit {
  @Input() data: number[] = [];
  @Input() labels: string[] = [];
  @Input() colors: string[] = [
    '#0d6efd', '#6f42c1', '#d63384', '#dc3545', 
    '#fd7e14', '#ffc107', '#198754', '#20c997'
  ];

  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: []
  };

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
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
    this.pieChartData = {
      labels: this.labels,
      datasets: [{
        data: this.data,
        backgroundColor: this.colors.slice(0, this.data.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
}
