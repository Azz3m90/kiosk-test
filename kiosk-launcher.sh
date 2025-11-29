#!/bin/bash

# Restaurant Kiosk Launcher Script (Linux/macOS)
# Purpose: Launch the kiosk application in secure, locked-down mode
# Usage: Run this script at system startup via systemd service

# ============================================
# CONFIGURATION
# ============================================

# Application URL (CHANGE THIS to your production URL)
APP_URL="http://localhost:3000"  # Development
# APP_URL="https://kiosk.restaurant.com"  # Production

# Browser Path
CHROME_PATH="/usr/bin/google-chrome"
CHROMIUM_PATH="/usr/bin/chromium-browser"

# Choose browser (auto-detect or force specific)
if [ -f "$CHROME_PATH" ]; then
    BROWSER_PATH="$CHROME_PATH"
elif [ -f "$CHROMIUM_PATH" ]; then
    BROWSER_PATH="$CHROMIUM_PATH"
else
    echo "ERROR: Chrome/Chromium not found"
    exit 1
fi

# Kiosk user data directory (isolated profile)
USER_DATA_DIR="/tmp/kiosk-browser"

# ============================================
# SECURITY FLAGS
# ============================================

KIOSK_FLAGS=(
    # Kiosk Mode
    "--kiosk"
    "--app=$APP_URL"
    
    # Fullscreen
    "--start-fullscreen"
    
    # Disable UI Elements
    "--no-first-run"
    "--disable-session-crashed-bubble"
    "--disable-infobars"
    "--disable-translate"
    "--disable-features=TranslateUI"
    
    # Disable Developer Tools
    "--disable-dev-tools"
    
    # Disable Extensions
    "--disable-extensions"
    "--disable-component-extensions-with-background-pages"
    
    # Disable Sync
    "--disable-sync"
    "--disable-sync-preferences"
    
    # Disable Auto Updates
    "--disable-background-networking"
    
    # Disable Popup Blocking
    "--disable-popup-blocking"
    
    # Security
    "--disable-file-system"
    "--no-pings"
    
    # Performance
    "--disk-cache-size=1"
    "--media-cache-size=1"
    
    # User Data Directory
    "--user-data-dir=$USER_DATA_DIR"
    
    # Incognito Mode
    "--incognito"
    
    # Disable GPU (optional, for older systems)
    # "--disable-gpu"
    
    # Check for updates disabled
    "--disable-component-update"
)

# ============================================
# PRE-LAUNCH CLEANUP
# ============================================

echo "=== Restaurant Kiosk Launcher ==="
echo "Starting kiosk application..."

# Clear previous session data
if [ -d "$USER_DATA_DIR" ]; then
    echo "Clearing previous session data..."
    rm -rf "$USER_DATA_DIR"/*
fi

# Create user data directory
mkdir -p "$USER_DATA_DIR"

# ============================================
# DISABLE KEYBOARD SHORTCUTS (X11)
# ============================================

# Disable Alt+Tab, Alt+F4, Ctrl+Alt+Backspace
# Requires xdotool or xmodmap
if command -v xmodmap &> /dev/null; then
    echo "Disabling dangerous keyboard shortcuts..."
    
    # Create xmodmap config to disable specific keys
    cat > /tmp/kiosk-xmodmap <<EOF
! Disable Alt+F4
clear mod1
! Disable Ctrl+Alt combinations
clear control
EOF
    
    # Apply (optional, may break legitimate shortcuts)
    # xmodmap /tmp/kiosk-xmodmap
fi

# ============================================
# HIDE MOUSE CURSOR (OPTIONAL)
# ============================================

# Install unclutter for automatic cursor hiding
# sudo apt-get install unclutter
if command -v unclutter &> /dev/null; then
    unclutter -idle 3 -root &
fi

# ============================================
# LAUNCH BROWSER
# ============================================

echo "Launching browser: $BROWSER_PATH"
echo "Application URL: $APP_URL"
echo ""

# Kill existing browser instances
pkill -f "chrome|chromium" 2>/dev/null

# Wait for cleanup
sleep 1

# Launch browser with flags
"$BROWSER_PATH" "${KIOSK_FLAGS[@]}" &

BROWSER_PID=$!
echo "Browser launched with PID: $BROWSER_PID"

# ============================================
# AUTO-RESTART ON CRASH
# ============================================

echo "Monitoring browser process for auto-restart..."

while true; do
    sleep 10
    
    if ! ps -p $BROWSER_PID > /dev/null; then
        echo "Browser crashed! Restarting in 3 seconds..."
        sleep 3
        
        # Clear data
        rm -rf "$USER_DATA_DIR"/*
        
        # Relaunch
        "$BROWSER_PATH" "${KIOSK_FLAGS[@]}" &
        BROWSER_PID=$!
        
        echo "Browser restarted with PID: $BROWSER_PID"
    fi
done

# ============================================
# NOTES
# ============================================

: <<'DEPLOYMENT_INSTRUCTIONS'

LINUX DEPLOYMENT INSTRUCTIONS:

1. Update APP_URL to your production URL

2. Save this script to: /opt/kiosk/kiosk-launcher.sh

3. Make executable:
   chmod +x /opt/kiosk/kiosk-launcher.sh

4. Create systemd service:
   sudo nano /etc/systemd/system/kiosk.service

   [Unit]
   Description=Restaurant Kiosk Application
   After=network.target graphical.target

   [Service]
   Type=simple
   User=kiosk
   Environment=DISPLAY=:0
   Environment=XAUTHORITY=/home/kiosk/.Xauthority
   ExecStart=/opt/kiosk/kiosk-launcher.sh
   Restart=always
   RestartSec=3

   [Install]
   WantedBy=graphical.target

5. Enable and start service:
   sudo systemctl enable kiosk.service
   sudo systemctl start kiosk.service

6. Auto-login kiosk user (Ubuntu/Debian):
   Edit /etc/gdm3/custom.conf or /etc/lightdm/lightdm.conf
   
   [daemon]
   AutomaticLoginEnable=true
   AutomaticLogin=kiosk

7. Disable unnecessary services:
   sudo systemctl disable bluetooth
   sudo systemctl disable cups
   sudo systemctl disable avahi-daemon

8. Firewall (ufw):
   sudo ufw enable
   sudo ufw allow from 192.168.1.0/24  # Local network only
   sudo ufw deny out to any  # Block outbound by default
   sudo ufw allow out to <your-api-server-ip>

9. Scheduled reboot:
   sudo crontab -e
   0 3 * * * /sbin/shutdown -r now

RASPBERRY PI SPECIFIC:

1. Install Chromium:
   sudo apt-get install chromium-browser unclutter

2. Disable screen blanking:
   Edit /etc/xdg/lxsession/LXDE-pi/autostart
   
   @xset s off
   @xset -dpms
   @xset s noblank

3. Auto-start kiosk:
   Add to autostart:
   @/opt/kiosk/kiosk-launcher.sh

TROUBLESHOOTING:

- Check logs: sudo journalctl -u kiosk.service -f
- Restart service: sudo systemctl restart kiosk.service
- Access terminal: Ctrl+Alt+F1 (if not disabled)
- Remote access: SSH enabled, firewall allows port 22

DEPLOYMENT_INSTRUCTIONS