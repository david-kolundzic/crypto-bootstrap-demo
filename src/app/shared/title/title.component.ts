import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-title',
  imports: [],
  templateUrl: './title.component.html',
  styles: ``
})
export class TitleComponent {
  
  @Input({ required: true }) title = signal<string>('');
  
}
