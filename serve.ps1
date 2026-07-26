# Tiny static file server for local preview — no Node/Python needed.
# Usage:  powershell -ExecutionPolicy Bypass -File serve.ps1
# Then open http://localhost:4174/

$root = $PSScriptRoot
$port = 4174

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Dopamine Drive serving from $root" -ForegroundColor Cyan
Write-Host "Open http://localhost:$port/  (Ctrl+C to stop)" -ForegroundColor Green

$mime = @{
  '.html' = 'text/html'; '.css' = 'text/css'; '.js' = 'application/javascript'
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.json' = 'application/json'
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.AbsolutePath
    if ($path -eq '/') { $path = '/index.html' }
    $file = Join-Path $root ($path -replace '/', '\')
    if (Test-Path $file -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] + '; charset=utf-8' }
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop()
}
