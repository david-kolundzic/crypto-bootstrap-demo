import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitleComponent } from "../../shared/title/title.component";

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, TitleComponent],
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss'],
  
})
export class MarketComponent {
    titleSignal = signal<string>('Market Overview');
    
    // Additional properties and methods for market functionality can be added here
}
