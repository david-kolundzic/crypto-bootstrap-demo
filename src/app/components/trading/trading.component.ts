import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CandlestickChartComponent,
  CandlestickData,
} from '../charts/candlestick-chart/candlestick-chart.component';
import { TitleComponent } from '../../shared/title/title.component';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [CommonModule, CandlestickChartComponent, TitleComponent],
  templateUrl: './trading.component.html',
  styleUrls: ['./trading.component.scss'],
})
export class TradingComponent {
  titleSignal = signal('Trading Dashboard');

  candlestickData = signal<CandlestickData[]>([
    { x: '09:00', open: 66500, high: 67200, low: 66200, close: 67000 },
    { x: '09:30', open: 67000, high: 67800, low: 66800, close: 67500 },
    { x: '10:00', open: 67500, high: 68200, low: 67200, close: 67800 },
    { x: '10:30', open: 67800, high: 68500, low: 67500, close: 68200 },
    { x: '11:00', open: 68200, high: 68800, low: 67900, close: 68500 },
    { x: '11:30', open: 68500, high: 69000, low: 68200, close: 68800 },
    { x: '12:00', open: 68800, high: 69200, low: 68500, close: 69000 },
    { x: '12:30', open: 69000, high: 69500, low: 68700, close: 69200 },
    { x: '13:00', open: 69200, high: 69800, low: 69000, close: 69500 },
    { x: '13:30', open: 69500, high: 70000, low: 69200, close: 69800 },
  ]);
}
