# Quick script to create .env.local file for Supabase configuration
# Run this from the project root: .\create-env.ps1

Write-Host "🌱 EcoLearn - Environment Setup" -ForegroundColor Green
Write-Host ""

$frontendPath = "frontend\.env.local"

# Check if file already exists
if (Test-Path $frontendPath) {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "📝 Creating frontend/.env.local file..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Please provide your Supabase credentials:" -ForegroundColor White
Write-Host "Get them from: https://supabase.com/dashboard/project/yskakkztdzuaoearmtir/settings/api" -ForegroundColor Gray
Write-Host ""

# Get Supabase URL
$supabaseUrl = Read-Host "Supabase URL (press Enter for default: https://yskakkztdzuaoearmtir.supabase.co)"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    $supabaseUrl = "https://yskakkztdzuaoearmtir.supabase.co"
}

# Get Anon Key
Write-Host ""
Write-Host "⚠️  IMPORTANT: Copy the FULL 'anon public' key from Supabase dashboard" -ForegroundColor Yellow
Write-Host "   It should be a long string starting with 'eyJhbGci...'" -ForegroundColor Gray
Write-Host ""
$supabaseAnonKey = Read-Host "Supabase Anon Key"

if ([string]::IsNullOrWhiteSpace($supabaseAnonKey)) {
    Write-Host "❌ Anon key is required!" -ForegroundColor Red
    exit 1
}

# Create the file
$envContent = @"
# Supabase Configuration
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey
"@

try {
    $envContent | Out-File -FilePath $frontendPath -Encoding utf8 -NoNewline
    Write-Host ""
    Write-Host "✅ Successfully created frontend/.env.local" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your dev server (Ctrl+C then 'npm run dev')" -ForegroundColor White
    Write-Host "2. Try signing up again" -ForegroundColor White
    Write-Host "3. Make sure database schema is set up (run database/schema.sql in Supabase)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Error creating file: $_" -ForegroundColor Red
    exit 1
}

