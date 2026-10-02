# Run after extracting or moving the game folder. The shortcut always uses this folder.
$gamePath = Join-Path $PSScriptRoot 'Mines of Moria.html'
$iconPath = Join-Path $PSScriptRoot 'mines-of-moria.ico'
if (-not (Test-Path -LiteralPath $gamePath)) { throw 'Mines of Moria.html is missing. Extract the complete game first.' }
$shortcutPath = Join-Path $PSScriptRoot 'Mines of Moria.lnk'
$shellObject = New-Object -ComObject WScript.Shell
$gameShortcut = $shellObject.CreateShortcut($shortcutPath)
$gameShortcut.TargetPath = $gamePath
$gameShortcut.WorkingDirectory = $PSScriptRoot
$gameShortcut.IconLocation = "$iconPath,0"
$gameShortcut.Description = 'Mines of Moria - Khazad-dum'
$gameShortcut.Save()
Write-Host 'Mines of Moria shortcut created. Double-click it to play.'
