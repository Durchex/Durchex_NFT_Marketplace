# Quick Start: Deploy to Hostinger VPS with CloudPanel

## Quick Deployment Steps

### 1. Initial Setup (One-time)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs git

# Verify
node --version  # Should show v18.x or higher
npm --version
```

### 2. CloudPanel Setup

1. **Access CloudPanel**: `https://your-vps-ip:8443`
2. **Create Site**: Sites → Add Site → Static Site
3. **Domain**: Enter your domain or subdomain
4. **Document Root**: `/home/cloudpanel/htdocs/yourdomain.com/public`

### 3. Deploy Application

```bash
# Navigate to your site directory
cd /home/cloudpanel/htdocs/yourdomain.com/

# Clone your repository (or upload files via SCP)
git clone https://github.com/yourusername/Durchex_NFT_Marketplace.git .

# Install dependencies
npm install

# Set environment variables (create .env.production)
nano .env.production
# Add your VITE_* variables

# Build the project
npm run build

# Deploy build files
cp -r dist/* public/

# Set permissions
chown -R cloudpanel:cloudpanel public/
chmod -R 755 public/
```

### 4. Configure Nginx for React Router

In CloudPanel: **Sites → Your Site → Nginx Config**

Add this location block:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Or edit the config file directly:

```bash
nano /home/cloudpanel/htdocs/yourdomain.com/conf/nginx.conf
```

Add the try_files directive in the location / block.

### 5. Setup SSL

1. **CloudPanel**: Sites → Your Site → SSL/TLS → Let's Encrypt SSL
2. Enter email and domain
3. Install SSL
4. Enable "Force HTTPS"

### 6. Test

Visit: `https://yourdomain.com`

---

## Quick Update Script

Make `deploy.sh` executable and use it:

```bash
chmod +x deploy.sh
./deploy.sh production
```

Or manually:

```bash
cd /home/cloudpanel/htdocs/yourdomain.com/
git pull
npm install
npm run build
cp -r dist/* public/
```

---

## Troubleshooting

### Routes return 404
**Fix**: Add `try_files $uri $uri/ /index.html;` to Nginx config

### Permission errors
```bash
chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/yourdomain.com/
```

### Environment variables not working
Rebuild after setting `.env.production`:
```bash
npm run build
cp -r dist/* public/
```

### Check logs
```bash
tail -f /home/cloudpanel/htdocs/yourdomain.com/logs/error.log
```

---

## Important Notes

1. **Always build before deploying**: `npm run build`
2. **React Router requires**: `try_files $uri $uri/ /index.html;` in Nginx
3. **Environment variables**: Must be set before building (they're embedded in the build)
4. **SSL**: Required for production (Web3 wallets won't work on HTTP)

---

For detailed instructions, see `DEPLOYMENT_CLOUDPANEL.md`

