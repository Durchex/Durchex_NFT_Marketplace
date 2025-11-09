# Final Nginx Fix - The Root Cause

## The Problem

The error `Cannot GET //v1/admin/users` means:
- ✅ Frontend sends: `https://durchex.com/api/v1/admin/users`
- ❌ Nginx strips `/api` → sends `/v1/admin/users` to backend
- ❌ Backend expects: `/api/v1/admin/users`
- ❌ Result: 404 error

## The Solution

Nginx `proxy_pass` must preserve the `/api` prefix.

### Current (WRONG):
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
}
```
This strips `/api/` and sends `/v1/admin/users` to backend.

### Fixed (CORRECT):
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
}
```
This preserves `/api/` and sends `/api/v1/admin/users` to backend.

## Step-by-Step Fix

### Option 1: Run Diagnostic First (Recommended)

1. **Copy diagnostic script to server:**
   ```bash
   scp DIAGNOSE_NGINX_BACKEND.sh user@server:/tmp/
   ```

2. **Run diagnostic:**
   ```bash
   ssh user@server
   chmod +x /tmp/DIAGNOSE_NGINX_BACKEND.sh
   bash /tmp/DIAGNOSE_NGINX_BACKEND.sh
   ```

3. **Review the output** - it will show exactly what's wrong

### Option 2: Direct Fix

1. **SSH into server:**
   ```bash
   ssh user@server
   ```

2. **Edit Nginx config:**
   ```bash
   sudo nano /home/durchex/htdocs/durchex.com/nginx.conf
   ```

3. **Find this line:**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3000;
   ```

4. **Change to:**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3000/api/;
   ```
   **CRITICAL:** Add `/api/` at the end!

5. **Save:** `Ctrl+X`, `Y`, `Enter`

6. **Test and reload:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **Verify:**
   ```bash
   curl -I https://durchex.com/api/v1/admin/stats
   ```
   Should return `200` or `401` (not `404`)

### Option 3: Use the Fix Script

1. **Copy fix script to server:**
   ```bash
   scp FIX_NGINX_PROXY.sh user@server:/tmp/
   ```

2. **Run it:**
   ```bash
   ssh user@server
   chmod +x /tmp/FIX_NGINX_PROXY.sh
   sudo bash /tmp/FIX_NGINX_PROXY.sh
   ```

## Verification Checklist

After fixing, verify:

- [ ] `sudo nginx -t` shows "syntax is ok"
- [ ] `curl http://localhost:3000/api/v1/admin/stats` works (tests backend)
- [ ] `curl http://localhost/api/v1/admin/stats` works (tests Nginx proxy)
- [ ] Browser shows `200` or `401` (not `404`)
- [ ] No more `Cannot GET //v1/admin/users` errors

## Understanding Nginx proxy_pass Behavior

### When proxy_pass has NO trailing path:
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
}
```
- Request: `/api/v1/admin/users`
- Nginx strips `/api/` → sends `/v1/admin/users` to backend ❌

### When proxy_pass HAS trailing path:
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
}
```
- Request: `/api/v1/admin/users`
- Nginx replaces `/api/` with `/api/` → sends `/api/v1/admin/users` to backend ✅

## Backend Route Verification

The backend is correctly configured:
- Route: `app.use('/api/v1/admin', adminRouter);`
- Endpoint: `router.get('/users', getAllUsersAdmin);`
- Full path: `/api/v1/admin/users` ✅

So the backend expects `/api/v1/admin/users`, which is why Nginx must preserve `/api`.

## Still Not Working?

1. **Check Nginx is actually using the config:**
   ```bash
   sudo nginx -T | grep -A 5 "location /api/"
   ```

2. **Check backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   pm2 list  # or ps aux | grep node
   ```

3. **Check Nginx error logs:**
   ```bash
   tail -20 /home/durchex/htdocs/durchex.com/logs/error.log
   ```

4. **Restart Nginx completely:**
   ```bash
   sudo systemctl restart nginx
   ```

## Expected Result

After the fix:
- ✅ Browser request: `https://durchex.com/api/v1/admin/users`
- ✅ Nginx forwards: `http://localhost:3000/api/v1/admin/users`
- ✅ Backend receives: `/api/v1/admin/users`
- ✅ Backend responds: `200 OK` or `401 Unauthorized`

No more 404 errors! 🎉

