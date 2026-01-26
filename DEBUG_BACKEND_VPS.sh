#!/bin/bash

# Comprehensive Backend Debugging Script for VPS
# Run this on your VPS: ssh root@213.130.144.229
# Then run: bash DEBUG_BACKEND_VPS.sh

echo "=========================================="
echo "  Durchex Backend Debugging Tool"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check 1: Backend Process Status
echo "1. Checking Backend Process Status..."
echo "-----------------------------------"

# Check if PM2 is installed and running
if command -v pm2 &> /dev/null; then
    echo "PM2 is installed. Checking processes..."
    pm2 list
    PM2_STATUS=$(pm2 list | grep -i "durchex\|backend" | head -1)
    if [ -n "$PM2_STATUS" ]; then
        print_status 0 "Backend process found in PM2"
        echo "   Details:"
        pm2 list | grep -i "durchex\|backend"
        echo ""
        echo "   Recent logs (last 20 lines):"
        pm2 logs --lines 20 --nostream | tail -20
    else
        print_status 1 "No backend process found in PM2"
    fi
else
    echo "PM2 not found. Checking for Node processes..."
fi

# Check for Node processes on port 3000
echo ""
echo "Checking for Node.js processes on port 3000..."
NODE_PROCESS=$(lsof -i :3000 2>/dev/null | grep -i node || netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000)
if [ -n "$NODE_PROCESS" ]; then
    print_status 0 "Port 3000 is in use"
    echo "   Process details:"
    echo "$NODE_PROCESS"
else
    print_status 1 "Port 3000 is NOT in use - Backend is likely not running"
fi

# Check all Node processes
echo ""
echo "All Node.js processes:"
ps aux | grep -i node | grep -v grep || echo "   No Node.js processes found"

echo ""
echo ""

# Check 2: Backend Health
echo "2. Testing Backend Health Endpoint..."
echo "-----------------------------------"

# Test direct backend connection
if curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status 0 "Backend health endpoint is responding"
    echo "   Response:"
    curl -s http://localhost:3000/api/health | head -3
else
    print_status 1 "Backend health endpoint is NOT responding"
    echo "   Attempting connection..."
    curl -v http://localhost:3000/api/health 2>&1 | head -10
fi

echo ""

# Test the specific endpoint that's failing
echo "Testing failing endpoint: /api/v1/nft/nfts/arbitrum"
if curl -s -f http://localhost:3000/api/v1/nft/nfts/arbitrum > /dev/null 2>&1; then
    print_status 0 "NFT endpoint is responding"
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/nft/nfts/arbitrum)
    echo "   Status code: $STATUS_CODE"
else
    print_status 1 "NFT endpoint is NOT responding"
    echo "   Full response:"
    curl -v http://localhost:3000/api/v1/nft/nfts/arbitrum 2>&1 | head -20
fi

echo ""
echo ""

# Check 3: Nginx Status
echo "3. Checking Nginx Status..."
echo "-----------------------------------"

if systemctl is-active --quiet nginx; then
    print_status 0 "Nginx is running"
    systemctl status nginx --no-pager -l | head -10
else
    print_status 1 "Nginx is NOT running"
    echo "   Attempting to start Nginx..."
    systemctl start nginx 2>&1
fi

echo ""

# Check Nginx configuration
echo "Finding Nginx configuration files..."
NGINX_CONFIGS=(
    "/etc/nginx/sites-available/durchex.com"
    "/etc/nginx/sites-enabled/durchex.com"
    "/home/durchex/htdocs/durchex.com/nginx.conf"
    "/etc/nginx/nginx.conf"
)

FOUND_CONFIG=""
for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo "   Found: $config"
        FOUND_CONFIG="$config"
        
        # Check for API proxy configuration
        if grep -q "location /api/" "$config"; then
            print_status 0 "API proxy location block found"
            echo "   Configuration:"
            grep -A 5 "location /api/" "$config" | head -6
            
            # Check proxy_pass
            PROXY_PASS=$(grep -A 1 "location /api/" "$config" | grep "proxy_pass" | head -1)
            if echo "$PROXY_PASS" | grep -q "proxy_pass http://localhost:3000/api/"; then
                print_status 0 "proxy_pass is correctly configured"
            else
                print_status 1 "proxy_pass might be misconfigured"
                echo "   Current: $PROXY_PASS"
                echo "   Should be: proxy_pass http://localhost:3000/api/;"
            fi
        else
            print_status 1 "API proxy location block NOT found"
        fi
        break
    fi
done

if [ -z "$FOUND_CONFIG" ]; then
    print_status 1 "No Nginx configuration file found in expected locations"
    echo "   Searching for nginx.conf files..."
    find /etc/nginx -name "*.conf" -type f 2>/dev/null | head -5
fi

echo ""

# Test Nginx proxy
echo "Testing Nginx proxy from server..."
NGINX_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/nft/nfts/arbitrum 2>&1)
if [ "$NGINX_TEST" = "200" ] || [ "$NGINX_TEST" = "502" ]; then
    echo "   Nginx proxy test returned: $NGINX_TEST"
    if [ "$NGINX_TEST" = "502" ]; then
        print_status 1 "Nginx returns 502 - Backend connection issue"
    else
        print_status 0 "Nginx proxy is working"
    fi
else
    echo "   Nginx proxy test returned: $NGINX_TEST"
fi

echo ""
echo ""

# Check 4: Backend Logs
echo "4. Checking Backend Logs..."
echo "-----------------------------------"

