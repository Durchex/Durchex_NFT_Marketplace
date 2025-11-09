# Direct Nginx Fix - The Exact Problem

## The Error Explained

The error `Cannot GET //v1/admin/users` means:
- ✅ Frontend sends: `https://durchex.com/api/v1/admin/users`
- ❌ Nginx strips `/api` incorrectly
- ❌ Backend receives: `//v1/admin/users` (double slash = wrong!)
- ❌ Backend expects: `/api/v1/admin/users`

## Root Cause

Your Nginx config on the server has:
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api;  # ❌ Missing trailing slash!
}
```

It MUST be:
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;  # ✅ Trailing slash required!
}
```

## The Fix (3 Steps)

### Step 1: SSH into your server
```bash
ssh user@your-server
```

### Step 2: Check current config
```bash
grep -A 3 "location /api/" /home/durchex/htdocs/durchex.com/nginx.conf
```

**You'll probably see:**
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api;
```

### Step 3: Fix it
```bash
sudo nano /home/durchex/htdocs/durchex.com/nginx.conf
```

**Find this line:**
```nginx
proxy_pass http://localhost:3000/api;
```

**Change to (ADD trailing slash):**
```nginx
proxy_pass http://localhost:3000/api/;
```

**Save:** `Ctrl+X`, `Y`, `Enter`

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Verify It Worked

```bash
# Test from server
curl -I http://localhost/api/v1/admin/stats

# Should return 200 or 401 (NOT 404)
```

Then refresh your browser - the error should be gone!

## Why This Happens

Nginx `proxy_pass` behavior:
- **Without trailing slash:** `proxy_pass http://localhost:3000/api;`
  - Strips `/api/` from path
  - Sends `/v1/admin/users` to backend ❌
  
- **With trailing slash:** `proxy_pass http://localhost:3000/api/;`
  - Preserves `/api/` in path
  - Sends `/api/v1/admin/users` to backend ✅

## One-Line Fix (If you're confident)

```bash
sudo sed -i 's|proxy_pass http://localhost:3000/api;|proxy_pass http://localhost:3000/api/;|g' /home/durchex/htdocs/durchex.com/nginx.conf && sudo nginx -t && sudo systemctl reload nginx
```

This will:
1. Fix the config
2. Test it
3. Reload Nginx

## Still Not Working?

1. **Check if the change was saved:**
   ```bash
   grep "proxy_pass" /home/durchex/htdocs/durchex.com/nginx.conf | grep "/api/"
   ```
   Should show: `proxy_pass http://localhost:3000/api/;`

2. **Check backend is running:**
   ```bash
   curl http://localhost:3000/api/health
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
- ✅ Browser: `https://durchex.com/api/v1/admin/users`
- ✅ Nginx forwards: `http://localhost:3000/api/v1/admin/users`
- ✅ Backend receives: `/api/v1/admin/users`
- ✅ Backend responds: `200 OK` or `401 Unauthorized`
- ✅ No more `Cannot GET //v1/admin/users` error!

The fix is simple - just add that trailing slash `/` after `/api` in the proxy_pass line!

