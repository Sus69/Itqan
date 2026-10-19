# Itqan PowerShell Wrapper
# Allows running .\manage or .\manage.ps1 directly in PowerShell
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$ArgsList
)
python "$PSScriptRoot\manage.py" @ArgsList
