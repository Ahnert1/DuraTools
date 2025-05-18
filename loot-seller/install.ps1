# PowerShell script to install and set up Loot Seller Pro
Write-Host "Setting up Loot Seller Pro..." -ForegroundColor Green

# Navigate to the correct directory if needed
$currentDir = Get-Location
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($currentDir -ne $scriptDir) {
  Write-Host "Changing to script directory: $scriptDir" -ForegroundColor Yellow
  Set-Location -Path $scriptDir
}

# Step 1: Install npm dependencies
Write-Host "`n[1/3] Installing npm dependencies..." -ForegroundColor Cyan
npm install

# Ensure the public/images directory exists
$imageDir = "public\images"
if (!(Test-Path $imageDir)) {
  Write-Host "Creating images directory..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $imageDir -Force | Out-Null
}

# Step 2: Download the images
Write-Host "`n[2/3] Downloading item images..." -ForegroundColor Cyan
npm run download-images

# Step 3: Start the application
Write-Host "`n[3/3] Starting the application..." -ForegroundColor Cyan
Write-Host "The application will open in your default browser shortly." -ForegroundColor Yellow

# Run the app
npm start

# This won't actually be reached because npm start will keep running
Write-Host "`nSetup Complete!" -ForegroundColor Green 