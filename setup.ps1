# API Watcher Setup Script

Write-Host "=== API Watcher Setup Script ===" -ForegroundColor Cyan
Write-Host "This script will help you set up the API Watcher application." -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install Node.js v14 or higher." -ForegroundColor Red
    Write-Host "Visit https://nodejs.org/ for installation instructions." -ForegroundColor Red
    exit 1
}

$nodeVersion = node -v
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install npm." -ForegroundColor Red
    exit 1
}

$npmVersion = npm -v
Write-Host "npm version: $npmVersion" -ForegroundColor Green

# Install backend dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Yellow
Set-Location -Path ".\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install backend dependencies." -ForegroundColor Red
    exit 1
}
Write-Host "Backend dependencies installed successfully." -ForegroundColor Green

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path "..\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install frontend dependencies." -ForegroundColor Red
    exit 1
}
Write-Host "Frontend dependencies installed successfully." -ForegroundColor Green

# Return to root directory
Set-Location -Path ".."

# Set up MongoDB
Write-Host "`nDo you want to set up MongoDB using Docker? (Y/N)" -ForegroundColor Yellow
$setupMongoDB = Read-Host
if ($setupMongoDB -eq "Y" -or $setupMongoDB -eq "y") {
    Write-Host "Setting up MongoDB using Docker..." -ForegroundColor Yellow
    & .\setup-mongodb.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to set up MongoDB using Docker." -ForegroundColor Red
        Write-Host "Please set up MongoDB manually or use MongoDB Atlas." -ForegroundColor Red
    }
} else {
    Write-Host "Skipping MongoDB setup. Please set up MongoDB manually or use MongoDB Atlas." -ForegroundColor Yellow
}

# Set up environment variables
Write-Host "`nSetting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".\backend\.env")) {
    Copy-Item ".\backend\.env.example" ".\backend\.env" -ErrorAction SilentlyContinue
    if (-not (Test-Path ".\backend\.env")) {
        # If .env.example doesn't exist, create .env from scratch
        Write-Host "Creating .env file from scratch..." -ForegroundColor Yellow
        @"
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# Uncomment and update the MONGO_URI below to use MongoDB Atlas
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/api-watcher

# JWT Secret for Authentication
JWT_SECRET=api_watcher_secret_key_change_in_production

# Client URL for CORS
CLIENT_URL=http://localhost:3000

# Email Configuration for Notifications
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
"@ | Out-File -FilePath ".\backend\.env" -Encoding utf8
    }
    Write-Host ".env file created. Please update it with your configuration." -ForegroundColor Green
} else {
    Write-Host ".env file already exists." -ForegroundColor Green
}

# Setup complete
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "To start the backend server:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nTo start the frontend server:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host "`nAccess the application at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "`nThank you for using API Watcher!" -ForegroundColor Cyan 