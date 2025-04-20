# Script to update repository with new JS version
# Moves JS files to main directory and cleans up unneeded files

# Check if we're in the correct directory
$currentDir = Get-Location
$expectedPath = "c:\Users\rcmrejection3\linc\Healthcare-Insurance-Data-Analysis-System"

if ($currentDir.Path -ne $expectedPath) {
    Write-Host "Please run this script from the root of the repository" -ForegroundColor Red
    exit 1
}

# Create backup of Python files (just in case)
Write-Host "Creating backup of Python files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "python-backup" -Force
Copy-Item "app.py" -Destination "python-backup\" -Force
Copy-Item "requirements.txt" -Destination "python-backup\" -Force
Copy-Item "setup.py" -Destination "python-backup\" -Force
Copy-Item -Path "src" -Destination "python-backup\" -Recurse -Force

# Copy JS files to main directory
Write-Host "Moving JavaScript implementation to main directory..." -ForegroundColor Yellow
Copy-Item -Path "js-version\*" -Destination "." -Recurse -Force

# Remove duplicate README (we'll update the main one)
Remove-Item "js-version\README.md" -Force

# Update main README with JS version content
Write-Host "Updating README.md..." -ForegroundColor Yellow
Copy-Item "js-version\README.md" -Destination "README.md" -Force

# Clean up Python files that are no longer needed
Write-Host "Removing Python implementation files..." -ForegroundColor Yellow
Remove-Item "app.py" -Force
Remove-Item "requirements.txt" -Force
Remove-Item "setup.py" -Force
Remove-Item -Path "src" -Recurse -Force

# Remove js-version directory as it's now redundant
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path "js-version" -Recurse -Force

# Remove virtual environment
if (Test-Path "venv") {
    Remove-Item -Path "venv" -Recurse -Force
}

Write-Host "Repository updated successfully!" -ForegroundColor Green
Write-Host "JavaScript version is now the main implementation" -ForegroundColor Green
Write-Host "Ready to commit changes to the repository" -ForegroundColor Green
