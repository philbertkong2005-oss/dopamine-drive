# Bundles the site into one self-contained HTML file at dist/dopamine-drive.html
# so it can be hosted anywhere (or opened straight from a USB stick).
# Usage:  powershell -ExecutionPolicy Bypass -File build-single-file.ps1

$root = $PSScriptRoot
$out  = Join-Path $root 'dist'
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

# -Encoding UTF8 is essential: Windows PowerShell 5.1 otherwise reads these as
# ANSI and mangles every em dash, accent and emoji in the source.
$html = Get-Content (Join-Path $root 'index.html') -Raw -Encoding UTF8
$css  = Get-Content (Join-Path $root 'styles.css') -Raw -Encoding UTF8

# Everything inside <body>, minus the external <script src> tags we're about to inline.
$body = [regex]::Match($html, '(?s)<body[^>]*>(.*?)</body>').Groups[1].Value
$body = [regex]::Replace($body, '(?s)<script\s+src=[^>]*>\s*</script>\s*', '')

$js = @('data.js', 'art.js', 'app.js') |
      ForEach-Object { "// ---- $_ ----`n" + (Get-Content (Join-Path $root $_) -Raw -Encoding UTF8) }

# The dark neon ground is the identity here, so the page commits to one theme
# instead of following the viewer's light/dark preference.
$preamble = @'
:root, :root[data-theme="light"], :root[data-theme="dark"] { color-scheme: dark; }
html, body { background-color: #0b0c10; }
'@

# Taken from index.html rather than hardcoded, so it can't drift — and so this
# script stays pure ASCII (PS 5.1 reads BOM-less UTF-8 scripts as ANSI).
$title = [regex]::Match($html, '(?s)<title>(.*?)</title>').Groups[1].Value

$doc = @"
<title>$title</title>
<style>
$preamble
$css
</style>
$body
<script>
$($js -join "`n`n")
</script>
"@

$target = Join-Path $out 'dopamine-drive.html'
[System.IO.File]::WriteAllText($target, $doc, (New-Object System.Text.UTF8Encoding $false))
$kb = [math]::Round((Get-Item $target).Length / 1KB, 1)
Write-Host "Built $target ($kb KB)" -ForegroundColor Green
