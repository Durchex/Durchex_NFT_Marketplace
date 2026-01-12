# Create Page User Guide

## Overview
The Create page now supports two distinct workflows for creating NFTs:

1. **Single NFT Creation** - Create individual NFTs quickly
2. **Collection Creation** - Organize multiple NFTs into collections

## Accessing the Create Page

Navigate to `/create` to see the workflow selection screen.

## Workflow 1: Creating a Single NFT

### When to Use
- Creating individual NFTs
- Creating NFTs outside of a collection
- Quick NFT uploads

### Step-by-Step Guide

1. **Select "Create Single NFT"**
   - Click the purple card on the choice screen
   - Redirected to Single NFT creation form

2. **Upload Media**
   - Drag and drop image/video or click to browse
   - Supported formats:
     - Images: SVG, PNG, JPG, JPEG, GIF, WebP, BMP, ICO, TIFF
     - Videos: MP4, WebM, MOV, AVI, MKV
   - Multiple uploads allowed (batch creation)
   - Preview grid shows uploaded files

3. **Fill NFT Details**
   - **NFT Name** (required): Unique name for your NFT
   - **Description** (required): Detailed description of your NFT
   - **Price** (required): Listing price in selected network's currency
   - **Floor Price** (required): Minimum acceptable price
   - **Category** (required): gaming, sports, music, art, photography, or utility
   - **Network** (required): Choose blockchain network
   - **Collection** (optional): Assign to existing collection if desired

4. **Create NFT**
   - Click "Create NFT" button
   - Media uploaded to IPFS
   - Metadata created and stored
   - Database record created
   - Success notification displayed
   - Redirected to your profile after 2 seconds

### Pricing Strategy
- **Price**: What you want for the NFT
- **Floor Price**: Minimum price you'll accept
- Can be same or different based on your strategy

## Workflow 2: Creating a Collection

### When to Use
- Organizing multiple related NFTs
- Creating themed collections
- Building a collection to add NFTs to later

### Step-by-Step Guide

1. **Select "Create Collection"**
   - Click the blue card on the choice screen
   - Redirected to Collection creation form

2. **Upload Collection Image** (Optional)
   - Drag and drop image or click to browse
   - This becomes the collection's avatar/icon
   - Supported formats: SVG, PNG, JPG, JPEG, GIF, WebP
   - Image uploaded to IPFS

3. **Fill Collection Details**
   - **Collection Name** (required): Name of your collection
   - **Description** (required): What this collection is about
   - **Category** (required): gaming, sports, music, art, photography, or utility
   - **Network** (required): Choose blockchain network

4. **Create Collection**
   - Click "Create Collection" button
   - Collection image uploaded to IPFS (if provided)
   - Database record created
   - Success notification displayed
   - Redirected to collection details page

5. **Next Steps (After Creation)**
   - From collection details page, you can:
     - View collection settings
     - Add NFTs to collection
     - Edit collection information
     - View floor price and statistics

## Network Selection

All workflows support 6 blockchain networks:

| Network | Symbol | Use Case |
|---------|--------|----------|
| **Polygon** | POL | Low-cost, scalable |
| **Ethereum** | ETH | Established, highest security |
| **Arbitrum** | ETH | Fast, low-cost Layer 2 |
| **BSC** | BNB | High-speed, Binance ecosystem |
| **Base** | ETH | Coinbase Layer 2 |
| **Solana** | SOL | Ultra-fast blockchain |

**Tip:** Network icons display next to selection for quick identification.

## Tips & Best Practices

### For Single NFTs

1. **Naming**
   - Use descriptive, searchable names
   - Include series/collection info if relevant
   - Examples: "Artwork #001", "Trading Card Series 1"

2. **Descriptions**
   - Be detailed and accurate
   - Include rarity information
   - Mention special attributes
   - Add creator background

3. **Pricing**
   - Research comparable NFTs
   - Set realistic floor prices
   - Leave room for negotiation
   - Consider market demand

4. **Media Quality**
   - Use high-quality images/videos
   - Recommended: 1000x1000px or larger
   - Ensure proper file format
   - Test media preview before creating

5. **Batch Creation**
   - Upload multiple media files at once
   - All use same name/description/category
   - Useful for NFT series
   - Each gets unique numbering

### For Collections

1. **Collection Naming**
   - Use clear, memorable names
   - Reflect the collection theme
   - Avoid generic names
   - Leave room for naming conventions

2. **Collection Images**
   - Use professional artwork
   - Ensure brand consistency
   - Keep aspect ratio square (1:1)
   - Make it distinctive

3. **Collection Descriptions**
   - Explain collection theme
   - Mention number of planned NFTs
   - Include creator background
   - Add social media links in description

4. **Organization**
   - Create themed collections
   - Group by rarity tier
   - Organize by series/season
   - Keep related NFTs together

## Error Handling

### Common Issues

**"Upload NFT image!"**
- Solution: Drag and drop media files before creating

**"Please connect your wallet first!"**
- Solution: Click wallet connection icon, select network, connect wallet

**"Failed to upload images to IPFS"**
- Solution: Check file size and format, try again
- Contact support if persists

**"Failed to create NFT/collection"**
- Solution: Verify form is complete, check wallet connection
- Try again in a few moments

## File Size Recommendations

- **Images**: Up to 50MB
- **Videos**: Up to 50MB per file
- **Collection Icon**: Up to 20MB
- **Total Upload**: Recommend < 500MB

## Media Format Recommendations

### Images
- **PNG**: Best for graphics, transparency
- **JPG**: Best for photographs, smaller file size
- **SVG**: Best for vector art, scalable
- **WebP**: Modern format, smaller file size

### Videos
- **MP4**: Most compatible, recommended
- **WebM**: Modern format, smaller file size
- **MOV**: Apple QuickTime format

## After Creation

### Single NFT
1. Redirected to your profile
2. NFT appears in "Unminted NFTs" section
3. Can edit details if needed
4. Ready to mint to blockchain when desired

### Collection
1. Redirected to collection details page
2. View collection settings
3. Begin adding NFTs to collection
4. Edit collection metadata if needed

## Managing Your NFTs/Collections

### Editing
- From profile or collection page
- Can change description, prices, category
- Cannot change creation date

### Deleting
- Remove single NFTs from profile
- Delete collections (removes collection, not NFTs)
- Verification required for safety

### Viewing
- See all your NFTs in profile
- See all your collections in profile
- View collection details and analytics
- Check floor prices and statistics

## Troubleshooting

**Q: Can I add an NFT to multiple collections?**
A: Currently, each NFT belongs to one collection or none. Plan multiple versions if needed.

**Q: What happens to my data if creation fails?**
A: IPFS uploads are stored but database record won't be created. You can retry.

**Q: Can I change networks after creating?**
A: No, network is fixed at creation. Create another NFT on desired network if needed.

**Q: How long does creation take?**
A: Usually 30-60 seconds depending on file size and network congestion.

**Q: Can I create collections with no NFTs?**
A: Yes, create collection first, then add NFTs later from collection details page.

**Q: What's the difference between Price and Floor Price?**
A: Price is listing price, Floor Price is minimum acceptable. Often same, but can differ.

## Support

For issues or questions:
1. Check this guide first
2. Review error messages
3. Contact support with details
4. Include wallet address and transaction hash if applicable

---

**Happy Creating! 🎨📦**

Start by visiting `/create` and selecting your workflow.
