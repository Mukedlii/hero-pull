param(
  [string]$OutDir = "public"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-Png {
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][int]$Width,
    [Parameter(Mandatory)][int]$Height,
    [Parameter(Mandatory)][int[]]$BgRgb,
    [Parameter(Mandatory)][string]$Text,
    [Parameter(Mandatory)][int]$FontSize
  )

  $bmp = New-Object System.Drawing.Bitmap $Width, $Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"

  $color = [System.Drawing.Color]::FromArgb($BgRgb[0], $BgRgb[1], $BgRgb[2])
  $g.Clear($color)

  $font = New-Object System.Drawing.Font "Arial", $FontSize, ([System.Drawing.FontStyle]::Bold)
  $brush = [System.Drawing.Brushes]::White
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF 0, 0, $Width, $Height

  $g.DrawString($Text, $font, $brush, $rect, $format)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $bmp.Dispose()
}

New-Png -Path (Join-Path $OutDir "og.png") -Width 1200 -Height 630 -BgRgb @(10, 10, 18) -Text "Hero Pull" -FontSize 96
New-Png -Path (Join-Path $OutDir "splash.png") -Width 200 -Height 200 -BgRgb @(26, 26, 46) -Text "HP" -FontSize 72

Write-Output "Generated: $(Join-Path $OutDir 'og.png')"
Write-Output "Generated: $(Join-Path $OutDir 'splash.png')"
