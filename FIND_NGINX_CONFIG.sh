#!/bin/bash

# Find where the actual Nginx site config is
# Run: sudo bash FIND_NGINX_CONFIG.sh

echo "=== Finding Actual Nginx Configuration ==="
echo ""

# Check main config
echo "1. Main Nginx config:"
MAIN_CONFIG=$(sudo nginx -T 2>/dev/null | grep "configuration file" | head -1 | awk '{print $NF}' | tr -d ':')
echo "   $MAIN_CONFIG"
echo ""

# Check what server_name matches durchex.com
echo "2. Server blocks for durchex.com:"
sudo nginx -T 2>/dev/null | grep -B 10 "server_name.*durchex" | head -20
echo ""

# Find all config files
echo "3. All included config files:"
sudo nginx -T 2>/dev/null | grep -E "^\s*include|configuration file" | head -20
echo ""

# Check CloudPanel specific location
echo "4. CloudPanel config location:"
CLOUDPANEL_CONFIG="/home/durchex/htdocs/durchex.com/nginx.conf"
if [ -f "$CLOUDPANEL_CONFIG" ]; then
    echo "   Found: $CLOUDPANEL_CONFIG"
    echo "   Checking if it has /api/ location:"
    if grep -q "location /api/" "$CLOUDPANEL_CONFIG"; then
        echo "   ✅ Has location /api/ block"
        grep -A 3 "location /api/" "$CLOUDPANEL_CONFIG" | head -5
    else
        echo "   ❌ Does NOT have location /api/ block"
    fi
else
    echo "   ❌ Not found: $CLOUDPANEL_CONFIG"
fi
echo ""

# Check sites-available/sites-enabled
echo "5. Standard Nginx site configs:"
if [ -d "/etc/nginx/sites-available" ]; then
    echo "   Checking sites-available:"
    ls -la /etc/nginx/sites-available/ | grep -i durchex
    echo ""
    if [ -f "/etc/nginx/sites-available/durchex.com" ]; then
        echo "   Found: /etc/nginx/sites-available/durchex.com"
        if grep -q "location /api/" /etc/nginx/sites-available/durchex.com; then
            echo "   ✅ Has location /api/ block"
            grep -A 3 "location /api/" /etc/nginx/sites-available/durchex.com | head -5
        else
            echo "   ❌ Does NOT have location /api/ block"
        fi
    fi
fi

if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "   Checking sites-enabled:"
    ls -la /etc/nginx/sites-enabled/ | grep -i durchex
fi
echo ""

# Check what's actually running
echo "6. What Nginx is actually using for durchex.com:"
sudo nginx -T 2>/dev/null | grep -A 20 "server_name.*durchex" | grep -A 10 "location /api/" | head -15
echo ""

echo "=== Summary ==="
echo "The config file you need to edit is the one that Nginx is actually using."
echo "It might be in /etc/nginx/sites-available/ or included from the main config."

