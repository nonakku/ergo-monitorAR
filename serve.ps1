# ErgoMonitor AR オフライン起動用ローカルHTTPサーバ
# Windows 標準の PowerShell だけで動作します（管理者権限・追加インストール不要）。
# http://localhost:8000/ で配信し、既定ブラウザを自動で開きます。
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
# 前方一致の比較が兄弟ディレクトリ（例: ...\ergo-monitorAR-backup）を誤許可しないよう、末尾に区切り文字を付ける
$rootPrefix = $root.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

# MediaPipe のアセット（.wasm / .data / .tflite / .binarypb）を正しく配信するためのMIMEマップ
$mime = @{
    '.html'     = 'text/html; charset=utf-8'
    '.css'      = 'text/css; charset=utf-8'
    '.js'       = 'text/javascript; charset=utf-8'
    '.wasm'     = 'application/wasm'
    '.data'     = 'application/octet-stream'
    '.tflite'   = 'application/octet-stream'
    '.binarypb' = 'application/octet-stream'
    '.json'     = 'application/json; charset=utf-8'
    '.png'      = 'image/png'
    '.jpg'      = 'image/jpeg'
    '.svg'      = 'image/svg+xml'
    '.ico'      = 'image/x-icon'
}

# localhost プレフィックスは管理者権限不要。8000 が使用中なら 8001〜8010 を順に試す。
$listener = $null
$port = $null
foreach ($p in 8000..8010) {
    $candidate = New-Object System.Net.HttpListener
    $candidate.Prefixes.Add("http://localhost:$p/")
    try {
        $candidate.Start()
        $listener = $candidate
        $port = $p
        break
    } catch {
        $candidate.Close()
    }
}
if (-not $listener) {
    Write-Host 'エラー: ポート 8000〜8010 がすべて使用中のため起動できませんでした。' -ForegroundColor Red
    Read-Host 'Enter キーを押すと終了します'
    exit 1
}

$url = "http://localhost:$port/"
Write-Host ''
Write-Host "ErgoMonitor AR オフラインサーバを起動しました: $url" -ForegroundColor Green
Write-Host 'このウィンドウを閉じる（または Ctrl+C）とサーバが停止します。'
Write-Host ''
Start-Process $url

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $res = $context.Response
    try {
        $rel = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
        if ($rel -eq '') { $rel = 'index.html' }
        $path = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
        # 配信ルート外へのパストラバーサルを拒否
        if (-not $path.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
            -not (Test-Path -LiteralPath $path -PathType Leaf)) {
            $res.StatusCode = 404
            $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        } else {
            $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
            $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
            $body = [System.IO.File]::ReadAllBytes($path)
        }
        $res.ContentLength64 = $body.Length
        $res.OutputStream.Write($body, 0, $body.Length)
    } catch {
        try { $res.StatusCode = 500 } catch {}
    } finally {
        $res.Close()
    }
}
