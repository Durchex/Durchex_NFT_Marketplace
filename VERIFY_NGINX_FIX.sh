#!/bin/bash

# Quick verification script to check if Nginx proxy is correctly configured
# Run this AFTER running FIX_NGINX_PROXY.sh

echo "=== Verifying Nginx Proxy Configuration ==="
echo ""

CONFIG_FILE="/home/durchex/htdocs/durchex.com/nginx.conf"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "Checking: $CONFIG_FILE"
echo ""

# Check if location /api/ exists
if ! grep -q "location /api/" "$CONFIG_FILE"; then
    echo "❌ location /api/ block NOT FOUND"
    echo "   You need to add it to your Nginx config"
    exit 1
fi

echo "✅ location /api/ block found"
echo ""

# Get the proxy_pass line
PROXY_PASS=$(grep -A 2 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1 | sed 's/^[[:space:]]*//')

echo "Current proxy_pass: $PROXY_PASS"
echo ""

# Check if it's correct
if echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000/api/;"; then
    echo "✅ CORRECT: proxy_pass has /api/ with trailing slash"
    CORRECT=true
elif echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000/api;"; then
    echo "❌ WRONG: Missing trailing slash after /api"
    echo "   Current: $PROXY_PASS"
    echo "   Should be: proxy_pass http://localhost:3000/api/;"
    CORRECT=false
elif echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000;"; then
    echo "❌ WRONG: Missing /api/ entirely"
    echo "   Current: $PROXY_PASS"
    echo "   Should be: proxy_pass http://localhost:3000/api/;"
    CORRECT=false
else
    echo "⚠️  UNKNOWN FORMAT: $PROXY_PASS"
    echo "   Should be: proxy_pass http://localhost:3000/api/;"
    CORRECT=false
fi

echo ""

if [ "$CORRECT" = false ]; then
    echo "=== Fixing the configuration ==="
    # Backup
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "✅ Created backup: $BACKUP_FILE"
    
    # Fix all variations
    sed -i 's|proxy_pass http://localhost:3000/api;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
    sed -i 's|proxy_pass http://localhost:3000/api$|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
    sed -i 's|proxy_pass http://localhost:3000;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
    
    # Verify fix
    NEW_PROXY=$(grep -A 2 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1 | sed 's/^[[:space:]]*//')
    echo "New proxy_pass: $NEW_PROXY"
    
    if echo "$NEW_PROXY" | grep -q "proxy_pass http://localhost:3000/api/;"; then
        echo "✅ Fixed successfully!"
        
        echo ""
        echo "=== Testing Nginx Configuration ==="
        if sudo nginx -t 2>&1 | grep -q "successful"; then
            echo "✅ Nginx configuration is valid"
            echo ""
            echo "=== Reloading Nginx ==="
            if sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null; then
                echo "✅ Nginx reloaded successfully"
            else
                echo "❌ Failed to reload Nginx"
                echo "   Try: sudo systemctl reload nginx"
            fi
        else
            echo "❌ Nginx configuration has errors!"
            echo "   Restore backup: cp $BACKUP_FILE $CONFIG_FILE"
        fi
    else
        echo "❌ Fix failed. Please edit manually:"
        echo "   sudo nano $CONFIG_FILE"
        echo "   Change proxy_pass to: proxy_pass http://localhost:3000/api/;"
    fi
else
    echo "✅ Configuration is correct!"
    echo ""
    echo "If you're still getting 404 errors:"
    echo "1. Reload Nginx: sudo systemctl reload nginx"
    echo "2. Check backend is running: curl http://localhost:3000/api/health"
    echo "3. Test proxy: curl -I http://localhost/api/v1/admin/stats"
fi

echo ""
echo "=== Done ==="

