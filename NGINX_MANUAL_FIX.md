# Manual Nginx Configuration Fix

The error `Cannot GET //v1/admin/users` means Nginx is stripping `/api` incorrectly. Here's how to fix it manually.

## Quick Fix (Recommended)

### Option 1: Use the Script
1. Copy `FIX_NGINX_PROXY.sh` to your server
2. Run: `bash FIX_NGINX_PROXY.sh`
3. It will automatically find and fix the config

### Option 2: Manual Edit

1. **SSH into your server:**
   ```bash
   ssh your-user@your-server
   ```

2. **Find the config file:**
   ```bash
   find /home/cloudpanel -name "nginx.conf" -path "*durchex*"
   ```
   Usually it's: `/home/cloudpanel/htdocs/durchex.com/conf/nginx.conf`

3. **Edit the file:**
   ```bash
   sudo nano /home/cloudpanel/htdocs/durchex.com/conf/nginx.conf
   ```

4. **Find the `location /api/` block** (or add it if missing)

   **If it EXISTS, change this:**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3000;
       ...
   }
   ```
   
   **To this:**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3000/api/;
       ...
   }
   ```
   
   **The key change:** Add `/api/` at the end of `proxy_pass` URL

5. **If it DOESN'T EXIST, add this block** (usually after `location / {`):
   ```nginx
   # API Proxy - Proxies /api/ requests to backend on port 3000
   location /api/ {
       proxy_pass http://localhost:3000/api/;
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

6. **Save and exit:**
   - `Ctrl+X`, then `Y`, then `Enter`

7. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```
   Should show: `syntax is ok` and `test is successful`

8. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

9. **Test the API:**
   ```bash
   curl -I https://durchex.com/api/v1/admin/stats
   ```
   Should return `200` or `401` (not `404`)

## Why This Fix Works

**Before (Wrong):**
- Request: `https://durchex.com/api/v1/admin/users`
- Nginx strips `/api/` → sends `/v1/admin/users` to backend
- Backend expects `/api/v1/admin/users` → 404 ❌

**After (Correct):**
- Request: `https://durchex.com/api/v1/admin/users`
- Nginx matches `/api/`, replaces with `/api/` → sends `/api/v1/admin/users` to backend
- Backend receives `/api/v1/admin/users` → 200 ✅

## Troubleshooting

### Still getting 404?
1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check Nginx error logs:**
   ```bash
   tail -f /home/cloudpanel/htdocs/durchex.com/logs/error.log
   ```

3. **Verify the proxy_pass line:**
   ```bash
   grep -A 5 "location /api/" /home/cloudpanel/htdocs/durchex.com/conf/nginx.conf
   ```
   Should show: `proxy_pass http://localhost:3000/api/;`

### Getting 502 Bad Gateway?
- Backend might not be running
- Check: `pm2 list` or `ps aux | grep node`

### Getting Connection Refused?
- Backend might be on a different port
- Check backend logs or process list

## Alternative: Change Frontend Base URL

If you can't modify Nginx, you could change the frontend to use `/v1` instead of `/api/v1`:

1. Update `frontend/src/services/api.js`:
   ```javascript
   // Change from: `${origin}/api/v1`
   // To: `${origin}/v1`
   ```

2. Update Nginx to proxy `/v1/` to `/api/v1/`:
   ```nginx
   location /v1/ {
       proxy_pass http://localhost:3000/api/v1/;
       ...
   }
   ```

But the first solution (fixing proxy_pass) is cleaner and recommended.

