# CSV Import Service - PapaParse Integration

## Promjene u refaktoriranju

### Prije (Custom parsiranje)
- Ručno parsiranje CSV stringova korištenjem `split()` metoda
- Kompleksna logika za validaciju header-a i mapiranje kolona  
- Error handling koji se oslanja na index pozicije
- Ručno kreiranje CSV output-a za export

### Nakon (PapaParse integration)
- Koristi PapaParse biblioteku za profesionalno CSV parsiranje
- Automatsko header mapiranje s fleksibilnim matching-om
- Napredni error reporting s row-level informacijama
- Koristi PapaParse `unparse()` za export funkcionalnost

## Nove funkcionalnosti

### 1. Fleksibilno mapiranje kolona
Service sada podržava različite nazive kolona:
- `symbol` / `coin` / `ticker`
- `name` / `coinname` / `cryptocurrency`  
- `price` / `currentprice` / `value`
- `holdings` / `amount` / `quantity` / `balance`

### 2. Poboljšana validacija
- PapaParse interno validira CSV strukturu
- Row-level error reporting
- Graceful fallback za missing optional fields

### 3. Template generiranje
- Nova `generateTemplateCsv()` metoda
- `downloadTemplate()` direktno iz servisa
- Consistent formatting kroz PapaParse

## API ostaje kompatibilan

Svi postojeći pozivi ostaju isti:
- `parseCsvFile(file: File): Promise<ImportResult>`
- `exportToCsv(): string`
- `downloadCsv(filename?: string): void`
- `downloadTemplate(filename?: string): void` (novo)

## Testiranje

Kreiran je test CSV fajl `test-portfolio.csv` s mock podacima za testiranje import funkcionalnosti.

## Benefiti

1. **Robusnost**: PapaParse handles edge cases kao što su quoted fields, special characters
2. **Performance**: Optimizado parsiranje velikih CSV fajlova  
3. **Fleksibilnost**: Podržava različite CSV formate i kolone nazive
4. **Maintainability**: Manje custom koda za održavanje
5. **Error handling**: Detaljniji error reporting

## Dependencies

- `papaparse@5.5.3` - za CSV parsiranje
- `@types/papaparse` - TypeScript tipovi (dev dependency)
