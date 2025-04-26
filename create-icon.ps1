$iconPath = "$PSScriptRoot\assets\icon.ico"

# Verificar si existe el archivo
if (Test-Path $iconPath) {
    Write-Host "El icono ya existe en: $iconPath"
    exit
}

# Crear icono usando el enfoque WinForms
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 64, 64
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::DodgerBlue)

# Dibujar "ExecHub" en el icono
$font = New-Object System.Drawing.Font "Arial", 10, [System.Drawing.FontStyle]::Bold
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF 0, 0, 64, 64
$g.DrawString("ExecHub", $font, $brush, $rect, $stringFormat)

# Guardar como icon
$ico = New-Object System.Drawing.Icon ($bmp, 64, 64)
$fileStream = [System.IO.File]::Create($iconPath)
$ico.Save($fileStream)
$fileStream.Close()

Write-Host "Icono creado en: $iconPath" 