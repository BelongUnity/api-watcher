# This script initializes a new GitHub repository and pushes the project to it

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI is not installed. Please install it first."
    Write-Host "Visit https://cli.github.com/ for installation instructions."
    exit 1
}

# Check if user is logged in to GitHub
try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "You are not logged in to GitHub. Please login first."
        gh auth login
    }
} catch {
    Write-Host "Error checking GitHub authentication status."
    exit 1
}

# Create a new GitHub repository
Write-Host "Creating a new GitHub repository..."
gh repo create api-watcher --public --description "API status monitoring application" --confirm

# Initialize git repository if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..."
    git init
}

# Add all files to git
Write-Host "Adding files to git..."
git add .

# Create commit message file
$commitMessageFile = "commit_message.txt"
"[Cursor] Initial commit: API Watcher application" | Out-File -FilePath $commitMessageFile

# Commit changes
Write-Host "Committing changes..."
git commit -F $commitMessageFile

# Remove commit message file
Remove-Item $commitMessageFile

# Add GitHub remote
Write-Host "Adding GitHub remote..."
$username = (gh api user | ConvertFrom-Json).login
git remote add origin "https://github.com/$username/api-watcher.git"

# Push to GitHub
Write-Host "Pushing to GitHub..."
try {
    git push -u origin main
} catch {
    git push -u origin master
}

Write-Host "Repository setup complete!"
Write-Host "Your API Watcher application is now available on GitHub." 