#!/bin/bash

# Fix the actual Nginx config that's being used
# Run: sudo bash FIX_ACTUAL_NGINX_CONFIG.sh

echo "=== Finding and Fixing Actual Nginx Config ==="
echo ""

# Find the actual config file being used
ACTUAL_CONFIG=""

# Check CloudPanel location first
CLOUDPANEL_CONFIG="/home/durchex/htdocs/durchex.com/nginx.conf"
if [ -f "$CLOUDPANEL_CONFIG" ] && sudo nginx -T 2>/dev/null | grep -q "$CLOUDPANEL_CONFIG"; then
then
    ACTUAL_CONFIG="$CLOUDPANEL_CONFIG"
    echo "✅ Found CloudPanel config: $ACTUAL_CONFIG"
elif [ -f "/etc/nginx/sites-available/durchex.com" ]; then
    ACTUAL_CONFIG="/etc/nginx/sites-available/durchex.com"
    echo "✅ Found sites-available config: $ACTUAL_CONFIG"
else
    # Try to find it from nginx -T output
    ACTUAL_CONFIG=$(sudo nginx -T 2>/dev/null | grep -B 5 "server_name.*durchex" | grep "configuration file" | tail -1 | awk '{print $NF}' | tr -d ':')
    if [ -n "$ACTUAL_CONFIG" ] && [ -f "$ACTUAL_CONFIG" ]; then
        echo "✅ Found from nginx -T: $ACTUAL_CONFIG"
    else
        echo "❌ Could not find actual config file"
        echo "   Trying CloudPanel location..."
        ACTUAL_CONFIG="$CLOUDPANEL_CONFIG"
    fi
fi

if [ ! -f "$ACTUAL_CONFIG" ]; then
    echo "❌ Config file not found: $ACTUAL_CONFIG"
    echo "   Run: bash FIND_NGINX_CONFIG.sh to find the correct file"
    exit 1
fi

echo "Using config: $ACTUAL_CONFIG"
echo ""

# Backup
BACKUP_FILE="${ACTUAL_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ACTUAL_CONFIG" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Check current state
echo "=== Current Configuration ==="
if grep -q "location /api/" "$ACTUAL_CONFIG"; then
    echo "Found location /api/ block:"
    grep -A 5 "location /api/" "$ACTUAL_CONFIG" | head -10
else
    echo "❌ location /api/ block NOT FOUND"
    echo "   Will add it..."
fi
echo ""

# Fix it
echo "=== Applying Fix ==="

# Remove old /api/ block if exists
if grep -q "location /api/" "$ACTUAL_CONFIG"; then
    # Get line numbers
    START_LINE=$(grep -n "location /api/" "$ACTUAL_CONFIG" | head -1 | cut -d: -f1)
    END_LINE=$(awk -v start="$START_LINE" 'NR > start && /^[[:space:]]*}/ {print NR; exit}' "$ACTUAL_CONFIG")
    
    if [ -n "$END_LINE" ]; then
        # Remove old block
        sed -i "${START_LINE},${END_LINE}d" "$ACTUAL_CONFIG"
        echo "✅ Removed old location /api/ block"
    fi
fi

# Find where to insert (after location / block)
if grep -q "location / {" "$ACTUAL_CONFIG"; then
    LOC_START=$(grep -n "location / {" "$ACTUAL_CONFIG" | head -1 | cut -d: -f1)
    LOC_END=$(awk -v start="$LOC_START" 'NR > start && /^[[:space:]]*}/ {print NR; exit}' "$ACTUAL_CONFIG")
    
    # Insert correct block
    CORRECT_BLOCK="
    # API Proxy - Proxies /api/ requests to backend on port 3000
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }"
    
    # Insert after location / block
    head -n "$LOC_END" "$ACTUAL_CONFIG" > /tmp/nginx_fix.tmp
    echo "$CORRECT_BLOCK" >> /tmp/nginx_fix.tmp
    tail -n +$((LOC_END + 1)) "$ACTUAL_CONFIG" >> /tmp/nginx_fix.tmp
    mv /tmp/nginx_fix.tmp "$ACTUAL_CONFIG"
    
    echo "✅ Added correct location /api/ block"
else
    echo "❌ Could not find location / block"
    exit 1
fi

echo ""

# Also do sed replacements as backup
sed -i 's|proxy_pass http://localhost:3000/api;|proxy_pass http://localhost:3000/api/;|g' "$ACTUAL_CONFIG"
sed -i 's|proxy_pass http://localhost:3000;|proxy_pass http://localhost:3000/api/;|g' "$ACTUAL_CONFIG"

# Verify
echo "=== New Configuration ==="
grep -A 5 "location /api/" "$ACTUAL_CONFIG" | head -10
echo ""

PROXY_PASS=$(grep -A 2 "location /api/" "$ACTUAL_CONFIG" | grep "proxy_pass" | head -1)
if echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000/api/;"; then
    echo "✅ Configuration is correct: $PROXY_PASS"
else
    echo "❌ Configuration still wrong: $PROXY_PASS"
    exit 1
fi

echo ""
echo "=== Testing and Reloading ==="
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config is valid"
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
    echo ""
    echo "Test: curl -I https://durchex.com/api/v1/admin/stats"
else
    echo "❌ Config has errors!"
    echo "Restore: cp $BACKUP_FILE $ACTUAL_CONFIG"
    exit 1
fi

