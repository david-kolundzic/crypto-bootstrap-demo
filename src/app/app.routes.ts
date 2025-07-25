import { Routes } from '@angular/router';

import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { PortfolioComponent as PortfolioComponentOld  } from './components/portfolio-copy/portfolio.component';
import { TradingComponent } from './components/trading/trading.component';
import { MarketComponent } from './components/market/market.component';
import { SettingsComponent } from './components/settings/settings.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/portfolio', pathMatch: 'full' },

  { path: 'portfolio', component: PortfolioComponent },
  { path: 'portfolio-old', component: PortfolioComponentOld },
  { path: 'trading', component: TradingComponent },
  { path: 'market', component: MarketComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' }
];
