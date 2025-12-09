# Fix nginx Proxy to Backend on Port 8080

## Problem
Backend is running on **port 8080** but nginx is configured to proxy to **port 3000**, causing API requests to fail with connection refused.

## Solution

### Step 1: Upload Updated nginx Config
Copy the updated `durchex.conf` to your server:

```bash
scp durchex.conf root@213.130.144.229:/etc/nginx/sites-available/
```

### Step 2: Test nginx Configuration
```bash
ssh root@213.130.144.229
sudo nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration will be executed successfully
```

### Step 3: Reload nginx
```bash
sudo systemctl reload nginx
```

### Step 4: Verify Backend Proxy is Working
```bash
curl -v http://durchex.com/api/health
```

Should return:
- **HTTP 200** with backend health status ✅
- **HTTP 502 / 503** = backend not running or Mongo issue ⚠️

### Step 5: Check Backend Status
If Step 4 fails, check backend logs:

```bash
pm2 logs durchex-backend --lines 50
```

Look for:
- ✅ `Server is running on port: 8080` = backend is listening
- ❌ `ECONNREFUSED 127.0.0.1:27017` = Mongo not running
- ❌ `Error: connect ECONNREFUSED` = database connection issue

## Alternative: Quick sed command (one-liner)

If you prefer to update the file directly on the server:

```bash
ssh root@213.130.144.229 'sudo sed -i "s@proxy_pass http://127.0.0.1:3000/api/@proxy_pass http://127.0.0.1:8080/api/@g" /etc/nginx/sites-available/durchex.conf && sudo nginx -t && sudo systemctl reload nginx && echo "✅ nginx reloaded successfully"'
```

## What Changed
```diff
- proxy_pass http://127.0.0.1:3000/api/;
+ proxy_pass http://127.0.0.1:8080/api/;
```

## Next Steps After Verification
1. If `/api/health` returns 200, dummy NFTs will now load from real backend 🎉
2. If you get Mongo errors, proceed to **Backend Mongo Connection Fix** section below

---

## Backend Mongo Connection Fix

If backend is returning 500 errors with `ECONNREFUSED 127.0.0.1:27017`, see `BACKEND_MONGO_FIX.md`

