#!/bin/bash

# Fix backend routes - check if admin routes are registered
# Run: bash FIX_BACKEND_ROUTES.sh

echo "=== Backend Route Diagnostic ==="
echo ""

# Check 1: Is backend running?
echo "1. Checking if backend is running..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
    curl -s http://localhost:3000/api/health
else
    echo "   ❌ Backend is NOT running on port 3000"
    echo ""
    echo "   Checking processes..."
    if command -v pm2 > /dev/null; then
        echo "   PM2 processes:"
        pm2 list
        echo ""
        echo "   To start backend:"
        echo "   cd /path/to/backend && pm2 start server.js --name backend"
    else
        echo "   Check if node process is running:"
        ps aux | grep node | grep -v grep
    fi
    exit 1
fi
echo ""

# Check 2: Test admin route directly (bypassing Nginx)
echo "2. Testing admin route directly on backend..."
ADMIN_RESPONSE=$(curl -s http://localhost:3000/api/v1/admin/stats)
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/admin/stats)

echo "   Status: $ADMIN_STATUS"
if [ "$ADMIN_STATUS" = "200" ]; then
    echo "   ✅ Admin route works!"
    echo "   Response: $ADMIN_RESPONSE" | head -3
elif [ "$ADMIN_STATUS" = "401" ]; then
    echo "   ✅ Admin route exists (requires authentication)"
elif [ "$ADMIN_STATUS" = "404" ]; then
    echo "   ❌ Admin route returns 404 - route not registered"
    echo ""
    echo "   This means the backend code doesn't have the admin routes."
    echo "   Possible causes:"
    echo "   1. Backend code is outdated"
    echo "   2. Backend needs to be restarted"
    echo "   3. adminRouter is not imported/mounted in server.js"
    echo ""
    echo "   Checking backend code..."
    
    # Find backend directory
    BACKEND_DIR=""
    if [ -d "/home/durchex/htdocs/durchex.com/backend_temp" ]; then
        BACKEND_DIR="/home/durchex/htdocs/durchex.com/backend_temp"
    elif [ -d "/home/durchex/htdocs/durchex.com/backend" ]; then
        BACKEND_DIR="/home/durchex/htdocs/durchex.com/backend"
    elif [ -d "/home/durchex/backend_temp" ]; then
        BACKEND_DIR="/home/durchex/backend_temp"
    else
        echo "   ⚠️  Could not find backend directory"
        echo "   Please check: ls -la /home/durchex/"
    fi
    
    if [ -n "$BACKEND_DIR" ] && [ -d "$BACKEND_DIR" ]; then
        echo "   Backend directory: $BACKEND_DIR"
        
        # Check if adminRouter is in server.js
        if [ -f "$BACKEND_DIR/server.js" ]; then
            echo ""
            echo "   Checking server.js for adminRouter..."
            if grep -q "adminRouter" "$BACKEND_DIR/server.js"; then
                echo "   ✅ adminRouter found in server.js"
                grep "adminRouter" "$BACKEND_DIR/server.js"
            else
                echo "   ❌ adminRouter NOT found in server.js"
                echo "   The backend code needs to be updated!"
            fi
            
            # Check if adminRouter file exists
            if [ -f "$BACKEND_DIR/routes/adminRouter.js" ]; then
                echo "   ✅ adminRouter.js file exists"
            else
                echo "   ❌ adminRouter.js file NOT found"
            fi
        fi
    fi
    
    echo ""
    echo "   SOLUTION:"
    echo "   1. Make sure backend code has admin routes"
    echo "   2. Restart backend: pm2 restart all"
    echo "   3. Or: cd $BACKEND_DIR && npm start"
else
    echo "   ⚠️  Unexpected status: $ADMIN_STATUS"
    echo "   Response: $ADMIN_RESPONSE" | head -5
fi
echo ""

# Check 3: Test through Nginx
echo "3. Testing through Nginx proxy..."
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/admin/stats)
echo "   Status: $NGINX_STATUS"

if [ "$NGINX_STATUS" = "404" ] && [ "$ADMIN_STATUS" = "404" ]; then
    echo "   ⚠️  Both direct and proxied requests return 404"
    echo "   This confirms: Backend route is missing"
elif [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "401" ]; then
    echo "   ✅ Nginx proxy is working!"
else
    echo "   Status: $NGINX_STATUS"
fi
echo ""

# Summary
echo "=== Summary ==="
if [ "$ADMIN_STATUS" = "404" ]; then
    echo "❌ PROBLEM: Backend route /api/v1/admin/stats is NOT registered"
    echo ""
    echo "Next steps:"
    echo "1. Check backend code has admin routes (server.js should import adminRouter)"
    echo "2. Restart backend: pm2 restart all"
    echo "3. Test again: curl http://localhost:3000/api/v1/admin/stats"
    echo ""
    echo "If backend code is missing admin routes, you need to:"
    echo "- Copy the latest backend code to the server"
    echo "- Make sure server.js has: app.use('/api/v1/admin', adminRouter);"
    echo "- Restart the backend"
else
    echo "✅ Backend route exists!"
    if [ "$NGINX_STATUS" = "404" ]; then
        echo "⚠️  But Nginx proxy still has issues"
    else
        echo "✅ Everything is working!"
    fi
fi

