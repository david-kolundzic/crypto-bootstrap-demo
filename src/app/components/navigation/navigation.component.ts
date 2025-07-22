import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#">
          <span class="badge bg-primary rounded-pill me-2">K</span>
          KryptoApp
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav d-flex gap-5 me-auto">
            
            <li class="nav-item">
              <a class="nav-link" routerLink="/portfolio" routerLinkActive="active">
                <i class="bi bi-pie-chart me-1"></i>Portfolio
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/trading" routerLinkActive="active">
                <i class="bi bi-graph-up me-1"></i>Trading
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/market" routerLinkActive="active">
                <i class="bi bi-currency-bitcoin me-1"></i>Market
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/settings" routerLinkActive="active">
                <i class="bi bi-gear me-1"></i>Settings
              </a>
            </li>
          </ul>
          
          <div class="navbar-nav">
            <div class="nav-item dropdown">
              <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                  <span class="text-white fw-bold">JD</span>
                </div>
                JOHN DOE
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#">Profile</a></li>
                <li><a class="dropdown-item" href="#">Account</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#">Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-brand {
      font-size: 1.5rem;
    }
    
    .nav-link {
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover {
      color: #007bff !important;
    }
    
    .nav-link.active {
      color: #007bff !important;
      background-color: rgba(0, 123, 255, 0.1);
      border-radius: 0.375rem;
    }
  `]
})
export class NavigationComponent {
}
