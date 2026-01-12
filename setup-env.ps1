# PowerShell script to help set up environment variables
# Run this script from the project root directory

Write-Host "🌱 EcoLearn Environment Setup Script" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists in frontend
$frontendEnvPath = "frontend\.env.local"
if (Test-Path $frontendEnvPath) {
    Write-Host "⚠️  .env.local already exists in frontend/" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping frontend .env.local setup" -ForegroundColor Yellow
        $skipFrontend = $true
    }
}

if (-not $skipFrontend) {
    Write-Host ""
    Write-Host "📝 Setting up frontend/.env.local" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please enter your Supabase credentials:" -ForegroundColor White
    Write-Host "You can find these at: https://supabase.com/dashboard/project/yskakkztdzuaoearmtir/settings/api" -ForegroundColor Gray
    Write-Host ""
    
    $supabaseUrl = Read-Host "Supabase URL (default: https://yskakkztdzuaoearmtir.supabase.co)"
    if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
        $supabaseUrl = "https://yskakkztdzuaoearmtir.supabase.co"
    }
    
    $supabaseAnonKey = Read-Host "Supabase Anon Key (paste the full key)"
    
    if ([string]::IsNullOrWhiteSpace($supabaseAnonKey)) {
        Write-Host "❌ Anon key is required!" -ForegroundColor Red
        exit 1
    }
    
    $envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey
"@
    
    $envContent | Out-File -FilePath $frontendEnvPath -Encoding utf8
    Write-Host "✅ Created frontend/.env.local" -ForegroundColor Green
}

# Check if .env exists in backend
$backendEnvPath = "backend\.env"
if (Test-Path $backendEnvPath) {
    Write-Host ""
    Write-Host "⚠️  .env already exists in backend/" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping backend .env setup" -ForegroundColor Yellow
        $skipBackend = $true
    }
}

if (-not $skipBackend) {
    Write-Host ""
    Write-Host "📝 Setting up backend/.env (optional)" -ForegroundColor Cyan
    Write-Host ""
    
    $setupBackend = Read-Host "Do you want to set up backend environment? (y/n)"
    if ($setupBackend -eq "y") {
        $supabaseServiceKey = Read-Host "Supabase Service Role Key (optional, for backend features)"
        
        $backendEnvContent = @"
# Backend Environment Variables
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=$supabaseUrl
SUPABASE_SERVICE_KEY=$supabaseServiceKey
"@
        
        $backendEnvContent | Out-File -FilePath $backendEnvPath -Encoding utf8
        Write-Host "✅ Created backend/.env" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your Supabase database schema is set up (run database/schema.sql)" -ForegroundColor White
Write-Host "2. Start the frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. (Optional) Start the backend: cd backend && npm run dev" -ForegroundColor White
Write-Host ""

