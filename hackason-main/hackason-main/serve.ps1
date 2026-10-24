# ============================================================
# 解忧慢递邮局 —— 本地静态服务器（双击「启动本地预览.bat」时自动运行）
#
# 为什么需要它：
#   项目使用浏览器原生 ES Modules（<script type="module">），
#   浏览器禁止用 file:// 协议加载模块脚本，
#   所以必须通过 http:// 打开页面，界面才会正常渲染。
#
# 特点：零依赖、只用 Windows 自带的 PowerShell、不写入任何数据。
# ============================================================

$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot

# 常见静态资源的 Content-Type
$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.htm'   = 'text/html; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.js'    = 'text/javascript; charset=utf-8'
  '.mjs'   = 'text/javascript; charset=utf-8'
  '.json'  = 'application/json; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.png'   = 'image/png'
  '.jpg'   = 'image/jpeg'
  '.jpeg'  = 'image/jpeg'
  '.gif'   = 'image/gif'
  '.webp'  = 'image/webp'
  '.ico'   = 'image/x-icon'
  '.woff'  = 'font/woff'
  '.woff2' = 'font/woff2'
  '.txt'   = 'text/plain; charset=utf-8'
}

# ---------- 启动监听（8000 被占用时自动往后找） ----------
$listener = $null
$port = 0

foreach ($candidate in 8000..8010) {
  try {
    $tryListener = New-Object System.Net.HttpListener
    $tryListener.Prefixes.Add("http://localhost:$candidate/")
    $tryListener.Start()
    $listener = $tryListener
    $port = $candidate
    break
  } catch {
    if ($tryListener) { $tryListener.Close() }
  }
}

if (-not $listener) {
  Write-Host ''
  Write-Host '启动失败：8000-8010 端口都被占用了。' -ForegroundColor Red
  Write-Host '请关掉占用端口的程序（比如另一个预览窗口），再双击一次。'
  Write-Host ''
  Read-Host '按回车键关闭'
  exit 1
}

$url = "http://localhost:$port/"

Write-Host ''
Write-Host '  ✉️  解忧慢递邮局 · 本地预览' -ForegroundColor Yellow
Write-Host "  访问地址：$url"
Write-Host "  站点目录：$root"
Write-Host '  关闭这个窗口（或按 Ctrl+C）即可停止服务器。'
Write-Host ''

Start-Process $url

# ---------- 处理请求 ----------
try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()

    try {
      $relative = [Uri]::UnescapeDataString($context.Request.Url.LocalPath).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($relative)) {
        $relative = 'index.html'
      }

      $fullPath = [IO.Path]::GetFullPath((Join-Path $root $relative))
      $rootPath = [IO.Path]::GetFullPath($root)

      # 防止用 ../ 访问项目目录以外的文件
      $inRoot = $fullPath.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)

      if (-not $inRoot -or -not (Test-Path $fullPath -PathType Leaf)) {
        $context.Response.StatusCode = 404
        $context.Response.Close()
        continue
      }

      $bytes = [IO.File]::ReadAllBytes($fullPath)
      $ext = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      if ($mime.ContainsKey($ext)) {
        $context.Response.ContentType = $mime[$ext]
      }

      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
    } catch {
      try {
        $context.Response.StatusCode = 500
        $context.Response.Close()
      } catch {
        # 浏览器中途断开时忽略
      }
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
