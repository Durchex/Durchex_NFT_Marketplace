# Backend 404 Error - Solution

## The Good News

✅ **Nginx is now working correctly!** 

The response shows `x-powered-by: Express`, which means:
- Nginx proxy is forwarding requests correctly
- Requests are reaching the Express backend
- The `/api/` location block is working

## The Problem

❌ **Backend returns 404** - The route `/api/v1/admin/stats` doesn't exist on the backend.

## Diagnosis

Run this to check the backend:

```bash
bash FIX_BACKEND_ROUTES.sh
```

This will:
1. Check if backend is running
2. Test the admin route directly (bypassing Nginx)
3. Check if admin routes are in the backend code
4. Tell you what needs to be fixed

## Most Likely Causes

### 1. Backend Code is Outdated

The backend on your server might not have the admin routes yet.

**Check:**
```bash
# Find backend directory
ls -la /home/durchex/ | grep backend

# Check if adminRouter is in server.js
grep "adminRouter" /path/to/backend/server.js
```

**Fix:**
- Copy the latest backend code to the server
- Make sure `server.js` has:
  ```javascript
  import adminRouter from "./routes/adminRouter.js";
  // ...
  app.use('/api/v1/admin', adminRouter);
  ```

### 2. Backend Needs Restart

The backend might be running old code.

**Fix:**
```bash
# If using PM2
pm2 restart all
pm2 logs

# Or restart manually
cd /path/to/backend
npm start
```

### 3. Backend Route Files Missing

The admin route files might not be on the server.

**Check:**
```bash
ls -la /path/to/backend/routes/adminRouter.js
ls -la /path/to/backend/controllers/adminController.js
```

**Fix:**
- Copy these files to the server if missing

## Quick Test

Test the backend directly (bypassing Nginx):

```bash
# This should return 200 or 401 (not 404)
curl http://localhost:3000/api/v1/admin/stats
```

If this returns 404, the problem is definitely the backend, not Nginx.

## Solution Steps

1. **Run diagnostic:**
   ```bash
   bash FIX_BACKEND_ROUTES.sh
   ```

2. **If backend code is outdated:**
   - Copy latest code to server
   - Make sure all admin route files are present

3. **Restart backend:**
   ```bash
   pm2 restart all
   ```

4. **Verify:**
   ```bash
   curl http://localhost:3000/api/v1/admin/stats
   # Should return 200 or 401
   ```

5. **Test through Nginx:**
   ```bash
   curl -I https://durchex.com/api/v1/admin/stats
   # Should return 200 or 401
   ```

## Expected Result

After fixing the backend:
- ✅ `curl http://localhost:3000/api/v1/admin/stats` returns 200 or 401
- ✅ `curl https://durchex.com/api/v1/admin/stats` returns 200 or 401
- ✅ Browser admin dashboard loads data

**Nginx is fixed! Now we just need to fix the backend routes.**

