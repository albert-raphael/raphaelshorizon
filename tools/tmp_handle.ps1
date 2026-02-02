$zip="$env:TEMP\handle.zip"
$out="$env:TEMP\handle"
if (Test-Path $out) { Remove-Item -Recurse -Force $out }
Invoke-WebRequest -Uri 'https://download.sysinternals.com/files/Handle.zip' -OutFile $zip
Expand-Archive -LiteralPath $zip -DestinationPath $out
$hdl = Join-Path $out 'handle.exe'
if (Test-Path $hdl) { & $hdl -accepteula 'dist\\win-unpacked\\resources\\app.asar' } else { Write-Output 'Handle not found' }