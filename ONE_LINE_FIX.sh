#!/bin/bash

# One-line fix for the Nginx proxy issue
# Run: sudo bash ONE_LINE_FIX.sh

CONFIG_FILE="/home/durchex/htdocs/durchex.com/nginx.conf"

echo "=== One-Line Nginx Fix ==="
echo ""

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "Fixing: $CONFIG_FILE"
echo ""

# Backup
cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# Fix all variations
sed -i 's|proxy_pass http://localhost:3000/api;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
sed -i 's|proxy_pass http://localhost:3000/api$|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
sed -i 's|proxy_pass http://localhost:3000;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"

# Verify
NEW_PROXY=$(grep -A 2 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1)
echo "New config: $NEW_PROXY"
echo ""

# Test
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    echo ""
    echo "✅ Fix complete! Test: curl -I https://durchex.com/api/v1/admin/stats"
else
    echo "❌ Config has errors!"
    exit 1
fi

