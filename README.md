# 📊 Crypto Portfolio Dashboard – Angular 20 + Bootstrap 5

This is a comprehensive **Angular 20** and **Bootstrap 5** application for managing and visualizing cryptocurrency portfolios through CSV imports from major exchanges.

🎯 Created as a technical showcase for frontend roles – with emphasis on file handling, reactive programming, data visualization, responsive UI and enterprise-grade Angular architecture.

---

## ✨ Features

### 📁 **Multi-Exchange CSV Support**

- **Binance** - Trade history parsing
- **Bitpanda** - Transaction data import  
- **Coinbase** - Portfolio transactions
- **Kraken** - Trading data processing
- **KuCoin** - Exchange data parsing
- Smart auto-detection of exchange formats

### 📊 **Data Visualization & Analytics**

- **Interactive Charts** - Line charts, pie charts, candlestick charts (Chart.js 4)
- **Portfolio Performance** - Real-time value tracking and 24h changes
- **Asset Allocation** - Visual breakdown of holdings distribution
- **Summary Dashboards** - Key metrics and portfolio overview

### 🔄 **Reactive Architecture**

- **Angular 20 Signals** - Modern reactive state management
- **RxJS Integration** - Asynchronous data handling
- **Real-time Updates** - Live portfolio calculations
- **Effect-based Logic** - Automatic data synchronization

### 🎨 **Modern UI/UX**

- **Bootstrap 5** - Responsive design system
- **Bootstrap Icons** - Consistent iconography
- **SCSS Styling** - Modular and maintainable styles
- **Mobile-First** - Fully responsive across all devices

### 💾 **Data Management**

- **Client-side Processing** - No backend required
- **Default Portfolio** - Pre-loaded demo data
- **State Persistence** - Holdings data management
- **Error Handling** - Comprehensive validation and user feedback

---

## 🏗️ **Architecture & Components**

### **Core Components**

- `PortfolioComponent` - Main dashboard with performance metrics
- `MarketComponent` - Market overview and analysis
- `CsvImportComponent` - File upload and processing interface
- `NavigationComponent` - App-wide navigation system

### **Chart Components**

- `LineChartComponent` - Portfolio performance over time
- `PieChartComponent` - Asset allocation visualization
- `CandlestickChartComponent` - Price movement charts

### **Shared Components**

- `SummaryCircleComponent` - Key metric displays
- `SummaryCardComponent` - Information cards
- `TitleComponent` - Reusable page headers

### **Services**

- `CsvImportService` - Exchange data parsing and validation
- `HoldingsDataService` - Portfolio data management
- `PortfolioCalculationService` - Financial calculations and metrics

---

## 📦 Technologies Used

| Layer           | Stack                          |
|-----------------|--------------------------------|
| **Frontend**    | Angular 20, Bootstrap 5        |
| **State**       | Angular Signals, RxJS          |
| **Charts**      | Chart.js 4, ng2-charts         |
| **Parsing**     | PapaParse (CSV processing)      |
| **Styling**     | SCSS, Bootstrap Components      |
| **Language**    | TypeScript 5.8                 |
| **Icons**       | Bootstrap Icons                 |

---

## 🚀 Live Demo

🧪 Coming soon: [crypto-csv.vercel.app](https://crypto-csv.vercel.app)  
(or run locally, see below)

---

## 🧪 Run Locally

```bash
git clone https://github.com/david-kolundzic/crypto-dashboard-bootstrap-demo.git
cd crypto-dashboard-bootstrap-demo
npm install
ng serve
```

---

## 📋 **Test Data & Examples**

Sample CSV files are included in `/assets/` for testing:

- `BinanceTrade.csv` - Binance trading history format
- `BitpandaTrade.csv` - Bitpanda transaction export
- `CoinbaseTrade.csv` - Coinbase portfolio data
- `KrakenTrade.csv` - Kraken exchange transactions
- `KuCoinTrade.csv` - KuCoin trading records

---

## 🔧 **Development Features**

- **Modern Angular 20** - Latest features and best practices
- **Standalone Components** - No NgModules, simplified architecture
- **Signal-based Reactivity** - Performance-optimized state management
- **TypeScript 5.8** - Latest type safety and features
- **Component Testing** - Jasmine & Karma test setup
- **Code Quality** - ESLint, Prettier configuration
- **Responsive Design** - Mobile-first Bootstrap implementation

---

## 📊 **Key Metrics Dashboard**

The portfolio dashboard provides:

- **Total Portfolio Value** - Real-time valuation
- **24h Profit/Loss** - Performance tracking
- **Asset Count** - Number of holdings
- **Allocation Charts** - Visual asset distribution
- **Performance Graphs** - Historical value trends
