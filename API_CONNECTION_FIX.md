# API Connection Fix Guide

## Problem
The frontend was trying to connect to `https://durchex.com:3000/api/v1/admin/stats` but getting `ERR_CONNECTION_TIMED_OUT` because port 3000 is not publicly accessible.

## Solution
Use a reverse proxy (Nginx) to route `/api/` requests to the backend on `localhost:3000`.

## Changes Made

### 1. Frontend API Base URL (`frontend/src/services/api.js`)
- Updated to use the same origin (e.g., `https://durchex.com/api/v1`) instead of trying port 3000 directly
- This assumes Nginx is proxying `/api/` to the backend

### 2. Nginx Configuration (`nginx-spa.conf`)
- Uncommented and configured the API proxy to forward `/api/` to `http://localhost:3000`
- Added WebSocket support for Socket.io
- Increased timeouts for long-running requests

## Deployment Steps

### Step 1: Update Nginx Configuration
1. **Via CloudPanel:**
   - Go to **Sites** → Your Site → **Nginx Config**
   - Add the API proxy block from `nginx-spa.conf`:
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
   
   location /socket.io/ {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       
       proxy_connect_timeout 7d;
       proxy_send_timeout 7d;
       proxy_read_timeout 7d;
   }
   ```

2. **Or manually edit:**
   ```bash
   nano /home/cloudpanel/htdocs/durchex.com/conf/nginx.conf
   # Add the location blocks above
   ```

### Step 2: Test Nginx Configuration
```bash
sudo nginx -t
```

### Step 3: Reload Nginx
```bash
sudo systemctl reload nginx
# Or via CloudPanel: Sites → Your Site → Reload Nginx
```

### Step 4: Verify Backend is Running
```bash
# Check if backend is running on port 3000
curl http://localhost:3000/api/health

# Should return: {"status":"OK",...}
```

### Step 5: Rebuild Frontend
```bash
cd frontend
npm run build
# Deploy the new build
```

## Testing

### Test API Proxy
```bash
# From your server
curl https://durchex.com/api/v1/admin/stats

# Should return dashboard stats (may require auth)
```

### Test from Browser
1. Open browser console
2. Check for `[API] Base URL: https://durchex.com/api/v1`
3. Try accessing admin dashboard
4. Check Network tab - requests should go to `https://durchex.com/api/v1/...` (not `:3000`)

## Alternative: Direct Port Access (Not Recommended)

If you want to keep using port 3000 directly (not recommended for production):

1. **Open firewall port 3000:**
   ```bash
   sudo ufw allow 3000/tcp
   ```

2. **Set environment variable:**
   In `frontend/.env.production`:
   ```
   VITE_API_BASE_URL=https://durchex.com:3000/api/v1
   ```

3. **Rebuild frontend**

## Troubleshooting

### Still getting connection timeout?
1. **Check backend is running:**
   ```bash
   pm2 list
   # Or
   ps aux | grep node
   ```

2. **Check backend logs:**
   ```bash
   pm2 logs
   # Or check your backend log file
   ```

3. **Test local connection:**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Check Nginx error logs:**
   ```bash
   tail -f /home/cloudpanel/htdocs/durchex.com/logs/error.log
   ```

5. **Verify Nginx proxy:**
   ```bash
   # Check if Nginx is proxying correctly
   curl -I https://durchex.com/api/v1/admin/stats
   ```

### CORS Errors?
- Backend CORS should already be configured to allow your domain
- Check `backend/server.js` CORS settings

### 502 Bad Gateway?
- Backend might not be running
- Check backend process: `pm2 list` or `systemctl status your-backend-service`

## Summary

✅ **Frontend now uses:** `https://durchex.com/api/v1` (same origin)
✅ **Nginx proxies:** `/api/` → `http://localhost:3000`
✅ **Backend runs on:** `localhost:3000` (not publicly exposed)
✅ **WebSocket support:** `/socket.io/` → `http://localhost:3000`

This is the standard production setup - secure and efficient!

