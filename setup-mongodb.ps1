# This script sets up MongoDB using Docker

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is not installed. Please install Docker first."
    Write-Host "Visit https://www.docker.com/products/docker-desktop/ for installation instructions."
    exit 1
}

# Check if Docker is running
try {
    $dockerStatus = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker is not running. Please start Docker Desktop."
        exit 1
    }
} catch {
    Write-Host "Error checking Docker status. Please make sure Docker is installed and running."
    exit 1
}

# Create a Docker volume for MongoDB data
Write-Host "Creating Docker volume for MongoDB data..."
docker volume create mongodb_data

# Run MongoDB container
Write-Host "Starting MongoDB container..."
docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest

# Check if MongoDB container is running
$containerStatus = docker ps -f "name=mongodb" --format "{{.Status}}"
if ($containerStatus) {
    Write-Host "MongoDB is now running on localhost:27017"
    Write-Host "You can connect to it using the following connection string:"
    Write-Host "mongodb://localhost:27017/api-watcher"
} else {
    Write-Host "Failed to start MongoDB container. Please check Docker logs."
    docker logs mongodb
}

Write-Host "`nTo stop MongoDB, run: docker stop mongodb"
Write-Host "To start MongoDB again, run: docker start mongodb"
Write-Host "To remove MongoDB container, run: docker rm -f mongodb" 