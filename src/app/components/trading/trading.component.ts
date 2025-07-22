import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandlestickChartComponent, CandlestickData } from '../charts/candlestick-chart/candlestick-chart.component';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [CommonModule, CandlestickChartComponent],
  template: `
    <div class="container-fluid py-4">
      <h2 class="h3 mb-4 text-dark fw-bold">Trading</h2>
      
      <div class="row">
        <!-- Trading Interface -->
        <div class="col-lg-4 mb-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0">
              <ul class="nav nav-pills" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#buy-tab">Buy</button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" data-bs-toggle="pill" data-bs-target="#sell-tab">Sell</button>
                </li>
              </ul>
            </div>
            <div class="card-body">
              <div class="tab-content">
                <div class="tab-pane fade show active" id="buy-tab">
                  <form>
                    <div class="mb-3">
                      <label class="form-label">You're buying</label>
                      <div class="input-group">
                        <select class="form-select">
                          <option>Bitcoin (BTC)</option>
                          <option>Ethereum (ETH)</option>
                          <option>Cardano (ADA)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Amount</label>
                      <div class="input-group">
                        <input type="number" class="form-control" placeholder="0.00" step="0.0001">
                        <span class="input-group-text">BTC</span>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">You'll pay</label>
                      <div class="input-group">
                        <input type="number" class="form-control" placeholder="0.00" readonly>
                        <span class="input-group-text">USD</span>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <div class="d-flex justify-content-between text-muted small">
                        <span>Current price:</span>
                        <span>$67,500.00</span>
                      </div>
                      <div class="d-flex justify-content-between text-muted small">
                        <span>Trading fee:</span>
                        <span>$5.25</span>
                      </div>
                    </div>
                    
                    <button type="submit" class="btn btn-success w-100 fw-bold">
                      Buy Bitcoin
                    </button>
                  </form>
                </div>
                
                <div class="tab-pane fade" id="sell-tab">
                  <form>
                    <div class="mb-3">
                      <label class="form-label">You're selling</label>
                      <div class="input-group">
                        <select class="form-select">
                          <option>Bitcoin (BTC)</option>
                          <option>Ethereum (ETH)</option>
                          <option>Cardano (ADA)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Amount</label>
                      <div class="input-group">
                        <input type="number" class="form-control" placeholder="0.00" step="0.0001">
                        <span class="input-group-text">BTC</span>
                      </div>
                      <div class="form-text">Available: 0.6543 BTC</div>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">You'll receive</label>
                      <div class="input-group">
                        <input type="number" class="form-control" placeholder="0.00" readonly>
                        <span class="input-group-text">USD</span>
                      </div>
                    </div>
                    
                    <button type="submit" class="btn btn-danger w-100 fw-bold">
                      Sell Bitcoin
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Chart Area -->
        <div class="col-lg-8 mb-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">BTC/USD</h5>
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-secondary">1H</button>
                <button type="button" class="btn btn-outline-secondary">4H</button>
                <button type="button" class="btn btn-primary">1D</button>
                <button type="button" class="btn btn-outline-secondary">1W</button>
                <button type="button" class="btn btn-outline-secondary">1M</button>
              </div>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <h3 class="mb-0 me-3">$67,500.00</h3>
                <span class="badge bg-success fs-6">+$1,234.56 (+1.86%)</span>
              </div>
              
              <!-- Trading Chart -->
              <app-candlestick-chart
                [data]="candlestickData()"
                label="BTC/USD Price">
              </app-candlestick-chart>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Order Book & Recent Trades -->
      <div class="row">
        <div class="col-lg-6 mb-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0">
              <h5 class="card-title mb-0">Order Book</h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-sm mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="border-0">Price (USD)</th>
                      <th class="border-0">Amount (BTC)</th>
                      <th class="border-0">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="text-danger">
                      <td>67,520.00</td>
                      <td>0.2543</td>
                      <td>17,173.66</td>
                    </tr>
                    <tr class="text-danger">
                      <td>67,510.00</td>
                      <td>0.1876</td>
                      <td>12,660.48</td>
                    </tr>
                    <tr class="text-danger">
                      <td>67,505.00</td>
                      <td>0.3421</td>
                      <td>23,089.56</td>
                    </tr>
                    <tr class="bg-light fw-bold">
                      <td colspan="3" class="text-center">$67,500.00</td>
                    </tr>
                    <tr class="text-success">
                      <td>67,495.00</td>
                      <td>0.4231</td>
                      <td>28,563.24</td>
                    </tr>
                    <tr class="text-success">
                      <td>67,490.00</td>
                      <td>0.2134</td>
                      <td>14,398.77</td>
                    </tr>
                    <tr class="text-success">
                      <td>67,485.00</td>
                      <td>0.1543</td>
                      <td>10,413.20</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-6 mb-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0">
              <h5 class="card-title mb-0">Recent Trades</h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-sm mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="border-0">Time</th>
                      <th class="border-0">Price (USD)</th>
                      <th class="border-0">Amount (BTC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-muted">14:32:15</td>
                      <td class="text-success">67,502.00</td>
                      <td>0.1234</td>
                    </tr>
                    <tr>
                      <td class="text-muted">14:32:12</td>
                      <td class="text-danger">67,498.50</td>
                      <td>0.0567</td>
                    </tr>
                    <tr>
                      <td class="text-muted">14:32:08</td>
                      <td class="text-success">67,501.25</td>
                      <td>0.2341</td>
                    </tr>
                    <tr>
                      <td class="text-muted">14:32:05</td>
                      <td class="text-success">67,500.00</td>
                      <td>0.0892</td>
                    </tr>
                    <tr>
                      <td class="text-muted">14:32:01</td>
                      <td class="text-danger">67,497.75</td>
                      <td>0.1567</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-pills .nav-link {
      color: #6c757d;
    }
    
    .nav-pills .nav-link.active {
      background-color: #007bff;
    }
    
    .card {
      transition: all 0.3s ease;
    }
    
    .table-sm td, .table-sm th {
      padding: 0.5rem;
    }
  `]
})
export class TradingComponent {
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
    { x: '13:30', open: 69500, high: 70000, low: 69200, close: 69800 }
  ]);
}
