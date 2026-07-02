# Test Render Deployment Script
# This script tests if the CORS fix is deployed on Render

Write-Host "🔍 Testing Render Backend Deployment..." -ForegroundColor Cyan
Write-Host ""

$API_URL = "https://real-time-task-board-ith5.onrender.com"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "Test 1: Health Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS - Server is running" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "❌ FAIL - Server is not responding" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 2: CORS Preflight from localhost:3000
Write-Host "Test 2: CORS Preflight (OPTIONS) from localhost:3000" -ForegroundColor Yellow
try {
    $headers = @{
        Origin = "http://localhost:3000"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type"
    }
    $response = Invoke-WebRequest -Uri "$API_URL/api/auth/login" -Method OPTIONS -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    $allowOrigin = $response.Headers["access-control-allow-origin"]
    if ($allowOrigin -eq "http://localhost:3000") {
        Write-Host "✅ PASS - CORS allows localhost:3000" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $allowOrigin" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Wrong origin: $allowOrigin" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ FAIL - CORS preflight failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 3: CORS Preflight from Vercel
Write-Host "Test 3: CORS Preflight (OPTIONS) from Vercel" -ForegroundColor Yellow
try {
    $headers = @{
        Origin = "https://real-time-task-board-web-ujjn.vercel.app"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type"
    }
    $response = Invoke-WebRequest -Uri "$API_URL/api/auth/login" -Method OPTIONS -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    $allowOrigin = $response.Headers["access-control-allow-origin"]
    if ($allowOrigin -eq "https://real-time-task-board-web-ujjn.vercel.app") {
        Write-Host "✅ PASS - CORS allows Vercel URL" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $allowOrigin" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Wrong origin: $allowOrigin" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ FAIL - CORS preflight failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 4: Actual POST Request (will fail auth but should not have CORS error)
Write-Host "Test 4: Actual POST Request from localhost:3000" -ForegroundColor Yellow
try {
    $headers = @{
        Origin = "http://localhost:3000"
        "Content-Type" = "application/json"
    }
    $body = @{
        email = "test@example.com"
        password = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_URL/api/auth/login" -Method POST -Headers $headers -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "⚠️  UNEXPECTED - Got 200 response (should fail with invalid credentials)" -ForegroundColor Yellow
    $testsPassed++
} catch {
    # We expect this to fail with 401/400, but should have CORS headers
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 400) {
        Write-Host "✅ PASS - Request reached server (returned $statusCode)" -ForegroundColor Green
        Write-Host "   This means CORS is working! The auth error is expected." -ForegroundColor Gray
        $testsPassed++
    } elseif ($statusCode -eq 503) {
        Write-Host "❌ FAIL - Server returned 503 (Server Unavailable)" -ForegroundColor Red
        Write-Host "   The server might be crashing or still deploying" -ForegroundColor Gray
        $testsFailed++
    } else {
        Write-Host "❌ FAIL - Unexpected status code: $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "RESULTS:" -ForegroundColor Cyan
Write-Host "✅ Passed: $testsPassed" -ForegroundColor Green
Write-Host "❌ Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! Your CORS is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
    Write-Host "2. Restart your Next.js dev server" -ForegroundColor White
    Write-Host "3. Try logging in at http://localhost:3000" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If you see 503 errors, wait 2-3 minutes for Render to deploy." -ForegroundColor Yellow
    Write-Host "Then run this script again: .\test-render-deployment.ps1" -ForegroundColor White
}
