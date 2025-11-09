#!/bin/bash

# Check if backend routes are properly registered
# Run this on your server

echo "=== Backend Route Diagnostic ==="
echo ""

# Check 1: Is backend running?
echo "1. Checking if backend is running..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
    curl -s http://localhost:3000/api/health | head -3
else
    echo "   ❌ Backend is NOT running on port 3000"
    echo "   Start it with: pm2 start backend/server.js or npm start"
    exit 1
fi
echo ""

# Check 2: Test root endpoint
echo "2. Testing root endpoint..."
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
echo "   Status: $ROOT_STATUS"
if [ "$ROOT_STATUS" = "200" ]; then
    echo "   ✅ Root endpoint works"
else
    echo "   ⚠️  Root endpoint returned: $ROOT_STATUS"
fi
echo ""

# Check 3: Test admin route directly
echo "3. Testing admin route directly on backend..."
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/admin/stats)
echo "   Status: $ADMIN_STATUS"
if [ "$ADMIN_STATUS" = "200" ] || [ "$ADMIN_STATUS" = "401" ]; then
    echo "   ✅ Admin route exists and responds"
    echo "   Response:"
    curl -s http://localhost:3000/api/v1/admin/stats | head -5
elif [ "$ADMIN_STATUS" = "404" ]; then
    echo "   ❌ Admin route returns 404"
    echo "   This means the route is not registered"
    echo ""
    echo "   Checking backend process..."
    if command -v pm2 > /dev/null; then
        echo "   PM2 processes:"
        pm2 list
        echo ""
        echo "   PM2 logs (last 20 lines):"
        pm2 logs --lines 20 --nostream | tail -20
    fi
    echo ""
    echo "   ⚠️  Backend might need to be restarted"
    echo "   Try: pm2 restart all"
else
    echo "   ⚠️  Admin route returned: $ADMIN_STATUS"
    echo "   Response:"
    curl -s http://localhost:3000/api/v1/admin/stats | head -5
fi
echo ""

# Check 4: Test through Nginx
echo "4. Testing through Nginx proxy..."
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/admin/stats)
echo "   Status: $NGINX_STATUS"
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "401" ]; then
    echo "   ✅ Nginx proxy is working correctly"
elif [ "$NGINX_STATUS" = "404" ]; then
    echo "   ❌ Nginx proxy returns 404"
    echo "   This could mean:"
    echo "   - Backend route doesn't exist (check step 3)"
    echo "   - Nginx proxy_pass is still wrong"
else
    echo "   ⚠️  Nginx proxy returned: $NGINX_STATUS"
fi
echo ""

# Summary
echo "=== Summary ==="
if [ "$ADMIN_STATUS" = "404" ]; then
    echo "❌ Backend route /api/v1/admin/stats is NOT registered"
    echo ""
    echo "Possible causes:"
    echo "1. Backend code on server is outdated"
    echo "2. Backend needs to be restarted"
    echo "3. adminRouter is not properly imported/mounted"
    echo ""
    echo "Solutions:"
    echo "1. Check backend code: cat backend/server.js | grep adminRouter"
    echo "2. Restart backend: pm2 restart all"
    echo "3. Check backend logs: pm2 logs"
elif [ "$ADMIN_STATUS" = "200" ] || [ "$ADMIN_STATUS" = "401" ]; then
    if [ "$NGINX_STATUS" = "404" ]; then
        echo "⚠️  Backend works but Nginx proxy has issues"
    else
        echo "✅ Everything is working!"
    fi
fi

