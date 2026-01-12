# Quick fix script - Creates .env.local file
# Run this from project root: .\fix-now.ps1

Write-Host "🔧 EcoLearn Quick Fix" -ForegroundColor Green
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "frontend\.env.local"

# Check if already exists
if (Test-Path $frontendPath) {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "📝 Creating frontend/.env.local..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Get your Supabase anon key from:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/yskakkztdzuaoearmtir/settings/api" -ForegroundColor Gray
Write-Host ""
Write-Host "   1. Click 'Legacy anon, service_role API keys' tab" -ForegroundColor White
Write-Host "   2. Copy the 'anon public' key" -ForegroundColor White
Write-Host ""

$anonKey = Read-Host "Paste your anon key here"

if ([string]::IsNullOrWhiteSpace($anonKey)) {
    Write-Host "❌ Key is required!" -ForegroundColor Red
    exit 1
}

# Create file content
$content = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yskakkztdzuaoearmtir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey
"@

try {
    # Ensure frontend directory exists
    $frontendDir = Join-Path $PSScriptRoot "frontend"
    if (-not (Test-Path $frontendDir)) {
        Write-Host "❌ frontend directory not found!" -ForegroundColor Red
        exit 1
    }

    # Write file
    [System.IO.File]::WriteAllText($frontendPath, $content)
    
    Write-Host ""
    Write-Host "✅ Successfully created frontend/.env.local" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart your dev server (Ctrl+C then 'npm run dev')" -ForegroundColor White
    Write-Host "   2. Refresh your browser" -ForegroundColor White
    Write-Host "   3. The red warning should disappear!" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Don't forget to also run database/schema.sql in Supabase!" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Create file: frontend/.env.local" -ForegroundColor White
    Write-Host "2. Add these lines:" -ForegroundColor White
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=https://yskakkztdzuaoearmtir.supabase.co" -ForegroundColor Gray
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey" -ForegroundColor Gray
    exit 1
}

