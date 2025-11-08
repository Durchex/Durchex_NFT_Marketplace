# URGENT: Fix Connection Timeout - Step by Step

## Current Issue
The browser is trying to connect to `:3000/api/v1/admin/stats` (malformed URL - missing hostname). This means the **frontend build is outdated** and needs to be rebuilt.

## Immediate Actions Required

### Step 1: Rebuild the Frontend (CRITICAL)
The code has been fixed, but you need to rebuild:

```bash
cd frontend
npm run build
```

### Step 2: Deploy the New Build
Copy the new `dist` folder to your server's public directory:

```bash
# On your server
cd /home/cloudpanel/htdocs/durchex.com/public
# Backup old build (optional)
mv dist dist.backup
# Copy new build
cp -r /path/to/new/dist/* .
```

### Step 3: Clear Browser Cache
- **Chrome/Edge**: Press `Ctrl+Shift+Delete` → Clear cached images and files
- **Or**: Hard refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Or**: Open in Incognito/Private mode

### Step 4: Check Browser Console
After rebuilding and clearing cache, open browser console and look for:

```
[API] Resolved Base URL: https://durchex.com/api/v1
[API] Full request example: https://durchex.com/api/v1/admin/stats
```

**If you still see `:3000/api/v1`**, the build hasn't been updated properly.

## Verify Nginx Configuration

### Check if API proxy is enabled:
```bash
# On your server
cat /home/cloudpanel/htdocs/durchex.com/conf/nginx.conf | grep -A 10 "location /api/"
```

Should show:
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    ...
}
```

### If missing, add it:
1. Go to CloudPanel → Sites → durchex.com → Nginx Config
2. Add this block:
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

3. Test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Verify Backend is Running

```bash
# Check if backend is running
pm2 list
# Or
ps aux | grep node

# Test backend directly
curl http://localhost:3000/api/health
# Should return: {"status":"OK",...}
```

## Test the Fix

### From Browser Console:
1. Open: `https://durchex.com/admin/dashboard`
2. Open DevTools Console (F12)
3. Look for these logs:
   - `[API] Resolved Base URL: https://durchex.com/api/v1`
   - `API Request: GET https://durchex.com/api/v1/admin/stats`

### From Server:
```bash
# Test if Nginx is proxying correctly
curl -I https://durchex.com/api/v1/admin/stats
# Should return HTTP 200 or 401 (not 404 or timeout)
```

## If Still Not Working

### Option 1: Set Environment Variable Explicitly
Create `frontend/.env.production`:
```
VITE_API_BASE_URL=https://durchex.com/api/v1
```

Then rebuild:
```bash
cd frontend
npm run build
```

### Option 2: Check Build Output
After building, check the generated files:
```bash
cd frontend/dist
grep -r "localhost:3000" . | head -5
# Should find nothing (or only in comments)
```

### Option 3: Force Cache Bust
Add version query to your build:
```bash
# In package.json, add to build script:
"build": "vite build && echo 'Build timestamp: $(date)' > dist/build.txt"
```

## Quick Checklist

- [ ] Frontend rebuilt with `npm run build`
- [ ] New build deployed to server
- [ ] Browser cache cleared
- [ ] Nginx API proxy configured
- [ ] Nginx reloaded
- [ ] Backend running on port 3000
- [ ] Browser console shows correct base URL
- [ ] Network tab shows requests to `https://durchex.com/api/v1/...`

## Expected Behavior After Fix

✅ Browser console shows: `[API] Resolved Base URL: https://durchex.com/api/v1`
✅ Network requests go to: `https://durchex.com/api/v1/admin/stats`
✅ No more `:3000` in URLs
✅ No more `ERR_CONNECTION_TIMED_OUT` errors
✅ Admin dashboard loads data successfully

## Still Having Issues?

Check these logs:
1. **Browser Console**: Look for `[API]` prefixed messages
2. **Nginx Error Log**: `tail -f /home/cloudpanel/htdocs/durchex.com/logs/error.log`
3. **Backend Logs**: `pm2 logs` or check your backend log file
4. **Network Tab**: Check the actual request URL being sent

The most common issue is **not rebuilding the frontend** after code changes. Make sure you rebuild and deploy!

