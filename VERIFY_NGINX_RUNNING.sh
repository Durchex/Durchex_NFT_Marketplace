#!/bin/bash

# Verify what Nginx config is actually running
# Run: sudo bash VERIFY_NGINX_RUNNING.sh

echo "=== Verifying Running Nginx Configuration ==="
echo ""

# Get the actual config Nginx is using
echo "1. Nginx test configuration output:"
sudo nginx -T 2>/dev/null | grep -A 10 "location /api/" | head -15
echo ""

# Check which config file Nginx is using
echo "2. Nginx main config file:"
sudo nginx -T 2>/dev/null | grep -E "configuration file|# configuration file" | head -1
echo ""

# Check if there are multiple server blocks
echo "3. All server blocks with /api/ location:"
sudo nginx -T 2>/dev/null | grep -B 5 -A 10 "location /api/" | head -30
echo ""

# Test the actual proxy
echo "4. Testing proxy from server:"
curl -v http://localhost/api/v1/admin/stats 2>&1 | grep -E "< HTTP|Cannot GET|404|200|401" | head -5
echo ""

echo "=== Summary ==="
echo "If the proxy_pass in the output above shows 'http://localhost:3000/api/' (with trailing slash),"
echo "then the config is correct. If it shows 'http://localhost:3000' or 'http://localhost:3000/api'"
echo "(without trailing slash), then the fix didn't apply."

