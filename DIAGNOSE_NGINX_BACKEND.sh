#!/bin/bash

# Diagnostic script to check Nginx and Backend configuration
# Run this on your server to identify the exact issue

echo "=== Durchex API Diagnostic Tool ==="
echo ""

# Check 1: Backend is running
echo "1. Checking if backend is running on port 3000..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is responding"
    curl -s http://localhost:3000/api/health | head -3
else
    echo "   ❌ Backend is NOT responding on port 3000"
    echo "   Check: pm2 list or ps aux | grep node"
fi
echo ""

# Check 2: Backend routes
echo "2. Testing backend routes directly..."
echo "   Testing: http://localhost:3000/api/v1/admin/stats"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/admin/stats)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
    echo "   ✅ Backend route exists (status: $STATUS)"
elif [ "$STATUS" = "404" ]; then
    echo "   ❌ Backend route returns 404"
    echo "   Response:"
    curl -s http://localhost:3000/api/v1/admin/stats | head -5
else
    echo "   ⚠️  Backend route returned: $STATUS"
fi
echo ""

# Check 3: Nginx config file location
echo "3. Finding Nginx config file..."
CONFIG_FILE="/home/durchex/htdocs/durchex.com/nginx.conf"
if [ -f "$CONFIG_FILE" ]; then
    echo "   ✅ Found: $CONFIG_FILE"
else
    echo "   ❌ Not found at: $CONFIG_FILE"
    echo "   Searching..."
    find /home/durchex -name "nginx.conf" -type f 2>/dev/null | head -3
    find /home/cloudpanel -name "nginx.conf" -type f 2>/dev/null | head -3
fi
echo ""

# Check 4: Nginx location /api/ block
if [ -f "$CONFIG_FILE" ]; then
    echo "4. Checking Nginx location /api/ configuration..."
    if grep -q "location /api/" "$CONFIG_FILE"; then
        echo "   ✅ location /api/ block exists"
        echo ""
        echo "   Current configuration:"
        grep -A 10 "location /api/" "$CONFIG_FILE" | head -12
        echo ""
        
        # Check proxy_pass
        PROXY_PASS=$(grep -A 1 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1)
        echo "   proxy_pass line: $PROXY_PASS"
        
        if echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000/api/"; then
            echo "   ✅ proxy_pass is correctly configured"
        elif echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000;"; then
            echo "   ❌ proxy_pass is WRONG - missing /api/ at the end"
            echo "   Should be: proxy_pass http://localhost:3000/api/;"
        else
            echo "   ⚠️  proxy_pass format unclear: $PROXY_PASS"
        fi
    else
        echo "   ❌ location /api/ block NOT FOUND"
        echo "   You need to add it to your Nginx config"
    fi
fi
echo ""

# Check 5: Test through Nginx
echo "5. Testing API through Nginx (from server)..."
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/admin/stats 2>/dev/null)
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "401" ]; then
    echo "   ✅ Nginx proxy is working (status: $NGINX_STATUS)"
elif [ "$NGINX_STATUS" = "404" ]; then
    echo "   ❌ Nginx proxy returns 404"
    echo "   Response:"
    curl -s http://localhost/api/v1/admin/stats 2>/dev/null | head -5
else
    echo "   ⚠️  Nginx proxy returned: $NGINX_STATUS"
fi
echo ""

# Check 6: Nginx error logs
echo "6. Recent Nginx errors (last 5 lines)..."
if [ -f "/home/durchex/htdocs/durchex.com/logs/error.log" ]; then
    tail -5 /home/durchex/htdocs/durchex.com/logs/error.log 2>/dev/null | grep -i "api\|proxy\|404" || echo "   No relevant errors found"
else
    echo "   ⚠️  Error log not found at expected location"
fi
echo ""

# Summary
echo "=== Summary ==="
echo ""
if [ -f "$CONFIG_FILE" ] && grep -q "location /api/" "$CONFIG_FILE"; then
    PROXY_PASS=$(grep -A 1 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1)
    if echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000/api/"; then
        echo "✅ Nginx config looks correct"
        echo "   If still getting 404, try: sudo systemctl reload nginx"
    else
        echo "❌ Nginx config needs fixing"
        echo "   Run: sudo bash FIX_NGINX_PROXY.sh"
        echo "   Or manually edit: $CONFIG_FILE"
    fi
else
    echo "❌ Nginx location /api/ block is missing"
    echo "   Add it to: $CONFIG_FILE"
fi

echo ""
echo "=== Next Steps ==="
echo "1. If backend is not running: Start it (pm2 start or npm start)"
echo "2. If Nginx config is wrong: Run FIX_NGINX_PROXY.sh"
echo "3. If Nginx config is correct: Reload Nginx (sudo systemctl reload nginx)"
echo "4. Test from browser: https://durchex.com/api/v1/admin/stats"

