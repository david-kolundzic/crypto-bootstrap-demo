import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <h2 class="h3 mb-4 text-dark fw-bold">Settings</h2>
      
      <div class="row">
        <div class="col-lg-8">
          <!-- Account Settings -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-0">
              <h5 class="card-title mb-0">Account Settings</h5>
            </div>
            <div class="card-body">
              <form>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-control" value="John">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-control" value="Doe">
                  </div>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-control" value="john.doe@example.com">
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Phone Number</label>
                  <input type="tel" class="form-control" value="+1 (555) 123-4567">
                </div>
                
                <button type="submit" class="btn btn-primary">Update Account</button>
              </form>
            </div>
          </div>
          
          <!-- Security Settings -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-0">
              <h5 class="card-title mb-0">Security</h5>
            </div>
            <div class="card-body">
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">Two-Factor Authentication</h6>
                    <small class="text-muted">Add an extra layer of security to your account</small>
                  </div>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="2fa" checked>
                    <label class="form-check-label" for="2fa">Enabled</label>
                  </div>
                </div>
              </div>
              
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">Email Notifications</h6>
                    <small class="text-muted">Receive trading alerts and security notifications</small>
                  </div>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="emailNotifs" checked>
                    <label class="form-check-label" for="emailNotifs">Enabled</label>
                  </div>
                </div>
              </div>
              
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">SMS Alerts</h6>
                    <small class="text-muted">Get text messages for important account activities</small>
                  </div>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="smsAlerts">
                    <label class="form-check-label" for="smsAlerts">Disabled</label>
                  </div>
                </div>
              </div>
              
              <button class="btn btn-outline-primary me-2">Change Password</button>
              <button class="btn btn-outline-danger">Download Backup Codes</button>
            </div>
          </div>
          
          <!-- Trading Preferences -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-0">
              <h5 class="card-title mb-0">Trading Preferences</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Default Trading Pair</label>
                <select class="form-select">
                  <option>BTC/USD</option>
                  <option>ETH/USD</option>
                  <option>ADA/USD</option>
                  <option>SOL/USD</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Chart Timeframe</label>
                <select class="form-select">
                  <option>1 Hour</option>
                  <option>4 Hours</option>
                  <option selected>1 Day</option>
                  <option>1 Week</option>
                </select>
              </div>
              
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">Advanced Trading Mode</h6>
                    <small class="text-muted">Enable professional trading features</small>
                  </div>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="advancedMode">
                    <label class="form-check-label" for="advancedMode">Disabled</label>
                  </div>
                </div>
              </div>
              
              <button class="btn btn-primary">Save Preferences</button>
            </div>
          </div>
        </div>
        
        <div class="col-lg-4">
          <!-- Profile Card -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body text-center">
              <div class="bg-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                   style="width: 80px; height: 80px;">
                <span class="text-white fw-bold" style="font-size: 2rem;">JD</span>
              </div>
              <h5 class="card-title">John Doe</h5>
              <p class="text-muted mb-3">Premium Member</p>
              <span class="badge bg-success mb-3">Verified Account</span>
              <div class="d-grid">
                <button class="btn btn-outline-primary">Upload Photo</button>
              </div>
            </div>
          </div>
          
          <!-- Quick Stats -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-0">
              <h6 class="card-title mb-0">Account Summary</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Member Since</span>
                  <span class="fw-bold">Jan 2023</span>
                </div>
              </div>
              
              <div class="mb-3">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Total Trades</span>
                  <span class="fw-bold">1,247</span>
                </div>
              </div>
              
              <div class="mb-3">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Success Rate</span>
                  <span class="fw-bold text-success">73.2%</span>
                </div>
              </div>
              
              <div class="mb-3">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Current Tier</span>
                  <span class="fw-bold text-primary">Premium</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Help & Support -->
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0">
              <h6 class="card-title mb-0">Help & Support</h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-question-circle me-2"></i>Help Center
                </button>
                <button class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-chat-dots me-2"></i>Contact Support
                </button>
                <button class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-file-earmark-text me-2"></i>API Documentation
                </button>
                <button class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-shield-check me-2"></i>Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: all 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-1px);
    }
    
    .form-check-input:checked {
      background-color: #28a745;
      border-color: #28a745;
    }
    
    .badge {
      font-size: 0.75rem;
    }
  `]
})
export class SettingsComponent {
}
