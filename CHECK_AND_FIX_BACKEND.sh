#!/bin/bash

# Check and fix backend admin routes on the server
# Run: bash CHECK_AND_FIX_BACKEND.sh

echo "=== Checking Backend Admin Routes ==="
echo ""

BACKEND_DIR="/home/durchex/htdocs/durchex.com/backend_temp"
SERVER_FILE="$BACKEND_DIR/server.js"

# Check if files exist
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ server.js not found: $SERVER_FILE"
    exit 1
fi

echo "Checking: $SERVER_FILE"
echo ""

# Check if adminRouter is imported
echo "1. Checking adminRouter import..."
if grep -q "import.*adminRouter" "$SERVER_FILE"; then
    echo "   ✅ adminRouter is imported"
    grep "import.*adminRouter" "$SERVER_FILE"
else
    echo "   ❌ adminRouter is NOT imported"
    echo "   Need to add: import adminRouter from './routes/adminRouter.js';"
fi
echo ""

# Check if adminRouter is mounted
echo "2. Checking adminRouter mount..."
if grep -q "app.use.*'/api/v1/admin'" "$SERVER_FILE" || grep -q 'app.use.*"/api/v1/admin"' "$SERVER_FILE"; then
    echo "   ✅ adminRouter is mounted"
    grep "app.use.*admin" "$SERVER_FILE"
else
    echo "   ❌ adminRouter is NOT mounted"
    echo "   Need to add: app.use('/api/v1/admin', adminRouter);"
fi
echo ""

# Check route files
echo "3. Checking route files..."
if [ -f "$BACKEND_DIR/routes/adminRouter.js" ]; then
    echo "   ✅ adminRouter.js exists"
    ROUTE_COUNT=$(grep -c "router.get\|router.post" "$BACKEND_DIR/routes/adminRouter.js" 2>/dev/null || echo "0")
    echo "   Found $ROUTE_COUNT routes in adminRouter.js"
else
    echo "   ❌ adminRouter.js NOT FOUND"
fi

if [ -f "$BACKEND_DIR/controllers/adminController.js" ]; then
    echo "   ✅ adminController.js exists"
    CONTROLLER_COUNT=$(grep -c "export.*=" "$BACKEND_DIR/controllers/adminController.js" 2>/dev/null || echo "0")
    echo "   Found $CONTROLLER_COUNT controller functions"
else
    echo "   ❌ adminController.js NOT FOUND"
fi
echo ""

# Test backend
echo "4. Testing backend route..."
TEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/admin/stats 2>/dev/null)
echo "   Status: $TEST_STATUS"

if [ "$TEST_STATUS" = "200" ] || [ "$TEST_STATUS" = "401" ]; then
    echo "   ✅ Route is working!"
elif [ "$TEST_STATUS" = "404" ]; then
    echo "   ❌ Route returns 404"
    echo ""
    echo "   === SOLUTION ==="
    echo ""
    
    # Check what's missing
    if ! grep -q "adminRouter" "$SERVER_FILE"; then
        echo "   ❌ adminRouter not in server.js"
        echo ""
        echo "   Add this to server.js (after line 23):"
        echo "   import adminRouter from './routes/adminRouter.js';"
        echo ""
        echo "   Add this after other app.use lines (around line 87):"
        echo "   app.use('/api/v1/admin', adminRouter);"
    elif [ ! -f "$BACKEND_DIR/routes/adminRouter.js" ]; then
        echo "   ❌ adminRouter.js file is missing"
        echo "   You need to copy this file to: $BACKEND_DIR/routes/adminRouter.js"
    elif [ ! -f "$BACKEND_DIR/controllers/adminController.js" ]; then
        echo "   ❌ adminController.js file is missing"
        echo "   You need to copy this file to: $BACKEND_DIR/controllers/adminController.js"
    else
        echo "   ⚠️  Files exist but route still 404"
        echo "   Backend might need restart"
    fi
    
    echo ""
    echo "   After fixing, restart backend:"
    echo "   pm2 restart all"
    echo "   # or"
    echo "   cd $BACKEND_DIR && npm start"
else
    echo "   ⚠️  Unexpected status: $TEST_STATUS"
fi
echo ""

# Check backend process
echo "5. Backend process status..."
if command -v pm2 > /dev/null; then
    pm2 list | grep -E "backend|server|node" | head -3
    echo ""
    echo "   To restart: pm2 restart all"
else
    ps aux | grep -E "node.*server|npm.*start" | grep -v grep | head -2
fi

echo ""
echo "=== Next Steps ==="
echo "1. If files are missing, copy latest backend code to server"
echo "2. Restart backend: pm2 restart all"
echo "3. Test: curl http://localhost:3000/api/v1/admin/stats"

