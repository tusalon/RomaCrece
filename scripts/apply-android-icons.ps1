$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $projectRoot "public\icons\icon-512x512.png"
$resources = Join-Path $projectRoot "android\app\src\main\res"

if (-not (Test-Path -LiteralPath $source)) {
    throw "No se encontro el logo de RomaCrece: $source"
}

if (-not (Test-Path -LiteralPath $resources)) {
    throw "No se encontro Android. Ejecuta primero: npm run android:add"
}

$launcherSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

function Save-ResizedPng($sourcePath, $targetPath, $width, $height) {
    $image = [System.Drawing.Image]::FromFile($sourcePath)
    try {
        $bitmap = New-Object System.Drawing.Bitmap $width, $height
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.Clear([System.Drawing.Color]::White)
                $graphics.DrawImage($image, 0, 0, $width, $height)
            } finally {
                $graphics.Dispose()
            }
            $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $bitmap.Dispose()
        }
    } finally {
        $image.Dispose()
    }
}

foreach ($density in $launcherSizes.Keys) {
    $directory = Join-Path $resources $density
    if (-not (Test-Path -LiteralPath $directory)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }

    foreach ($name in @("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")) {
        $size = $launcherSizes[$density]
        Save-ResizedPng $source (Join-Path $directory $name) $size $size
    }
}

Get-ChildItem -LiteralPath $resources -Recurse -Filter "splash.png" -File | ForEach-Object {
    $existing = [System.Drawing.Image]::FromFile($_.FullName)
    try {
        $width = $existing.Width
        $height = $existing.Height
    } finally {
        $existing.Dispose()
    }

    $logo = [System.Drawing.Image]::FromFile($source)
    try {
        $bitmap = New-Object System.Drawing.Bitmap $width, $height
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.Clear([System.Drawing.Color]::White)
                $logoSize = [Math]::Round([Math]::Min($width, $height) * 0.48)
                $left = [Math]::Round(($width - $logoSize) / 2)
                $top = [Math]::Round(($height - $logoSize) / 2)
                $graphics.DrawImage($logo, $left, $top, $logoSize, $logoSize)
            } finally {
                $graphics.Dispose()
            }
            $bitmap.Save($_.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $bitmap.Dispose()
        }
    } finally {
        $logo.Dispose()
    }
}

Write-Host "Icono y pantalla de inicio de RomaCrece actualizados."
