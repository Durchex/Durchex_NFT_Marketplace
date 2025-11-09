#!/bin/bash

# Fix the Nginx config in sites-enabled (the one Nginx actually uses)
# Run: sudo bash FIX_SITES_ENABLED.sh

echo "=== Fixing Nginx sites-enabled Config ==="
echo ""

# The actual config file Nginx uses
CONFIG_FILE="/etc/nginx/sites-enabled/durchex.com.conf"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo "   Checking sites-available..."
    if [ -f "/etc/nginx/sites-available/durchex.com" ]; then
        CONFIG_FILE="/etc/nginx/sites-available/durchex.com"
        echo "   Using: $CONFIG_FILE"
    else
        echo "   File not found. Listing available configs:"
        ls -la /etc/nginx/sites-enabled/ | grep durchex
        exit 1
    fi
fi

echo "Config file: $CONFIG_FILE"
echo ""

# Backup
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Show current config
echo "=== Current /api/ Configuration ==="
if grep -q "location /api/" "$CONFIG_FILE"; then
    grep -A 5 "location /api/" "$CONFIG_FILE" | head -10
else
    echo "❌ location /api/ block NOT FOUND"
fi
echo ""

# Fix proxy_pass
echo "=== Fixing proxy_pass ==="
sed -i 's|proxy_pass http://localhost:3000/api;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
sed -i 's|proxy_pass http://localhost:3000/api$|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"
sed -i 's|proxy_pass http://localhost:3000;|proxy_pass http://localhost:3000/api/;|g' "$CONFIG_FILE"

# If location /api/ doesn't exist, add it
if ! grep -q "location /api/" "$CONFIG_FILE"; then
    echo "Adding location /api/ block..."
    
    # Find location / block
    if grep -q "location / {" "$CONFIG_FILE"; then
        LOC_END=$(awk '/location \/ \{/,/^[[:space:]]*\}/ {if (/^[[:space:]]*\}/) print NR}' "$CONFIG_FILE" | head -1)
        
        if [ -n "$LOC_END" ]; then
            # Insert after location / block
            head -n "$LOC_END" "$CONFIG_FILE" > /tmp/nginx_fix.tmp
            cat >> /tmp/nginx_fix.tmp << 'EOF'

    # API Proxy - Proxies /api/ requests to backend on port 3000
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
EOF
            tail -n +$((LOC_END + 1)) "$CONFIG_FILE" >> /tmp/nginx_fix.tmp
            mv /tmp/nginx_fix.tmp "$CONFIG_FILE"
            echo "✅ Added location /api/ block"
        fi
    fi
fi

echo ""

# Show new config
echo "=== New /api/ Configuration ==="
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
echo "=== Testing and Reloading ==="
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Config is valid"
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
    echo ""
    echo "Test: curl -I https://durchex.com/api/v1/admin/stats"
else
    echo "❌ Config has errors!"
    echo "Restore: cp $BACKUP_FILE $CONFIG_FILE"
    exit 1
fi

