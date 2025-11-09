# Fixing Backend 404 Error

## The Problem

The curl output shows:
- ✅ Nginx proxy is working (request reaches Express)
- ❌ Backend returns 404 (route not found)

This means the backend route `/api/v1/admin/stats` is not registered or the backend needs to be restarted.

## Quick Diagnostic

Run this on your server:
```bash
bash CHECK_BACKEND_ROUTES.sh
```

This will check:
1. If backend is running
2. If the admin route exists
3. If Nginx proxy is working

## Common Causes & Fixes

### 1. Backend Not Restarted After Code Changes

**Fix:**
```bash
# If using PM2
pm2 restart all

# Or if using npm
cd /path/to/backend
npm start
```

### 2. Backend Code is Outdated

**Check:**
```bash
# On your server, check if adminRouter is imported
grep -n "adminRouter" /path/to/backend/server.js

# Should show:
# import adminRouter from "./routes/adminRouter.js";
# app.use('/api/v1/admin', adminRouter);
```

**Fix:** Pull latest code and restart:
```bash
cd /path/to/backend
git pull  # or copy latest code
pm2 restart all
```

### 3. Route Not Properly Mounted

**Check backend/server.js:**
```bash
cat /path/to/backend/server.js | grep -A 5 "adminRouter"
```

**Should show:**
```javascript
import adminRouter from "./routes/adminRouter.js";
// ...
app.use('/api/v1/admin', adminRouter);
```

### 4. Controller Function Missing

**Check:**
```bash
# Check if controller exists
ls -la /path/to/backend/controllers/adminController.js

# Check if getDashboardStats function exists
grep "getDashboardStats" /path/to/backend/controllers/adminController.js
```

## Step-by-Step Fix

### Step 1: Verify Backend Code
```bash
# Check if admin routes are in server.js
grep "adminRouter" /path/to/backend/server.js

# Check if adminRouter.js exists
ls -la /path/to/backend/routes/adminRouter.js

# Check if adminController.js exists
ls -la /path/to/backend/controllers/adminController.js
```

### Step 2: Test Backend Directly
```bash
# Test if backend responds
curl http://localhost:3000/api/health

# Test admin route directly (bypassing Nginx)
curl http://localhost:3000/api/v1/admin/stats
```

### Step 3: Check Backend Logs
```bash
# If using PM2
pm2 logs

# Or check process output
ps aux | grep node
```

### Step 4: Restart Backend
```bash
# PM2
pm2 restart all
pm2 logs

# Or manual restart
cd /path/to/backend
npm start
```

### Step 5: Verify Fix
```bash
# Test again
curl -I http://localhost:3000/api/v1/admin/stats
# Should return 200 or 401 (not 404)
```

## Expected Result

After fixing:
- ✅ `curl http://localhost:3000/api/v1/admin/stats` returns 200 or 401
- ✅ `curl -I https://durchex.com/api/v1/admin/stats` returns 200 or 401
- ✅ Browser shows data loading in admin dashboard

## If Still Not Working

1. **Check backend process:**
   ```bash
   pm2 list
   # or
   ps aux | grep node
   ```

2. **Check backend directory:**
   ```bash
   ls -la /path/to/backend/
   ```

3. **Check if MongoDB is connected:**
   ```bash
   # Check backend logs for MongoDB connection errors
   pm2 logs | grep -i mongo
   ```

4. **Verify file paths:**
   ```bash
   # Make sure all files exist
   ls -la /path/to/backend/routes/adminRouter.js
   ls -la /path/to/backend/controllers/adminController.js
   ```

The most common issue is that the backend needs to be restarted after code changes!

