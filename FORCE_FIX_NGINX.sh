#!/bin/bash

# Force fix Nginx proxy - verifies and fixes the configuration
# Run: sudo bash FORCE_FIX_NGINX.sh

echo "=== Force Fix Nginx Proxy ==="
echo ""

CONFIG_FILE="/home/durchex/htdocs/durchex.com/nginx.conf"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo "Searching for nginx.conf..."
    find /home/durchex -name "nginx.conf" -type f 2>/dev/null | head -3
    exit 1
fi

echo "Config file: $CONFIG_FILE"
echo ""

# Show current config
echo "=== Current Configuration ==="
grep -A 5 "location /api/" "$CONFIG_FILE" | head -10
echo ""

# Backup
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Fix ALL possible variations
echo "=== Applying Fixes ==="

# Remove any existing /api/ location block and recreate it correctly
# First, let's check what we have
if grep -q "location /api/" "$CONFIG_FILE"; then
    echo "Found location /api/ block"
    
    # Get the line numbers
    START_LINE=$(grep -n "location /api/" "$CONFIG_FILE" | head -1 | cut -d: -f1)
    
    # Find the end of the block (next closing brace at same indentation)
    END_LINE=$(awk -v start="$START_LINE" 'NR > start && /^[[:space:]]*}/ {print NR; exit}' "$CONFIG_FILE")
    
    if [ -z "$END_LINE" ]; then
        END_LINE=$((START_LINE + 15))  # Fallback
    fi
    
    echo "Block found at lines $START_LINE-$END_LINE"
    
    # Create the correct block
    CORRECT_BLOCK="    # API Proxy - Proxies /api/ requests to backend on port 3000
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
    
    # Create temp file with correct block
    head -n $((START_LINE - 1)) "$CONFIG_FILE" > /tmp/nginx_fix_part1
    echo "$CORRECT_BLOCK" > /tmp/nginx_fix_block
    tail -n +$((END_LINE + 1)) "$CONFIG_FILE" > /tmp/nginx_fix_part2
    
    # Combine
    cat /tmp/nginx_fix_part1 /tmp/nginx_fix_block /tmp/nginx_fix_part2 > "$CONFIG_FILE.new"
    mv "$CONFIG_FILE.new" "$CONFIG_FILE"
    
    echo "✅ Replaced location /api/ block"
else
    echo "⚠️  location /api/ block not found, adding it..."
    # Add it after location / block
    if grep -q "location / {" "$CONFIG_FILE"; then
        # Find location / block end
        LOC_START=$(grep -n "location / {" "$CONFIG_FILE" | head -1 | cut -d: -f1)
        LOC_END=$(awk -v start="$LOC_START" 'NR > start && /^[[:space:]]*}/ {print NR; exit}' "$CONFIG_FILE")
        
        # Insert after location / block
        head -n "$LOC_END" "$CONFIG_FILE" > /tmp/nginx_fix_part1
        echo "" >> /tmp/nginx_fix_part1
        echo "$CORRECT_BLOCK" >> /tmp/nginx_fix_part1
        tail -n +$((LOC_END + 1)) "$CONFIG_FILE" >> /tmp/nginx_fix_part1
        mv /tmp/nginx_fix_part1 "$CONFIG_FILE"
        
        echo "✅ Added location /api/ block"
    else
        echo "❌ Could not find location / block to insert after"
        exit 1
    fi
fi

echo ""

# Also do sed replacements as backup
sed -i 's|proxy_pass http://localhost:3000/api;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
sed -i 's|proxy_pass http://localhost:3000/api$|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
sed -i 's|proxy_pass http://localhost:3000;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"

echo "=== New Configuration ==="
grep -A 5 "location /api/" "$CONFIG_FILE" | head -10
echo ""

# Verify
PROXY_PASS=$(grep -A 2 "location /api/" "$CONFIG_FILE" | grep "proxy_pass" | head -1)
if echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000/api/;"; then
    echo "✅ Configuration is correct: $PROXY_PASS"
else
    echo "❌ Configuration still wrong: $PROXY_PASS"
    echo "   Should be: proxy_pass http://localhost:3000/api/;"
    exit 1
fi

echo ""
echo "=== Testing Nginx Configuration ==="
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "=== Reloading Nginx ==="
    
    # Force reload
    sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null || sudo nginx -s reload 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded"
    else
        echo "⚠️  Reload command returned error, trying restart..."
        sudo systemctl restart nginx 2>/dev/null || sudo service nginx restart 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Nginx restarted"
        else
            echo "❌ Failed to reload/restart Nginx"
            echo "   Try manually: sudo systemctl restart nginx"
        fi
    fi
    
    echo ""
    echo "=== Verification ==="
    sleep 2
    echo "Testing: curl -I http://localhost/api/v1/admin/stats"
    TEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/admin/stats 2>/dev/null)
    echo "Status: $TEST_STATUS"
    
    if [ "$TEST_STATUS" = "200" ] || [ "$TEST_STATUS" = "401" ]; then
        echo "✅ Proxy is working!"
    elif [ "$TEST_STATUS" = "404" ]; then
        echo "⚠️  Still 404 - this might be a backend issue"
        echo "   Test backend directly: curl http://localhost:3000/api/v1/admin/stats"
    else
        echo "⚠️  Status: $TEST_STATUS"
    fi
else
    echo "❌ Nginx configuration has errors!"
    echo "   Restore backup: cp $BACKUP_FILE $CONFIG_FILE"
    exit 1
fi

echo ""
echo "=== Done ==="
echo "Test from browser: https://durchex.com/api/v1/admin/stats"

