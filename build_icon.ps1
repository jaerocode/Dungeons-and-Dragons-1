# Code-native troll portrait, rendered at multiple Windows icon sizes.
Add-Type -AssemblyName System.Drawing
$iconStream = New-Object System.IO.MemoryStream
$iconWriter = New-Object System.IO.BinaryWriter($iconStream)
$sizes = @(16, 32, 48, 64, 128, 256)
$images = @()
foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(($size / 100.0), ($size / 100.0))
    $graphics.Clear([System.Drawing.Color]::FromArgb(17, 26, 21))
    $points = @(@(26,29),@(12,23),@(16,48),@(25,53),@(27,78),@(42,92),@(59,92),@(74,77),@(77,52),@(86,47),@(91,23),@(73,29),@(63,12),@(37,12))
    $polygon = [System.Drawing.PointF[]]($points | ForEach-Object { New-Object System.Drawing.PointF($_[0], $_[1]) })
    $skin = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(110, 127, 86))
    $gold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(195, 170, 108), 2)
    $dark = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(22, 32, 24), 7)
    $ivory = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(229, 213, 173))
    $graphics.FillPolygon($skin, $polygon); $graphics.DrawPolygon($gold, $polygon)
    $graphics.DrawLine($dark, 31, 50, 42, 53); $graphics.DrawLine($dark, 59, 53, 70, 50); $graphics.DrawLine($dark, 40, 75, 60, 75)
    foreach ($tusk in @(@(@(32,66),@(38,83),@(44,67)), @(@(56,67),@(63,83),@(69,66)))) {
        $triangle = [System.Drawing.PointF[]]($tusk | ForEach-Object { New-Object System.Drawing.PointF($_[0], $_[1]) })
        $graphics.FillPolygon($ivory, $triangle)
    }
    $png = New-Object System.IO.MemoryStream
    $bitmap.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
    $images += ,$png.ToArray()
    $png.Dispose(); $graphics.Dispose(); $bitmap.Dispose(); $skin.Dispose(); $gold.Dispose(); $dark.Dispose(); $ivory.Dispose()
}
$iconWriter.Write([uint16]0); $iconWriter.Write([uint16]1); $iconWriter.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i=0; $i -lt $sizes.Count; $i++) {
    $dimension = if ($sizes[$i] -eq 256) { 0 } else { $sizes[$i] }
    $iconWriter.Write([byte]$dimension); $iconWriter.Write([byte]$dimension)
    $iconWriter.Write([byte]0); $iconWriter.Write([byte]0)
    $iconWriter.Write([uint16]1); $iconWriter.Write([uint16]32)
    $iconWriter.Write([uint32]$images[$i].Length); $iconWriter.Write([uint32]$offset)
    $offset += $images[$i].Length
}
foreach ($bytes in $images) { $iconWriter.Write([byte[]]$bytes) }
[System.IO.File]::WriteAllBytes((Join-Path $PSScriptRoot 'mines-of-moria.ico'), $iconStream.ToArray())
$iconWriter.Dispose(); $iconStream.Dispose()
