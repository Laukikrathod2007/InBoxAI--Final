# Build the browser-only demo and package it as a free Hugging Face *Static* Space.
#   powershell -File scripts/make_space.ps1
# Output: hf-space/ (index.html + assets + README with the Space settings). Gitignored.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

python scripts/build_demo_data.py
Push-Location frontend
npm run build:demo
Pop-Location

$out = Join-Path $root "hf-space"
if (Test-Path $out) { Remove-Item -Recurse -Force $out }
Copy-Item -Recurse frontend/dist-demo $out

# README is written by Python so the YAML header is clean UTF-8 with no BOM.
python -c "import pathlib,sys; pathlib.Path(sys.argv[1]).write_text(open('scripts/space_readme.md',encoding='utf-8').read(),encoding='utf-8')" (Join-Path $out "README.md")

Write-Host "Space ready in $out"
