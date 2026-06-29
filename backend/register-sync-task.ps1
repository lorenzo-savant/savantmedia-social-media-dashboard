# Registra il sync notturno in Windows Task Scheduler (giornaliero, 03:00).
# Esegui UNA volta. Crea/aggiorna il task "SavantAdsSync" per l'utente corrente.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File register-sync-task.ps1
#
# Per rimuoverlo:  Unregister-ScheduledTask -TaskName "SavantAdsSync" -Confirm:$false
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$here\run_sync.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName "SavantAdsSync" -Action $action -Trigger $trigger `
    -Settings $settings -Description "Sync notturno Savant Ads (run_sync.py)" -Force

Write-Output "Task 'SavantAdsSync' registrato (giornaliero alle 03:00)."
Write-Output "Verifica:  Get-ScheduledTask -TaskName SavantAdsSync"
