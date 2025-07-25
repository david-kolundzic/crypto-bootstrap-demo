import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
    currentTheme: 'light' | 'dark' = 'dark';

    ngOnInit() {
        this.currentTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
        this.applyTheme();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);

    }

    private applyTheme() {
        document.documentElement.setAttribute('data-bs-theme', this.currentTheme);
    }
}
