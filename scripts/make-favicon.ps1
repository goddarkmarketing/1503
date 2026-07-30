Add-Type -AssemblyName System.Drawing

$size = 32
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$blue = [System.Drawing.Color]::FromArgb(255, 31, 55, 157)
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$green = [System.Drawing.Color]::FromArgb(255, 89, 188, 70)

$g.FillEllipse((New-Object System.Drawing.SolidBrush $blue), 1, 1, 30, 30)
$penW = New-Object System.Drawing.Pen $white, 2.5
$penG = New-Object System.Drawing.Pen $green, 2.5
$g.DrawArc($penW, 8, 8, 16, 16, 200, 140)
$g.DrawLine($penG, 16, 10, 16, 22)

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pngPath = Join-Path $root 'favicon.png'
$icoPath = Join-Path $root 'favicon.ico'

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fileStream = [System.IO.File]::Create($icoPath)
$icon.Save($fileStream)
$fileStream.Close()

Write-Output "Created $pngPath and $icoPath"
