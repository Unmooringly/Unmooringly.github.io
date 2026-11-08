# 打包「网页版」：只复制站点真正需要的文件，并自动清空 API Key
# 用法：右键本文件 →「使用 PowerShell 运行」；或
#       powershell -ExecutionPolicy Bypass -File .\打包网页版.ps1
# 产物：.\网页版\  —— 把这个文件夹里的**内容**传到 GitHub 仓库根目录即可
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out  = Join-Path $root "网页版"

Write-Host "=== 打包网页版（供 GitHub Pages / Gitee Pages 等静态托管使用）===" -ForegroundColor Cyan

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null

# 1) 站点骨架
Copy-Item (Join-Path $root "index.html") $out -Force
Copy-Item (Join-Path $root "css") $out -Recurse -Force
Copy-Item (Join-Path $root "js")  $out -Recurse -Force

# 2) 素材（代码只引用 素材/，不引用 终稿图库 / 原始 mp4）
Copy-Item (Join-Path $root "素材") $out -Recurse -Force

# 3) 清空 API Key —— 托管在静态站点上绝不能带密钥
#    逐行处理，比正则更稳：凡是形如  apiKey: "xxxx",  的行，引号内一律清空
$cfgPath = Join-Path $out "js\config.js"
$lines = [System.IO.File]::ReadAllLines($cfgPath, [System.Text.Encoding]::UTF8)
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match '^\s*apiKey\s*:\s*".*"\s*,?\s*$') {
    $lines[$i] = $lines[$i] -replace '"[^"]*"', '""'
  }
}
[System.IO.File]::WriteAllLines($cfgPath, $lines, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "[i] 已清空 js/config.js 里的 API Key" -ForegroundColor Yellow

# 4) 附一份部署说明
$doc = Join-Path $root "部署到GitHub.md"
if (Test-Path $doc) { Copy-Item $doc $out -Force }

# 5) 体积报告
$files = Get-ChildItem $out -Recurse -File
$sum   = ($files | Measure-Object Length -Sum).Sum
Write-Host ""
Write-Host ("文件数：" + $files.Count) -ForegroundColor Green
Write-Host ("总大小：" + [math]::Round($sum / 1MB, 2) + " MB") -ForegroundColor Green
Write-Host ""
Write-Host "接下来：" -ForegroundColor Cyan
Write-Host "  1. 在 GitHub 新建仓库（Public）"
Write-Host "  2. 把「网页版」文件夹里的内容（不是文件夹本身）传上去"
Write-Host "  3. 仓库 Settings -> Pages -> Deploy from a branch -> main / (root) -> Save"
Write-Host "  4. 等 30~60 秒，访问 https://你的用户名.github.io/仓库名/"
Write-Host ""
Write-Host ("产物目录：" + $out) -ForegroundColor Green
