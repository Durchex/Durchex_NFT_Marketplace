# Fixing 403 Forbidden Error on Hostinger VPS with CloudPanel

403 Forbidden errors typically occur due to:
1. **File/Directory Permissions**
2. **Nginx Configuration Issues**
3. **Missing Index Files**
4. **SELinux/AppArmor Restrictions**

## Quick Fixes

### 1. Check and Fix File Permissions

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to your site directory
cd /home/cloudpanel/htdocs/yourdomain.com/

# Set correct ownership (CloudPanel uses 'cloudpanel' user)
chown -R cloudpanel:cloudpanel public/
chown -R cloudpanel:cloudpanel .

# Set correct permissions
# Directories should be 755
find public/ -type d -exec chmod 755 {} \;

# Files should be 644
find public/ -type f -exec chmod 644 {} \;

# Ensure parent directories have correct permissions
chmod 755 /home/cloudpanel/htdocs/
chmod 755 /home/cloudpanel/htdocs/yourdomain.com/
chmod 755 /home/cloudpanel/htdocs/yourdomain.com/public/
```

### 2. Check if index.html exists

```bash
# Verify index.html exists in public directory
ls -la /home/cloudpanel/htdocs/yourdomain.com/public/index.html

# If missing, check dist folder
ls -la /home/cloudpanel/htdocs/yourdomain.com/dist/index.html

# If it's in dist, copy it
cp -r dist/* public/
```

### 3. Fix Nginx Configuration

#### Option A: Via CloudPanel UI
1. Go to **CloudPanel** → **Sites** → Your Site → **Nginx Config**
2. Ensure the location block includes:

```nginx
location / {
    try_files $uri $uri/ /index.html;
    index index.html index.htm;
}
```

#### Option B: Edit Nginx Config File Directly

```bash
# Edit nginx config
nano /home/cloudpanel/htdocs/yourdomain.com/conf/nginx.conf
```

Add or update the location block:

```nginx
server {
    # ... other config ...
    
    root /home/cloudpanel/htdocs/yourdomain.com/public;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
        
        # Allow access
        allow all;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 4. Test and Reload Nginx

```bash
# Test nginx configuration
nginx -t

# If test passes, reload nginx
systemctl reload nginx

# Or via CloudPanel:
# Sites → Your Site → Reload Nginx
```

### 5. Check Nginx Error Logs

```bash
# View error logs
tail -f /home/cloudpanel/htdocs/yourdomain.com/logs/error.log

# View access logs
tail -f /home/cloudpanel/htdocs/yourdomain.com/logs/access.log
```

Look for specific error messages that indicate what's causing the 403.

### 6. Verify Directory Structure

```bash
# Check the structure
tree /home/cloudpanel/htdocs/yourdomain.com/public/ -L 2

# Or use ls
ls -la /home/cloudpanel/htdocs/yourdomain.com/public/
```

The structure should look like:
```
public/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

## API Routes Issue (api/books, api/auth, etc.)

If you're getting 403 on API routes, you may need:

### 1. Proxy API Requests (if backend is separate)

If your backend API is on a different server/port, add proxy configuration:

```nginx
# In nginx.conf
location /api/ {
    proxy_pass http://localhost:3001;  # Your backend API URL
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### 2. Allow Access to API Paths

```nginx
location /api/ {
    allow all;
    try_files $uri $uri/ /index.html;
}
```

### 3. CORS Issues (if API is on different domain)

This is typically a backend configuration issue. Ensure your backend API has CORS enabled:

```javascript
// Example Express.js backend
const cors = require('cors');
app.use(cors({
    origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
    credentials: true
}));
```

## Complete Fix Script

Create and run this script:

```bash
#!/bin/bash
DOMAIN="yourdomain.com"
SITE_PATH="/home/cloudpanel/htdocs/${DOMAIN}"
PUBLIC_PATH="${SITE_PATH}/public"

echo "🔧 Fixing 403 Forbidden Error..."

# Fix ownership
echo "Setting ownership..."
chown -R cloudpanel:cloudpanel "${SITE_PATH}"

# Fix permissions
echo "Setting permissions..."
find "${PUBLIC_PATH}" -type d -exec chmod 755 {} \;
find "${PUBLIC_PATH}" -type f -exec chmod 644 {} \;

# Ensure index.html exists
if [ ! -f "${PUBLIC_PATH}/index.html" ]; then
    echo "⚠️  index.html not found! Building..."
    cd "${SITE_PATH}"
    npm run build
    cp -r dist/* "${PUBLIC_PATH}/"
fi

# Test nginx
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    systemctl reload nginx
    echo "✅ Fixed! Check your site now."
else
    echo "❌ Nginx configuration has errors. Please fix them first."
fi
```

Save as `fix-403.sh`, make executable, and run:

```bash
chmod +x fix-403.sh
sudo ./fix-403.sh
```

## Common Causes and Solutions

### Cause 1: Wrong Permissions
**Solution**: `chmod 755` for directories, `chmod 644` for files

### Cause 2: Wrong Ownership
**Solution**: `chown -R cloudpanel:cloudpanel /path/to/site`

### Cause 3: Missing index.html
**Solution**: Ensure `npm run build` was run and files copied to `public/`

### Cause 4: Nginx blocking access
**Solution**: Check nginx config for `deny` directives or missing `try_files`

### Cause 5: Parent directory permissions
**Solution**: Ensure `/home/cloudpanel/htdocs/` and subdirectories are 755

## Verify Fix

After applying fixes:

1. **Check site**: Visit `https://yourdomain.com`
2. **Check browser console**: No more 403 errors
3. **Check network tab**: API calls should return 200 or proper status codes

## Still Having Issues?

1. **Check CloudPanel logs**:
   ```bash
   tail -f /home/cloudpanel/htdocs/yourdomain.com/logs/error.log
   ```

2. **Check system logs**:
   ```bash
   journalctl -u nginx -f
   ```

3. **Test from command line**:
   ```bash
   curl -I https://yourdomain.com
   curl -I https://yourdomain.com/api/books
   ```

4. **Verify files exist**:
   ```bash
   ls -la /home/cloudpanel/htdocs/yourdomain.com/public/
   ```

---

**Note**: Replace `yourdomain.com` with your actual domain name in all commands.

