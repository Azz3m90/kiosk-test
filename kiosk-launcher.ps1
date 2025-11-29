# Restaurant Kiosk Launcher Script (Windows PowerShell)
# Purpose: Launch the kiosk application in secure, locked-down mode
# Usage: Run this script at Windows startup via Task Scheduler

# ============================================
# CONFIGURATION
# ============================================

# Application URL (CHANGE THIS to your production URL)
$APP_URL = "http://localhost:3000"  # Development
# $APP_URL = "https://kiosk.restaurant.com"  # Production

# Browser Path (Chrome or Edge)
$CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$EDGE_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Choose browser (chrome or edge)
$BROWSER = "chrome"

# Kiosk user data directory (isolated profile)
$USER_DATA_DIR = "$env:LOCALAPPDATA\KioskBrowser"

# ============================================
# SECURITY FLAGS
# ============================================

$KIOSK_FLAGS = @(
    # Kiosk Mode
    "--kiosk",
    "--app=$APP_URL",
    
    # Disable UI Elements
    "--no-first-run",
    "--disable-session-crashed-bubble",
    "--disable-infobars",
    "--disable-translate",
    "--disable-features=TranslateUI",
    
    # Disable Developer Tools
    "--disable-dev-tools",
    
    # Disable Extensions
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    
    # Disable Sync
    "--disable-sync",
    "--disable-sync-preferences",
    
    # Disable Auto Updates (managed separately)
    "--disable-background-networking",
    
    # Disable Popup Blocking (allow application popups only)
    "--disable-popup-blocking",
    
    # Disable Right-Click Context Menu
    "--disable-features=ContextMenu",
    
    # Security
    "--disable-file-system",
    "--disable-local-storage",  # Optional: enable if you need cart persistence
    "--no-pings",
    
    # Performance
    "--disk-cache-size=1",
    "--media-cache-size=1",
    
    # User Data Directory (isolated profile)
    "--user-data-dir=$USER_DATA_DIR",
    
    # Incognito Mode (no history, cache cleared on exit)
    "--incognito"
)

# ============================================
# PRE-LAUNCH CLEANUP
# ============================================

Write-Host "=== Restaurant Kiosk Launcher ===" -ForegroundColor Green
Write-Host "Starting kiosk application..." -ForegroundColor Yellow

# Clear previous session data
if (Test-Path $USER_DATA_DIR) {
    Write-Host "Clearing previous session data..." -ForegroundColor Yellow
    try {
        Remove-Item -Path "$USER_DATA_DIR\*" -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Warning: Could not clear all session data" -ForegroundColor Red
    }
}

# Create user data directory
if (-not (Test-Path $USER_DATA_DIR)) {
    New-Item -ItemType Directory -Path $USER_DATA_DIR -Force | Out-Null
}

# ============================================
# DISABLE WINDOWS SHORTCUTS (OPTIONAL)
# ============================================

# Disable Alt+Tab, Alt+F4, Ctrl+Alt+Del (requires admin rights)
# Uncomment if needed and run as administrator
<#
$signature = @"
[DllImport("user32.dll")]
public static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);
[DllImport("user32.dll")]
public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
"@
$type = Add-Type -MemberDefinition $signature -Name "Win32HotKey" -Namespace Win32Functions -PassThru
#>

# ============================================
# LAUNCH BROWSER
# ============================================

# Select browser executable
if ($BROWSER -eq "chrome") {
    $BROWSER_PATH = $CHROME_PATH
} else {
    $BROWSER_PATH = $EDGE_PATH
}

# Check if browser exists
if (-not (Test-Path $BROWSER_PATH)) {
    Write-Host "ERROR: Browser not found at $BROWSER_PATH" -ForegroundColor Red
    Write-Host "Please install Chrome or Edge, or update the path in this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Launching browser: $BROWSER_PATH" -ForegroundColor Green
Write-Host "Application URL: $APP_URL" -ForegroundColor Green
Write-Host ""

# Build command line arguments
$ARGS_STRING = $KIOSK_FLAGS -join " "

# Launch browser
try {
    Start-Process -FilePath $BROWSER_PATH -ArgumentList $KIOSK_FLAGS
    Write-Host "Kiosk application launched successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to launch browser" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# ============================================
# MONITORING (OPTIONAL)
# ============================================

# Wait for browser process to start
Start-Sleep -Seconds 2

# Get browser process name
if ($BROWSER -eq "chrome") {
    $PROCESS_NAME = "chrome"
} else {
    $PROCESS_NAME = "msedge"
}

# Check if browser is running
$browserProcess = Get-Process -Name $PROCESS_NAME -ErrorAction SilentlyContinue
if ($browserProcess) {
    Write-Host "Browser process ID: $($browserProcess.Id)" -ForegroundColor Cyan
} else {
    Write-Host "Warning: Browser process not detected" -ForegroundColor Yellow
}

# ============================================
# AUTO-RESTART ON CRASH (OPTIONAL)
# ============================================

# Uncomment to enable automatic restart if browser crashes
<#
Write-Host "Monitoring browser process for auto-restart..." -ForegroundColor Cyan

while ($true) {
    Start-Sleep -Seconds 10
    
    $browserProcess = Get-Process -Name $PROCESS_NAME -ErrorAction SilentlyContinue
    
    if (-not $browserProcess) {
        Write-Host "Browser crashed! Restarting in 3 seconds..." -ForegroundColor Red
        Start-Sleep -Seconds 3
        
        # Clear data
        Remove-Item -Path "$USER_DATA_DIR\*" -Recurse -Force -ErrorAction SilentlyContinue
        
        # Relaunch
        Start-Process -FilePath $BROWSER_PATH -ArgumentList $KIOSK_FLAGS
        Write-Host "Browser restarted" -ForegroundColor Green
    }
}
#>

Write-Host ""
Write-Host "Kiosk launcher script completed." -ForegroundColor Green
Write-Host "Browser will continue running until manually closed or system restart." -ForegroundColor Cyan

# ============================================
# NOTES
# ============================================

<#
DEPLOYMENT INSTRUCTIONS:

1. Update $APP_URL to your production URL
2. Save this script to: C:\Kiosk\kiosk-launcher.ps1
3. Create Windows Task Scheduler task:
   - Trigger: At startup
   - Action: powershell.exe -ExecutionPolicy Bypass -File "C:\Kiosk\kiosk-launcher.ps1"
   - Run with highest privileges
   - Configure for kiosk user account

4. Windows Assigned Access Setup:
   - Settings > Accounts > Other Users
   - Set up assigned access
   - Choose kiosk user account
   - Select Chrome or Edge as kiosk app
   - Configure to launch this script

5. Optional: Disable keyboard shortcuts via Group Policy
   - gpedit.msc > User Configuration > Administrative Templates
   - Disable Windows key shortcuts
   - Disable Alt+Tab, Alt+F4

6. Network Security:
   - Configure Windows Firewall to allow only whitelisted domains
   - Block access to Control Panel, Task Manager, Settings

MAINTENANCE:

- Daily reboot: Use Task Scheduler to reboot at 3 AM
- Remote monitoring: Install TeamViewer or similar for remote support
- Logs: Check Event Viewer for application errors

TROUBLESHOOTING:

- Browser won't start: Check $BROWSER_PATH
- Can't exit kiosk: Ctrl+Alt+Del > Task Manager (if enabled) > End chrome.exe
- Admin access: Use dedicated admin account, not kiosk account
#>