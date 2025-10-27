# Render Deployment Guide for Durchex NFT Marketplace

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Set up a production database
4. **Pinata Account**: For IPFS storage (optional but recommended)

## Step 1: Prepare Your Repository

### Backend Configuration
- ✅ Backend package.json updated with production start script
- ✅ Socket.io support added
- ✅ CORS configured for production

### Frontend Configuration
- ✅ Vite build configuration ready
- ✅ Environment variables configured
- ✅ Production-ready components

## Step 2: Deploy Backend to Render

1. **Create New Web Service**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service**
   ```
   Name: durchex-nft-backend
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Plan: Free
   ```

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/durchex_db
   VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   VITE_APP_VENDORNFT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_SECRECT_KEY=your_pinata_secret_key
   ```

## Step 3: Deploy Frontend to Render

1. **Create New Static Site**
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend Service**
   ```
   Name: durchex-nft-frontend
   Environment: Static Site
   Build Command: npm install && npm run build
   Publish Directory: dist
   Plan: Free
   ```

3. **Environment Variables**
   ```
   VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   VITE_APP_VENDORNFT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_SECRECT_KEY=your_pinata_secret_key
   VITE_APP_WEB3_PROVIDER=https://rpc.ankr.com/eth_sepolia
   ```

## Step 4: Update Frontend API URLs

After backend deployment, update the frontend to use the production backend URL:

1. **Update API Service** (`src/services/api.js`)
   ```javascript
   const API_BASE_URL = 'https://durchex-nft-backend.onrender.com/api/v1';
   ```

2. **Update Socket Service** (`src/services/socketService.js`)
   ```javascript
   const serverUrl = 'https://durchex-nft-backend.onrender.com';
   ```

## Step 5: Configure MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create a free cluster

2. **Configure Database**
   ```
   Database Name: durchex_db
   Collections: users, nfts, carts
   ```

3. **Get Connection String**
   - Copy the connection string
   - Replace `<password>` with your database password
   - Add to Render environment variables

## Step 6: Deploy Smart Contracts (Optional)

If you have deployed smart contracts:

1. **Update Contract Addresses**
   - Replace placeholder addresses in environment variables
   - Update `src/Context/constants.jsx`

2. **Verify Contracts**
   - Ensure contracts are verified on block explorer
   - Test contract functions

## Step 7: Final Configuration

1. **Update CORS Settings**
   - Backend CORS is already configured for production
   - Frontend URL will be added automatically

2. **Test Deployment**
   - Check backend health: `https://your-backend-url.onrender.com/api/health`
   - Test frontend: `https://your-frontend-url.onrender.com`

## Production URLs

After deployment, your services will be available at:
- **Backend**: `https://durchex-nft-backend.onrender.com`
- **Frontend**: `https://durchex-nft-frontend.onrender.com`

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings

3. **CORS Errors**
   - Ensure frontend URL is added to CORS origins
   - Check environment variables

4. **Socket.io Connection Issues**
   - Verify backend URL in frontend
   - Check WebSocket support

### Monitoring

- Use Render dashboard to monitor service health
- Check logs for any errors
- Monitor database connections

## Next Steps

1. **Custom Domain** (Optional)
   - Add custom domain in Render settings
   - Update DNS records

2. **SSL Certificates**
   - Automatically provided by Render
   - HTTPS enabled by default

3. **Scaling**
   - Upgrade to paid plan for better performance
   - Add more resources as needed

## Support

- Render Documentation: [render.com/docs](https://render.com/docs)
- MongoDB Atlas Documentation: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- Project Issues: Check GitHub repository issues
