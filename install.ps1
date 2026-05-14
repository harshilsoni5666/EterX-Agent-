# ═══════════════════════════════════════════════
# EterX Agent — One-Line Installer (Windows PowerShell)
# Usage: irm https://raw.githubusercontent.com/harshilsoni5666/eterx-agentuii/main/install.ps1 | iex
# ═══════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$REPO = "https://github.com/harshilsoni5666/EterX-agent-.git"
$INSTALL_DIR = if ($env:ETERX_DIR) { $env:ETERX_DIR } else { "$env:USERPROFILE\EterX" }

Write-Host ""
Write-Host "    ███████╗████████╗███████╗██████╗ ██╗  ██╗" -ForegroundColor Cyan
Write-Host "    ██╔════╝╚══██╔══╝██╔════╝██╔══██╗╚██╗██╔╝" -ForegroundColor Cyan
Write-Host "    █████╗     ██║   █████╗  ██████╔╝ ╚███╔╝ " -ForegroundColor Cyan
Write-Host "    ██╔══╝     ██║   ██╔══╝  ██╔══██╗ ██╔██╗ " -ForegroundColor Cyan
Write-Host "    ███████╗   ██║   ███████╗██║  ██║██╔╝ ██╗" -ForegroundColor Cyan
Write-Host "    ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "    ⚡ The Autonomous AI Agent System" -ForegroundColor Magenta
Write-Host ""

# ── Check Node.js ──
$nodeExists = $null
try { $nodeExists = node --version 2>$null } catch {}

if ($nodeExists) {
    Write-Host "  ✔ Node.js $nodeExists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Node.js not found. Installing..." -ForegroundColor Yellow
    try {
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        Write-Host "  ✔ Node.js installed" -ForegroundColor Green
    } catch {
        Write-Host "  ✖ Auto-install failed. Download from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
}

# ── Check Git ──
$gitExists = $null
try { $gitExists = git --version 2>$null } catch {}

if ($gitExists) {
    Write-Host "  ✔ $gitExists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Git not found. Installing..." -ForegroundColor Yellow
    try {
        winget install Git.Git --accept-source-agreements --accept-package-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        Write-Host "  ✔ Git installed" -ForegroundColor Green
    } catch {
        Write-Host "  ✖ Auto-install failed. Download from https://git-scm.com" -ForegroundColor Red
        exit 1
    }
}

# ── Clone or Update ──
if (Test-Path "$INSTALL_DIR\.git") {
    Write-Host "  ℹ Existing install found. Pulling updates..." -ForegroundColor Cyan
    Set-Location $INSTALL_DIR
    git pull --rebase 2>$null
} else {
    Write-Host "  ℹ Cloning EterX to $INSTALL_DIR..." -ForegroundColor Cyan
    git clone $REPO $INSTALL_DIR
    Set-Location $INSTALL_DIR
}

# ── Run Setup ──
Write-Host ""
Write-Host "  ℹ Starting EterX setup wizard..." -ForegroundColor Cyan
Write-Host ""
node setup.js
