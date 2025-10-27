# MongoDB Atlas Setup Guide for Durchex NFT Marketplace

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Start Free"
3. Sign up with your email or Google account

## Step 2: Create a New Cluster

1. **Choose Cloud Provider**: AWS, Google Cloud, or Azure
2. **Select Region**: Choose closest to your users
3. **Cluster Tier**: M0 (Free) for development, M2+ for production
4. **Cluster Name**: `durchex-nft-cluster`

## Step 3: Configure Database Access

1. **Database User**:
   - Username: `durchex-admin`
   - Password: Generate a strong password
   - Database User Privileges: `Atlas admin`

## Step 4: Configure Network Access

1. **IP Access List**:
   - For development: `0.0.0.0/0` (allow from anywhere)
   - For production: Add your specific IP addresses

## Step 5: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" driver
4. Copy the connection string

## Step 6: Update Environment Variables

Create a `.env` file in your backend directory:

```env
# MongoDB Atlas Connection
DATABASE=mongodb+srv://durchex-admin:<password>@durchex-nft-cluster.xxxxx.mongodb.net/durchex-nft-marketplace?retryWrites=true&w=majority

# Other environment variables
PORT=3000
NODE_ENV=development
```

## Step 7: Test Connection

Your existing code will automatically use the Atlas connection when you set the DATABASE environment variable.

## Benefits for Your NFT Marketplace:

✅ **Always Online**: No local MongoDB service to manage
✅ **Scalable**: Easy to upgrade as your platform grows
✅ **Secure**: Built-in security and encryption
✅ **Backed Up**: Automatic backups and recovery
✅ **Global**: Low latency worldwide
✅ **Free Tier**: M0 cluster is free forever (512MB storage)

## Production Considerations:

- **M2+ Cluster**: For production workloads
- **IP Whitelist**: Restrict access to your servers
- **Monitoring**: Use Atlas monitoring and alerts
- **Backups**: Configure automated backups
- **Security**: Enable encryption at rest and in transit
