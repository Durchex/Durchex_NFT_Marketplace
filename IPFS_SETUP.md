# IPFS Setup Guide

## Pinata Configuration

The NFT marketplace uses IPFS (via Pinata) for storing NFT images, metadata, and collection images. Follow these steps to set up IPFS uploads:

### 1. Create a Pinata Account

1. Go to [https://app.pinata.cloud/](https://app.pinata.cloud/)
2. Sign up for a free account
3. Verify your email

### 2. Generate API Keys

1. In your Pinata dashboard, go to **API Keys** section
2. Click **"New Key"**
3. Give your key a name (e.g., "Durchex NFT Marketplace")
4. Select the following permissions:
   - `pinFileToIPFS` - For uploading images and files
   - `pinJSONToIPFS` - For uploading NFT metadata
5. Click **"Create Key"**

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in your Pinata credentials:

```bash
# Option 1: Use API Key and Secret (recommended for server-side)
VITE_PINATA_API_KEY=your_actual_pinata_api_key
VITE_PINATA_SECRET_KEY=your_actual_pinata_secret_key

# Option 2: Use JWT Token (recommended for client-side uploads)
VITE_PINATA_JWT=your_actual_pinata_jwt_token
```

### 4. Test the Configuration

1. Start your development server: `npm run dev`
2. Try uploading an image in the Create page or updating your profile picture
3. Check the browser console for successful IPFS uploads

## Troubleshooting

### "Network Error" or "ERR_EMPTY_RESPONSE"
- Check your internet connection
- Verify your Pinata API credentials are correct
- Pinata service might be temporarily down - try again later

### "IPFS authentication failed"
- Double-check your API key and secret
- Make sure your API key has the correct permissions
- Try regenerating your API key

### "IPFS upload rate limit exceeded"
- Free Pinata accounts have upload limits
- Wait a few minutes before trying again
- Consider upgrading to a paid plan for higher limits

### Upload Works But Images Don't Load
- IPFS propagation can take a few minutes
- Try refreshing the page after a few minutes
- Check that you're using the correct gateway URL

## Fallback Behavior

If IPFS uploads fail, the application will automatically fall back to using local data URLs. However:
- **Images won't persist** across browser sessions
- **NFT metadata won't be permanently stored** on IPFS
- **Collections and NFTs may not display properly** for other users

**Always configure IPFS properly for production use!**

## Alternative IPFS Services

If you prefer not to use Pinata, you can modify the upload functions in:
- `frontend/src/components/CoverPhotoUploader.jsx`
- `frontend/src/pages/Create.jsx`

To use other IPFS services like:
- Infura IPFS
- Web3.Storage
- NFT.Storage