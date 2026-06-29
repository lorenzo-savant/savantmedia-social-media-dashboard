# Sync notturno Savant Ads — pensato per Task Scheduler.
# Attiva la venv del progetto, lancia run_sync.py e accoda tutto in sync.log.
#
# PREREQUISITO: Postgres in ascolto su :5432. Il Postgres portable NON riparte
# dopo un reboot: usa l'installer ufficiale come servizio (vedi GUIDA.md §10/§14)
# oppure avvia C:\Users\loren\savant-postgres\start.ps1 all'avvio del PC.
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

# Output Python in UTF-8, così il log resta leggibile (accenti, em-dash, ecc.).
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"=== $stamp  run_sync ===" | Out-File -FilePath "$here\sync.log" -Append -Encoding utf8

& "$here\.venv\Scripts\python.exe" "$here\run_sync.py" 2>&1 |
    Out-File -FilePath "$here\sync.log" -Append -Encoding utf8
$code = $LASTEXITCODE

"=== exit code: $code ===" | Out-File -FilePath "$here\sync.log" -Append -Encoding utf8
exit $code
