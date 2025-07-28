import { Component, signal, effect, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
    // ✅ Angular 20 - Signal for theme state
    readonly currentTheme = signal<'light' | 'dark'>('dark');

    constructor() {
        // ✅ Angular 20 - Effect for reactive theme application
        effect(() => {
            const theme = this.currentTheme();
            document.documentElement.setAttribute('data-bs-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    ngOnInit() {
        // Load theme from localStorage on initialisation
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
        this.currentTheme.set(savedTheme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
        this.currentTheme.set(newTheme);
    }
}
