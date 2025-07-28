import { Component, input } from '@angular/core';

@Component({
  selector: 'app-title',
  imports: [],
  templateUrl: './title.component.html',
  styles: ``
})
export class TitleComponent {
  // ✅ Angular 20 - Modern input signal (required)
  readonly title = input.required<string>();
}