# PM2 logs
if command -v pm2 &> /dev/null; then
    echo "PM2 logs (last 30 lines):"
    pm2 logs --lines 30 --nostream 2>&1 | tail -30 || echo "   Could not retrieve PM2 logs"
fi

# Check for log files
LOG_PATHS=(
    "/home/durchex/htdocs/durchex.com/logs"
    "/var/log/durchex"
    "/root/durchex/logs"
    "./logs"
)

for log_path in "${LOG_PATHS[@]}"; do
    if [ -d "$log_path" ]; then
        echo ""
        echo "Found log directory: $log_path"
        find "$log_path" -name "*.log" -type f -mtime -1 2>/dev/null | while read logfile; do
            echo "   Recent errors in $(basename $logfile):"
            grep -i "error\|fatal\|502\|crash" "$logfile" 2>/dev/null | tail -5 || echo "      No errors found"
        done
    fi
done

echo ""
echo ""

# Check 5: Nginx Error Logs
echo "5. Checking Nginx Error Logs..."
echo "-----------------------------------"

NGINX_ERROR_LOGS=(
    "/var/log/nginx/error.log"
    "/home/durchex/htdocs/durchex.com/logs/error.log"
    "/etc/nginx/logs/error.log"
)

for error_log in "${NGINX_ERROR_LOGS[@]}"; do
    if [ -f "$error_log" ]; then
        echo "Found error log: $error_log"
        echo "   Recent errors (last 10 lines):"
        tail -10 "$error_log" | grep -i "502\|bad gateway\|upstream\|connect" || echo "      No 502 errors found"
        break
    fi
done

echo ""
echo ""

# Check 6: Database Connection
echo "6. Checking Database Connection..."
echo "-----------------------------------"

# Check if MongoDB is running
if systemctl is-active --quiet mongod 2>/dev/null || pgrep -x mongod > /dev/null; then
    print_status 0 "MongoDB process is running"
else
    print_status 1 "MongoDB process is NOT running"
fi

# Check MongoDB connection from backend
if [ -f "/home/durchex/htdocs/durchex.com/backend_temp/.env" ] || [ -f "/root/durchex/backend_temp/.env" ]; then
    echo "   Found .env file - checking MongoDB URI..."
    # Don't print sensitive info, just check if it exists
    print_status 0 ".env file exists"
fi

echo ""
echo ""

# Check 7: System Resources
echo "7. Checking System Resources..."
echo "-----------------------------------"

echo "Memory usage:"
free -h | head -2

echo ""
echo "Disk usage:"
df -h / | tail -1

echo ""
echo "CPU load:"
uptime

echo ""
echo ""

# Check 8: Network Connectivity
echo "8. Checking Network Connectivity..."
echo "-----------------------------------"

# Check if port 3000 is accessible
if timeout 2 bash -c "echo > /dev/tcp/localhost/3000" 2>/dev/null; then
    print_status 0 "Port 3000 is accessible"
else
    print_status 1 "Port 3000 is NOT accessible"
fi

echo ""
echo ""

# Summary and Recommendations
echo "=========================================="
echo "  SUMMARY & RECOMMENDATIONS"
echo "=========================================="
echo ""

# Determine the issue
if ! lsof -i :3000 2>/dev/null | grep -q node && ! netstat -tlnp 2>/dev/null | grep -q :3000 && ! ss -tlnp 2>/dev/null | grep -q :3000; then
    echo -e "${RED}❌ ISSUE FOUND: Backend is not running on port 3000${NC}"
    echo ""
    echo "SOLUTION:"
    echo "1. Navigate to backend directory:"
    echo "   cd /home/durchex/htdocs/durchex.com/backend_temp"
    echo "   # OR"
    echo "   cd /root/durchex/backend_temp"
    echo ""
    echo "2. Start the backend with PM2:"
    echo "   pm2 start ecosystem.config.cjs"
    echo "   # OR if using npm:"
    echo "   npm start"
    echo ""
    echo "3. Check if it started:"
    echo "   pm2 list"
    echo "   curl http://localhost:3000/api/health"
    echo ""
elif ! curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ISSUE FOUND: Backend is running but not responding${NC}"
    echo ""
    echo "SOLUTION:"
    echo "1. Check backend logs:"
    echo "   pm2 logs --lines 50"
    echo ""
    echo "2. Restart the backend:"
    echo "   pm2 restart durchex-backend"
    echo "   # OR"
    echo "   pm2 restart all"
    echo ""
    echo "3. Check for errors in logs"
    echo ""
else
    echo -e "${GREEN}✅ Backend appears to be running${NC}"
    echo ""
    echo "If you're still getting 502 errors:"
    echo "1. Reload Nginx:"
    echo "   sudo systemctl reload nginx"
    echo ""
    echo "2. Check Nginx error logs:"
    echo "   sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "3. Verify Nginx config:"
    echo "   sudo nginx -t"
    echo ""
fi

echo ""
echo "=========================================="
echo "  Quick Fix Commands"
echo "=========================================="
echo ""
echo "# Start/Restart Backend:"
echo "cd /home/durchex/htdocs/durchex.com/backend_temp && pm2 start ecosystem.config.cjs"
echo ""
echo "# Restart Backend (if already running):"
echo "pm2 restart durchex-backend"
echo ""
echo "# Reload Nginx:"
echo "sudo systemctl reload nginx"
echo ""
echo "# Check Backend Status:"
echo "pm2 list && curl http://localhost:3000/api/health"
echo ""
echo "# View Backend Logs:"
echo "pm2 logs durchex-backend --lines 50"
echo ""
