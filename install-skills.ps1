$ErrorActionPreference = "Continue"
$root = "C:\Users\RCG\Desktop\skillion-next"
$zip = Join-Path $root "skills-temp.zip"
$dest = Join-Path $root ".agent\skills"
$agentDir = Join-Path $root ".agent"

Write-Host "Downloading 25MB..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://github.com/sickn33/antigravity-awesome-skills/archive/refs/heads/main.zip" -OutFile $zip -UseBasicParsing
Write-Host "Done. Extracting..."

if (Test-Path $dest) { Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $dest -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $agentDir -Force
Write-Host "Extracted."

$sub = Get-ChildItem $agentDir -Directory | Where-Object { $_.Name -like "antigravity*" } | Select-Object -First 1
if (-not $sub) { Write-Host "ERROR: No folder found"; exit 1 }
Write-Host "Copying from $($sub.Name)..."

Copy-Item -Path (Join-Path $sub.FullName "*") -Destination $dest -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $sub.FullName -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue

$n = (Get-ChildItem $dest -Recurse -Filter "SKILL.md" -ErrorAction SilentlyContinue).Count
Write-Host "DONE. Skills installed: $n SKILL.md files at $dest" -ForegroundColor Green
