# PowerShell script to start both frontend and backend servers

Write-Host "Starting API Watcher servers..." -ForegroundColor Green

# Start the backend server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot/backend; npm start"

# Wait a moment for the backend to initialize
Start-Sleep -Seconds 3

# Start the frontend server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot/frontend; npm start"

Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Backend running at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend running at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Use test account: test@mail.com / test123" -ForegroundColor Yellow 