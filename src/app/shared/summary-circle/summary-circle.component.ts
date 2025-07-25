import { Component, input, Input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-summary-circle',
  imports: [ DecimalPipe],
  templateUrl: './summary-circle.component.html',
  styleUrl: './summary-circle.component.scss'
})
export class SummaryCircleComponent {
  // @Input() title = '';
  // @Input({ required: true }) totalValue = signal<number>(0);
  readonly title =  input<string>('');
  readonly totalValue = input<number>(0);
  // readonly totalChange24h = input<number>(0);
  readonly totalChangePercent24h = input<number>(0);
  
}
