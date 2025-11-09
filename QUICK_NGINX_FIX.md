# Quick Nginx Fix - Step by Step

The error `Cannot GET //v1/admin/users` means Nginx is stripping `/api` incorrectly.

## Immediate Fix (5 minutes)

### Step 1: SSH into your server
```bash
ssh your-user@your-server
```

### Step 2: Check current Nginx config
```bash
grep -A 3 "location /api/" /home/durchex/htdocs/durchex.com/nginx.conf
```

**If you see:**
```nginx
proxy_pass http://localhost:3000;
```
**That's the problem!**

### Step 3: Edit the config
```bash
sudo nano /home/durchex/htdocs/durchex.com/nginx.conf
```

### Step 4: Find and change this line
**Find:**
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
```

**Change to:**
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
```

**CRITICAL:** Add `/api/` at the end of the proxy_pass URL!

### Step 5: Save and exit
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 6: Test and reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Verify the fix
```bash
curl -I https://durchex.com/api/v1/admin/stats
```

Should return `200` or `401` (not `404`).

## If location /api/ doesn't exist

Add this block inside your `server { }` block (usually after `location / {`):

```nginx
# API Proxy
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

## Verify it worked

After reloading, check your browser console. You should see:
- ✅ `200 OK` or `401 Unauthorized` (not `404`)
- ✅ No more `Cannot GET //v1/admin/users` errors

## Still not working?

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check Nginx error logs:**
   ```bash
   tail -20 /home/durchex/htdocs/durchex.com/logs/error.log
   ```

3. **Verify the change was saved:**
   ```bash
   grep "proxy_pass" /home/durchex/htdocs/durchex.com/nginx.conf | grep "/api/"
   ```
   Should show: `proxy_pass http://localhost:3000/api/;`

