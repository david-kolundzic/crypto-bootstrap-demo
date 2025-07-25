param(
    [Parameter(Mandatory=$true)]
    [string]$ComponentName,
    
    [string]$Path = "src/app/components"
)

Write-Host "Creating component: $ComponentName in $Path" -ForegroundColor Green

# Create directory
$fullPath = "$Path/$ComponentName"
New-Item -ItemType Directory -Path $fullPath -Force | Out-Null

# Create component files with proper naming
$tsContent = @"
import { Component } from '@angular/core';

@Component({
  selector: 'app-$ComponentName',
  standalone: true,
  imports: [],
  templateUrl: './$ComponentName.component.html',
  styleUrl: './$ComponentName.component.scss'
})
export class $($ComponentName.Split('-') | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) })Component {

}
"@

$htmlContent = "<p>$ComponentName works!</p>"
$scssContent = "// $ComponentName component styles"

# Write files
Set-Content -Path "$fullPath/$ComponentName.component.ts" -Value $tsContent
Set-Content -Path "$fullPath/$ComponentName.component.html" -Value $htmlContent
Set-Content -Path "$fullPath/$ComponentName.component.scss" -Value $scssContent

Write-Host "✅ Component created successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  - $ComponentName.component.ts" -ForegroundColor Gray
Write-Host "  - $ComponentName.component.html" -ForegroundColor Gray
Write-Host "  - $ComponentName.component.scss" -ForegroundColor Gray
