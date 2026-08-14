param(
  [int]$MaxWidth = 960,
  [int]$Quality = 62,
  [int]$MinimumBytes = 0
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot "assets\images"
$previewRoot = Join-Path $sourceRoot "previews"

Get-ChildItem -LiteralPath $sourceRoot -Recurse -File |
  Where-Object {
    $_.FullName -notlike "$previewRoot*" -and
    $_.Extension -match '^\.(jpg|jpeg|png)$' -and
    $_.Length -ge $MinimumBytes
  } |
  ForEach-Object {
    $relative = $_.FullName.Substring($sourceRoot.Length + 1)
    $targetRelative = [System.IO.Path]::ChangeExtension($relative, ".webp")
    $target = Join-Path $previewRoot $targetRelative
    $targetDirectory = Split-Path -Parent $target

    if (-not (Test-Path -LiteralPath $targetDirectory)) {
      New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    }

    if ((Test-Path -LiteralPath $target) -and
        (Get-Item -LiteralPath $target).LastWriteTimeUtc -ge $_.LastWriteTimeUtc) {
      return
    }

    & ffmpeg -hide_banner -loglevel error -y -i $_.FullName `
      -vf "scale='min($MaxWidth,iw)':-2" -c:v libwebp -quality $Quality `
      -compression_level 5 -frames:v 1 $target

    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Preview generation failed: $relative"
    }
  }
