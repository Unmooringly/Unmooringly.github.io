@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ============================================================
echo   河海大学 111 校史 · AI 时代的蜕变与憧憬
echo   本地演示服务器  （关闭本窗口即停止）
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto NONODE

for /f "tokens=*" %%v in ('node -v') do set NODEV=%%v
echo [i] Node 版本：%NODEV%
echo [i] 2 秒后自动打开：http://127.0.0.1:8080/index.html
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 2; Start-Process 'http://127.0.0.1:8080/index.html'"
node server\proxy.mjs 8080
echo.
echo 服务器已退出。
pause
exit /b 0

:NONODE
echo [x] 没有找到 Node.js。
echo.
echo     方案一：安装 Node.js 18+ 后重新双击本文件
echo             https://nodejs.org/
echo     方案二：直接双击 index.html
echo             —— 所有视觉与交互都能看，只有两处会降级：
echo                · 豆包 AI 生图 变成"程序化生成蓝图"（效果同样完整）
echo                · 人民日报 / Science 新闻 变成内置演示文案
echo.
pause
exit /b 1
