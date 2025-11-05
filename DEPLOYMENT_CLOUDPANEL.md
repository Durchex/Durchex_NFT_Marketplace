# Deployment Guide: Hostinger VPS with CloudPanel

This guide will help you deploy the Durchex NFT Marketplace to a Hostinger VPS using CloudPanel.

## Prerequisites

- Hostinger VPS with CloudPanel installed
- SSH access to your VPS
- Domain or subdomain pointed to your VPS IP
- Node.js installed on the VPS (for building)

## Step 1: Initial VPS Setup

### 1.1 Connect to Your VPS via SSH
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### 1.2 Install Node.js (if not already installed)
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x (or latest LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.3 Install Git (if not installed)
```bash
apt install -y git
```

## Step 2: Access CloudPanel

1. Open your browser and go to: `https://your-vps-ip:8443`
2. Login with your CloudPanel credentials
3. Accept the SSL certificate warning (self-signed certificate)

## Step 3: Create a New Site in CloudPanel

### 3.1 Create Static Site
1. In CloudPanel dashboard, click **"Sites"**
2. Click **"Add Site"**
3. Choose **"Static Site"** or **"Node.js"** depending on your setup
4. Fill in:
   - **Domain**: `yourdomain.com` or `nftmarketplace.yourdomain.com`
   - **Document Root**: `/home/cloudpanel/htdocs/yourdomain.com/public`
   - Click **"Create Site"**

## Step 4: Deploy Your Application

### 4.1 Clone Your Repository (or upload files)
```bash
# Navigate to the site directory
cd /home/cloudpanel/htdocs/yourdomain.com/

# Option 1: Clone from GitHub
git clone https://github.com/yourusername/Durchex_NFT_Marketplace.git .

# Option 2: Upload via SCP from local machine
# On your local machine:
scp -r /path/to/project root@your-vps-ip:/home/cloudpanel/htdocs/yourdomain.com/
```

### 4.2 Install Dependencies
```bash
cd /home/cloudpanel/htdocs/yourdomain.com/
npm install
```

### 4.3 Build the Frontend
```bash
# Build the production version
npm run build

# This will create a `dist` folder with all static files
```

### 4.4 Move Build Files to Public Directory
```bash
# If using Static Site
# Move dist contents to the public directory
cp -r dist/* /home/cloudpanel/htdocs/yourdomain.com/public/

# Or if the site root is the dist folder:
# Copy build files to the document root
rm -rf /home/cloudpanel/htdocs/yourdomain.com/public/*
cp -r dist/* /home/cloudpanel/htdocs/yourdomain.com/public/
```

## Step 5: Configure Nginx (via CloudPanel)

### 5.1 Update Document Root
1. In CloudPanel, go to **Sites** → Your Site → **Settings**
2. Update **Document Root** to point to your build folder:
   - `/home/cloudpanel/htdocs/yourdomain.com/public`

### 5.2 Configure Nginx for React Router (SPA)
1. Go to **Sites** → Your Site → **Nginx Config**
2. Add this configuration to handle React Router:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 5.3 Alternative: Edit Nginx Config File Directly
```bash
# Edit the nginx config
nano /home/cloudpanel/htdocs/yourdomain.com/conf/nginx.conf

# Add the try_files directive for SPA routing
# location / {
#     try_files $uri $uri/ /index.html;
# }
```

## Step 6: Environment Variables

### 6.1 Set Environment Variables
If your app uses environment variables (VITE_*), you need to set them before building:

```bash
# Edit or create .env.production file
nano .env.production

# Add your environment variables:
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS=0x...
VITE_PINATA_API_KEY=your_key
VITE_PINATA_SECRECT_KEY=your_secret
VITE_APP_WEB3_PROVIDER=https://rpc.ankr.com/eth_sepolia
```

### 6.2 Rebuild with Environment Variables
```bash
npm run build
cp -r dist/* /home/cloudpanel/htdocs/yourdomain.com/public/
```

## Step 7: SSL Certificate (Let's Encrypt)

1. In CloudPanel, go to **Sites** → Your Site → **SSL/TLS**
2. Click **"Let's Encrypt SSL"**
3. Enter your email
4. Click **"Install"**
5. Enable **"Force HTTPS"**

## Step 8: Backend API (if applicable)

If you have a backend API, you can deploy it separately:

### Option 1: Node.js API (if you have one)
```bash
# Create a new Node.js site in CloudPanel
# Or use PM2 to run your backend

# Install PM2
npm install -g pm2

# Start your backend
cd /path/to/backend
pm2 start server.js --name "durchex-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: Backend as Separate Site
1. Create another site in CloudPanel for API
2. Use subdomain like `api.yourdomain.com`
3. Configure reverse proxy if needed

## Step 9: Firewall Configuration

```bash
# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow CloudPanel
ufw allow 8443/tcp

# Enable firewall
ufw enable
```

## Step 10: Automated Deployment Script

Create a deployment script for easier updates:

```bash
# Create deploy.sh
nano /home/cloudpanel/htdocs/yourdomain.com/deploy.sh
```

Add this content:

```bash
#!/bin/bash
echo "Starting deployment..."

# Navigate to project directory
cd /home/cloudpanel/htdocs/yourdomain.com/

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build the project
npm run build

# Copy build files to public directory
rm -rf public/*
cp -r dist/* public/

# Set proper permissions
chown -R cloudpanel:cloudpanel public/

echo "Deployment completed!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Step 11: Testing

1. Visit your domain: `https://yourdomain.com`
2. Test all routes (Explore, Create, etc.)
3. Check browser console for errors
4. Verify API connections (if using backend)

## Troubleshooting

### Issue: 404 on routes
**Solution**: Ensure Nginx config has `try_files $uri $uri/ /index.html;`

### Issue: Environment variables not working
**Solution**: Rebuild after setting environment variables

### Issue: Permission errors
**Solution**:
```bash
chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/yourdomain.com/
chmod -R 755 /home/cloudpanel/htdocs/yourdomain.com/public/
```

### Issue: Build fails
**Solution**: Check Node.js version (should be 18+), ensure all dependencies are installed

### Issue: SSL not working
**Solution**: Ensure DNS is properly configured and pointing to your VPS IP

## Maintenance

### Updating the Site
```bash
cd /home/cloudpanel/htdocs/yourdomain.com/
git pull
npm install
npm run build
cp -r dist/* public/
```

### View Logs
```bash
# Nginx error logs
tail -f /home/cloudpanel/htdocs/yourdomain.com/logs/error.log

# Nginx access logs
tail -f /home/cloudpanel/htdocs/yourdomain.com/logs/access.log
```

## Security Recommendations

1. **Enable Firewall**: Already configured above
2. **Keep System Updated**: `apt update && apt upgrade`
3. **Use Strong Passwords**: For SSH and CloudPanel
4. **Disable Root SSH**: Use a regular user with sudo
5. **Regular Backups**: Set up automated backups in CloudPanel
6. **Monitor Logs**: Regularly check for suspicious activity

## Additional Resources

- CloudPanel Documentation: https://www.cloudpanel.io/docs/
- Hostinger VPS Guide: https://www.hostinger.com/tutorials/vps/
- Let's Encrypt: https://letsencrypt.org/

---

**Note**: Adjust paths and domain names according to your actual setup.

