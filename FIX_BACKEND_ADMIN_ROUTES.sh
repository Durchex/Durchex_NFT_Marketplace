#!/bin/bash

# Fix backend admin routes - ensure they're registered
# Run: bash FIX_BACKEND_ADMIN_ROUTES.sh

echo "=== Fixing Backend Admin Routes ==="
echo ""

BACKEND_DIR="/home/durchex/htdocs/durchex.com/backend_temp"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    echo "   Searching for backend..."
    find /home/durchex -type d -name "backend" 2>/dev/null | head -3
    exit 1
fi

echo "Backend directory: $BACKEND_DIR"
echo ""

# Check if server.js exists
SERVER_FILE="$BACKEND_DIR/server.js"
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ server.js not found: $SERVER_FILE"
    exit 1
fi

echo "✅ Found server.js"
echo ""

# Check if adminRouter is imported
echo "=== Checking server.js ==="
if grep -q "adminRouter" "$SERVER_FILE"; then
    echo "✅ adminRouter found in server.js"
    echo ""
    echo "Current adminRouter references:"
    grep -n "adminRouter" "$SERVER_FILE"
    echo ""
    
    # Check if it's properly mounted
    if grep -q "app.use('/api/v1/admin', adminRouter)" "$SERVER_FILE" || grep -q "app.use(\"/api/v1/admin\", adminRouter)" "$SERVER_FILE"; then
        echo "✅ adminRouter is properly mounted"
    else
        echo "❌ adminRouter is imported but NOT mounted!"
        echo ""
        echo "Checking current routes..."
        grep -n "app.use" "$SERVER_FILE" | tail -5
        echo ""
        echo "Need to add: app.use('/api/v1/admin', adminRouter);"
    fi
else
    echo "❌ adminRouter NOT found in server.js"
    echo ""
    echo "Need to add adminRouter import and mount"
fi
echo ""

# Check if route files exist
echo "=== Checking Route Files ==="
if [ -f "$BACKEND_DIR/routes/adminRouter.js" ]; then
    echo "✅ adminRouter.js exists"
else
    echo "❌ adminRouter.js NOT FOUND"
    echo "   Expected: $BACKEND_DIR/routes/adminRouter.js"
fi

if [ -f "$BACKEND_DIR/controllers/adminController.js" ]; then
    echo "✅ adminController.js exists"
else
    echo "❌ adminController.js NOT FOUND"
    echo "   Expected: $BACKEND_DIR/controllers/adminController.js"
fi
echo ""

# Check backend process
echo "=== Checking Backend Process ==="
if command -v pm2 > /dev/null; then
    echo "PM2 processes:"
    pm2 list
    echo ""
    
    # Find backend process
    BACKEND_PROCESS=$(pm2 list | grep -i "backend\|server\|node" | head -1 | awk '{print $2}')
    if [ -n "$BACKEND_PROCESS" ]; then
        echo "Found backend process: $BACKEND_PROCESS"
        echo ""
        echo "Backend logs (last 10 lines):"
        pm2 logs "$BACKEND_PROCESS" --lines 10 --nostream 2>/dev/null | tail -10
    else
        echo "⚠️  Could not identify backend process"
    fi
else
    echo "PM2 not found, checking node processes:"
    ps aux | grep node | grep -v grep
fi
echo ""

# Summary and fix
echo "=== Summary ==="

NEEDS_FIX=false

if ! grep -q "adminRouter" "$SERVER_FILE"; then
    echo "❌ adminRouter not in server.js"
    NEEDS_FIX=true
elif ! grep -q "app.use.*admin" "$SERVER_FILE"; then
    echo "❌ adminRouter not mounted"
    NEEDS_FIX=true
fi

if [ ! -f "$BACKEND_DIR/routes/adminRouter.js" ]; then
    echo "❌ adminRouter.js file missing"
    NEEDS_FIX=true
fi

if [ ! -f "$BACKEND_DIR/controllers/adminController.js" ]; then
    echo "❌ adminController.js file missing"
    NEEDS_FIX=true
fi

if [ "$NEEDS_FIX" = true ]; then
    echo ""
    echo "=== ACTION REQUIRED ==="
    echo ""
    echo "The backend code is missing admin routes. You need to:"
    echo ""
    echo "1. Copy the latest backend code to the server"
    echo "   Make sure these files exist:"
    echo "   - $BACKEND_DIR/server.js (with adminRouter)"
    echo "   - $BACKEND_DIR/routes/adminRouter.js"
    echo "   - $BACKEND_DIR/controllers/adminController.js"
    echo ""
    echo "2. Verify server.js has:"
    echo "   import adminRouter from './routes/adminRouter.js';"
    echo "   app.use('/api/v1/admin', adminRouter);"
    echo ""
    echo "3. Restart backend:"
    echo "   pm2 restart all"
    echo "   # or"
    echo "   cd $BACKEND_DIR && npm start"
    echo ""
    echo "4. Test:"
    echo "   curl http://localhost:3000/api/v1/admin/stats"
else
    echo ""
    echo "✅ Backend code looks correct!"
    echo ""
    echo "The issue might be that the backend needs a restart."
    echo ""
    echo "Restarting backend..."
    
    if command -v pm2 > /dev/null; then
        pm2 restart all
        echo "✅ Backend restarted"
        echo ""
        echo "Waiting 3 seconds for backend to start..."
        sleep 3
        echo ""
        echo "Testing admin route..."
        TEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/admin/stats)
        echo "Status: $TEST_STATUS"
        
        if [ "$TEST_STATUS" = "200" ] || [ "$TEST_STATUS" = "401" ]; then
            echo "✅ Admin route is now working!"
        elif [ "$TEST_STATUS" = "404" ]; then
            echo "❌ Still 404 - backend code might be outdated"
            echo "   Check: grep 'adminRouter' $SERVER_FILE"
        else
            echo "⚠️  Status: $TEST_STATUS"
        fi
    else
        echo "⚠️  PM2 not found. Please restart backend manually:"
        echo "   cd $BACKEND_DIR && npm start"
    fi
fi

echo ""
echo "=== Done ==="

