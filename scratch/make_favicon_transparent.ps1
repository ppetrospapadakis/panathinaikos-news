Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Petros\.gemini\antigravity\brain\a5ba08f1-f33f-4980-8a21-6a1cdb17bd43\media__1783607695134.png"
$destPath = "c:\Users\Petros\Documents\panathnaikos-news\favicon.png"

$bmp = [System.Drawing.Image]::FromFile($srcPath)
$newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)

for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $c = $bmp.GetPixel($x, $y)
        # If the pixel is very dark (RGB all below 45), make it transparent
        if ($c.R -lt 45 -and $c.G -lt 45 -and $c.B -lt 45) {
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $newBmp.SetPixel($x, $y, $c)
        }
    }
}

$newBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$newBmp.Dispose()
Write-Host "Favicon transparency processing completed successfully!"
