$ErrorActionPreference = "Stop"

Write-Output "[1/4] Running migrate..."
npm run migrate | Out-Host

Write-Output "[2/4] Running seed..."
npm run seed | Out-Host

Write-Output "[3/4] Starting server..."
$server = Start-Process -FilePath node -ArgumentList 'src/server.js' -WorkingDirectory (Get-Location).Path -PassThru
Start-Sleep -Seconds 4

try {
  Write-Output "[4/4] Calling localhost endpoints..."

  $health = Invoke-RestMethod -Uri 'http://127.0.0.1:4000/api/health'

  $admin = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/auth/login' -ContentType 'application/json' -Body '{"email":"admin@zorvyn.com","password":"Admin@123"}'
  $analyst = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/auth/login' -ContentType 'application/json' -Body '{"email":"analyst@zorvyn.com","password":"Analyst@123"}'
  $viewer = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4000/api/auth/login' -ContentType 'application/json' -Body '{"email":"viewer@zorvyn.com","password":"Viewer@123"}'

  $adminHeaders = @{ Authorization = "Bearer $($admin.data.token)" }
  $analystHeaders = @{ Authorization = "Bearer $($analyst.data.token)" }
  $viewerHeaders = @{ Authorization = "Bearer $($viewer.data.token)" }

  $users = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:4000/api/users?page=1&limit=10' -Headers $adminHeaders
  $records = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:4000/api/records?page=1&limit=5' -Headers $viewerHeaders
  $summary = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:4000/api/dashboard/summary' -Headers $viewerHeaders
  $category = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:4000/api/dashboard/by-category' -Headers $analystHeaders
  $trends = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:4000/api/dashboard/trends?period=monthly' -Headers $analystHeaders
  $recent = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:4000/api/dashboard/recent?limit=5' -Headers $viewerHeaders

  Write-Output "--- HEALTH ---"
  $health | ConvertTo-Json -Depth 10 | Out-Host

  Write-Output "--- USERS (ADMIN) ---"
  $users | ConvertTo-Json -Depth 10 | Out-Host

  Write-Output "--- RECORDS (VIEWER) ---"
  $records | ConvertTo-Json -Depth 10 | Out-Host

  Write-Output "--- DASHBOARD SUMMARY ---"
  $summary | ConvertTo-Json -Depth 10 | Out-Host

  Write-Output "--- DASHBOARD BY CATEGORY ---"
  $category | ConvertTo-Json -Depth 10 | Out-Host

  Write-Output "--- DASHBOARD TRENDS ---"
  $trends | ConvertTo-Json -Depth 10 | Out-Host

  Write-Output "--- DASHBOARD RECENT ---"
  $recent | ConvertTo-Json -Depth 10 | Out-Host

  Write-Output "Demo finished."
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  Write-Output "Server stopped."
}
