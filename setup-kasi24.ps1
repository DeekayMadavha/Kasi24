# One-time setup for the Kasi24 frontend. Run from PowerShell in this folder:
#   powershell -ExecutionPolicy Bypass -File .\setup-kasi24.ps1
# It: switches to the 'develop' branch and pulls the latest code, creates frontend\.env.local
# (only if it does not exist yet) and runs npm install. Delete this file afterwards.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Run($label, [scriptblock]$cmd) {
    Write-Host "==> $label" -ForegroundColor Green
    & $cmd
    if ($LASTEXITCODE -ne 0) { throw "Step failed: $label" }
}

# Stop if you have uncommitted changes to tracked files, so nothing of yours is overwritten.
$dirty = git status --porcelain --untracked-files=no
if ($dirty) {
    Write-Host "You have uncommitted changes. Commit or stash them first:" -ForegroundColor Yellow
    Write-Host $dirty
    exit 1
}

Run 'Fetching from GitHub' { git fetch origin }
Run 'Switching to develop' { git checkout develop }
Run 'Pulling the latest develop' { git pull origin develop }

Set-Location (Join-Path $PSScriptRoot 'frontend')

$envFile = '.env.local'
if (Test-Path $envFile) {
    Write-Host "==> $envFile already exists, leaving it as it is" -ForegroundColor Green
} else {
    Write-Host "==> Creating frontend\$envFile" -ForegroundColor Green
    @(
        'VITE_SUPABASE_URL=https://noqjxhhfksvzpksylawe.supabase.co'
        'VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xqEc6uUQbpq9Hg8u-nnzcA_qQBP9Qbo'
    ) | Set-Content -Path $envFile -Encoding ascii
}

Run 'Installing packages (npm install)' { npm install }

Write-Host ''
Write-Host 'Done. Start the app with:' -ForegroundColor Green
Write-Host '  cd frontend'
Write-Host '  npm run dev'
Write-Host 'then open http://localhost:5173'
