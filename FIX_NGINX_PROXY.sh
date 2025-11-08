#!/bin/bash

# Script to fix Nginx proxy configuration for Durchex API
# Run this on your server: bash FIX_NGINX_PROXY.sh

echo "=== Durchex Nginx Proxy Fix ==="
echo ""

# Find the nginx config file
CONFIG_FILE="/home/durchex/htdocs/durchex.com/nginx.conf"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found at: $CONFIG_FILE"
    echo "Searching for nginx.conf files..."
    find /home/cloudpanel -name "nginx.conf" -type f 2>/dev/null | head -5
    echo ""
    echo "Please update CONFIG_FILE variable in this script with the correct path"
    exit 1
fi

echo "✅ Found config file: $CONFIG_FILE"
echo ""

# Check if location /api/ block exists
if grep -q "location /api/" "$CONFIG_FILE"; then
    echo "✅ Found location /api/ block"
    
    # Check current proxy_pass setting
    CURRENT_PROXY=$(grep -A 1 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1)
    echo "Current proxy_pass: $CURRENT_PROXY"
    
    if echo "$CURRENT_PROXY" | grep -q "proxy_pass http://localhost:3000/api/"; then
        echo "✅ Proxy is already correctly configured!"
        exit 0
    fi
    
    # Backup the config
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "✅ Created backup: $BACKUP_FILE"
    
    # Fix the proxy_pass
    sed -i 's|proxy_pass http://localhost:3000;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
    sed -i 's|proxy_pass http://localhost:3000$|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
    
    echo "✅ Updated proxy_pass to: proxy_pass http://localhost:3000/api/;"
    
    # Verify the change
    NEW_PROXY=$(grep -A 1 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1)
    echo "New proxy_pass: $NEW_PROXY"
    
else
    echo "❌ location /api/ block not found"
    echo ""
    echo "Adding location /api/ block..."
    
    # Backup
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "✅ Created backup: $BACKUP_FILE"
    
    # Find where to insert (after the main location / block)
    if grep -q "location / {" "$CONFIG_FILE"; then
        # Insert after the closing brace of location / block
        sed -i '/location \/ {/,/^[[:space:]]*}/ {
            /^[[:space:]]*}/a\
\
    # API Proxy - Proxies /api/ requests to backend on port 3000\
    location /api/ {\
        proxy_pass http://localhost:3000/api/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        \
        proxy_connect_timeout 60s;\
        proxy_send_timeout 60s;\
        proxy_read_timeout 60s;\
    }
        }' "$CONFIG_FILE"
        echo "✅ Added location /api/ block"
    else
        echo "❌ Could not find location / block to insert after"
        echo "Please manually add the location /api/ block to your nginx.conf"
        exit 1
    fi
fi

echo ""
echo "=== Testing Nginx Configuration ==="
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "=== Reloading Nginx ==="
    if sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null; then
        echo "✅ Nginx reloaded successfully"
        echo ""
        echo "=== Testing API Endpoint ==="
        sleep 1
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
            echo "✅ Backend is responding on port 3000"
        else
            echo "⚠️  Backend might not be running on port 3000"
            echo "   Check with: curl http://localhost:3000/api/health"
        fi
    else
        echo "❌ Failed to reload Nginx"
        echo "   Try manually: sudo systemctl reload nginx"
    fi
else
    echo "❌ Nginx configuration has errors!"
    echo "   Please check the config file manually"
    echo "   Restore backup if needed: cp $BACKUP_FILE $CONFIG_FILE"
    exit 1
fi

echo ""
echo "=== Done ==="
echo "Test the API: curl -I https://durchex.com/api/v1/admin/stats"

