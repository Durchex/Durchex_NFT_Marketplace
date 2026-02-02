import Collection from "../models/collectionModel.js";
import { nftModel } from "../models/nftModel.js";
import LazyNFT from "../models/lazyNFTModel.js";
import { pieceHoldingModel } from "../models/pieceHoldingModel.js";
import { pieceSellOrderModel } from "../models/pieceSellOrderModel.js";
import { nftTradeModel } from "../models/nftTradeModel.js";
import nftContractService from "../services/nftContractService.js";

/**
 * Helper function to convert lazy NFT to regular NFT format
 * This allows lazy NFTs to be displayed alongside regular NFTs
 */
function formatLazyNFTAsNFT(lazyNFT, network = 'polygon') {
  // Use stored network from the NFT (from creation form dropdown) when available
  const resolvedNetwork = (lazyNFT.network && String(lazyNFT.network).toLowerCase()) || network || 'polygon';

  // Extract image from IPFS URI or use imageURI
  let image = lazyNFT.imageURI || '';
  
  // If no imageURI, try to construct from IPFS URI
  // The IPFS URI might point to metadata JSON, but we'll use it as fallback
  if (!image && lazyNFT.ipfsURI) {
    // Convert ipfs:// to https://ipfs.io/ipfs/ for display
    if (lazyNFT.ipfsURI.startsWith('ipfs://')) {
      image = lazyNFT.ipfsURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    } else {
      image = lazyNFT.ipfsURI;
    }
  }

  // Listing/template owner is always the creator; minted pieces go to buyers but the listing stays with creator
  const owner = lazyNFT.creator;

  // Get collection ID (could be ObjectId or string)
  let collectionId = null;
  if (lazyNFT.collection) {
    if (typeof lazyNFT.collection === 'object' && lazyNFT.collection._id) {
      collectionId = lazyNFT.collection._id.toString();
    } else if (typeof lazyNFT.collection === 'object' && lazyNFT.collection.collectionId) {
      collectionId = lazyNFT.collection.collectionId;
    } else {
      collectionId = lazyNFT.collection.toString();
    }
  }

  return {
    _id: lazyNFT._id,
    itemId: lazyNFT._id.toString(), // Use MongoDB ID as itemId
    tokenId: lazyNFT.tokenId || lazyNFT._id.toString(), // Use tokenId if redeemed, otherwise _id
    name: lazyNFT.name || 'Untitled NFT',
    description: lazyNFT.description || '',
    image: image,
    imageURL: image,
    price: lazyNFT.price || '0',
    floorPrice: lazyNFT.floorPrice || null,
    network: resolvedNetwork, // Use NFT's selected network for correct marketplace display
    collection: collectionId,
    owner: owner,
    seller: lazyNFT.creator, // Creator is always the seller
    creator: lazyNFT.creator,
    creatorWallet: lazyNFT.creator,
    currentlyListed: lazyNFT.status === 'pending' && lazyNFT.enableStraightBuy && lazyNFT.remainingPieces > 0,
    isLazyMint: true, // Flag to identify lazy mints
    lazyMintStatus: lazyNFT.status,
    royaltyPercentage: lazyNFT.royaltyPercentage || 10,
    pieces: lazyNFT.pieces || 1,
    remainingPieces: lazyNFT.remainingPieces !== undefined ? lazyNFT.remainingPieces : (lazyNFT.pieces || 1),
    category: lazyNFT.category || '',
    attributes: lazyNFT.attributes || [],
    views: lazyNFT.views || 0,
    likes: lazyNFT.likes?.length || 0,
    createdAt: lazyNFT.createdAt,
    updatedAt: lazyNFT.updatedAt,
    expiresAt: lazyNFT.expiresAt,
    // Additional lazy mint specific fields
    ipfsURI: lazyNFT.ipfsURI,
    signature: lazyNFT.signature,
    nonce: lazyNFT.nonce,
    // Mint status
    isMinted: lazyNFT.status === 'redeemed' && !!lazyNFT.tokenId,
    mintedAt: lazyNFT.redeemedAt || null,
    // Who bought (for display); listing owner is always creator
    ...(lazyNFT.redemptions?.length
      ? { lastBuyer: lazyNFT.redemptions[lazyNFT.redemptions.length - 1].buyer }
      : lazyNFT.buyer
        ? { lastBuyer: lazyNFT.buyer }
        : {}),
  };
}

// Create a new NFT Collection
export const createCollection = async (req, res) => {
  try {
    const data = req.body;
    const { deployContract = false, network = 'sepolia', factoryAddress } = req.body;

    // Basic validation
    if (!data.name || !data.creatorWallet || !data.network) {
      return res.status(400).json({ error: "name, creatorWallet, and network are required" });
    }
    
    // Generate a unique collectionId if not provided
    const collectionId = data.collectionId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prevent duplicate collection by name/network/creator
    const exists = await Collection.findOne({
      name: data.name,
      network: data.network,
      creatorWallet: data.creatorWallet.toLowerCase(),
    });
    if (exists) {
      return res.status(409).json({ error: "Collection already exists for this creator/network" });
    }
    
    const collectionData = {
      ...data,
      collectionId,
      creatorWallet: data.creatorWallet.toLowerCase(),
      contractDeploymentStatus: 'pending'
    };

    // If smart contract deployment requested
    if (deployContract && factoryAddress) {
      console.log(`🔗 Smart contract deployment requested for collection: ${data.name}`);

      try {
        // Deploy collection contract via factory
        const deploymentResult = await nftContractService.deployCollection({
          network,
          collectionName: data.name,
          collectionSymbol: data.symbol || data.name.slice(0, 4).toUpperCase(),
          creatorAddress: data.creatorWallet,
          royaltyPercentage: data.royalty ? Math.floor(data.royalty * 100) : 250,
          royaltyRecipient: data.creatorWallet,
          factoryAddress
        });

        if (!deploymentResult.success) {
          return res.status(500).json({
            error: "Collection contract deployment failed",
            details: deploymentResult.error
          });
        }

        // Update collection data with contract info
        collectionData.contractAddress = deploymentResult.collectionAddress;
        collectionData.contractDeploymentStatus = 'deployed';
        collectionData.contractDeploymentTx = deploymentResult.deploymentTx;
        collectionData.contractDeploymentBlock = deploymentResult.deploymentBlock;
        collectionData.chainContracts = {
          [network]: {
            contractAddress: deploymentResult.collectionAddress,
            deploymentTx: deploymentResult.deploymentTx,
            deploymentBlock: deploymentResult.deploymentBlock,
            status: 'deployed',
            deployedAt: new Date()
          }
        };
        collectionData.isContractVerified = false;

        console.log(`✅ Collection deployed to: ${deploymentResult.collectionAddress}`);
      } catch (error) {
        console.error(`❌ Smart contract deployment failed: ${error.message}`);
        return res.status(500).json({
          error: "Smart contract deployment failed",
          details: error.message
        });
      }
    }
    
    const collection = new Collection(collectionData);
    await collection.save();

    res.status(201).json({
      message: "Collection created successfully",
      collection,
      ...(deployContract && {
        deployed: true,
        contractAddress: collection.contractAddress,
        txHash: collection.contractDeploymentTx
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    console.log('🔍 getCollection called');
    console.log('   collectionId type:', typeof collectionId);
    console.log('   collectionId value:', JSON.stringify(collectionId));
    console.log('   collectionId length:', collectionId?.length);
    
    // Try to find by custom collectionId first, then by MongoDB _id
    console.log('📊 Searching Collection.findOne({ collectionId:' + collectionId + ' })');
    let collection = await Collection.findOne({ collectionId: String(collectionId) });
    console.log('📊 findOne result:', collection ? `Found: ${collection.name}` : 'Not found');
    
    if (!collection) {
      console.log('📊 Trying findById with:', collectionId);
      collection = await Collection.findById(collectionId);
      console.log('📊 findById result:', collection ? `Found: ${collection.name}` : 'Not found');
    }
    
    if (!collection) {
      console.log('❌ Collection not found for:', collectionId);
      // Don't return 404, return 200 with empty array to match current behavior
      return res.status(200).json([]);
    }
    
    console.log('✅ Returning collection:', collection.name);
    res.status(200).json(collection);
  } catch (error) {
    console.error('💥 Error in getCollection:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserCollections = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const collections = await Collection.find({
      creatorWallet: walletAddress.toLowerCase()
    }).sort({ createdAt: -1 });
    
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find({})
      .sort({ createdAt: -1 })
      .limit(100); // Limit for performance
    
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCollectionNFTs = async (req, res) => {
  try {
    const { collectionId } = req.params;
    
    // Find the collection to get its ID (could be _id, collectionId, or name)
    const collectionDoc = await Collection.findOne({ 
      $or: [
        { _id: collectionId },
        { collectionId: collectionId },
        { name: collectionId }
      ]
    });
    
    if (!collectionDoc) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    // Query regular NFTs where the collection field matches
    const regularNfts = await nftModel.find({
      collection: collectionDoc._id.toString() // Match by string ID
    }).sort({ createdAt: -1 });
    
    // Also try matching by collection name/ID string
    const regularNftsByName = await nftModel.find({
      $or: [
        { collection: collectionDoc.name },
        { collection: collectionDoc.collectionId }
      ]
    }).sort({ createdAt: -1 });
    
    // Combine regular NFTs (avoid duplicates)
    const allRegularNfts = [...regularNfts];
    regularNftsByName.forEach(nft => {
      if (!allRegularNfts.find(existing => existing._id.toString() === nft._id.toString())) {
        allRegularNfts.push(nft);
      }
    });
    
    // Query lazy NFTs in the same collection
    const lazyNfts = await LazyNFT.find({ 
      $or: [
        { collection: collectionDoc._id },
        { collection: collectionDoc.collectionId }
      ],
      status: { $in: ['pending', 'redeemed', 'fully_redeemed'] },
      expiresAt: { $gt: new Date() }
    }).populate('collection');
    
    // Convert lazy NFTs to regular NFT format
    const formattedLazyNfts = lazyNfts.map(lazyNFT => 
      formatLazyNFTAsNFT(lazyNFT, collectionDoc.network || 'polygon')
    );
    
    // Combine both types of NFTs
    const allNfts = [...allRegularNfts, ...formattedLazyNfts];
    
    // Sort by creation date (newest first)
    allNfts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.status(200).json(allNfts);
  } catch (error) {
    console.error('Error fetching collection NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.collectionId;
    delete updateData.creatorWallet;
    delete updateData.createdAt;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Try to find by MongoDB _id first (preferred), then by collectionId
    let collection = await Collection.findByIdAndUpdate(
      collectionId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // If not found by _id, try by collectionId field
    if (!collection) {
      collection = await Collection.findOneAndUpdate(
        { collectionId },
        updateData,
        { new: true, runValidators: true }
      );
    }
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    res.status(200).json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    
    const collection = await Collection.findOneAndDelete({ collectionId });
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    // Optionally, you might want to delete associated NFTs here
    // await nftModel.deleteMany({ collection: collectionId });
    
    res.status(200).json({ message: "Collection deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkNftExists = async (req, res) => {
  try {
    const { itemId, network } = req.body;

    if (!itemId || !network) {
      return res.status(400).json({ error: "itemId and network are required" });
    }

    const nft = await nftModel.findOne({ itemId, network });
    return res.json({ exists: !!nft });
  } catch (error) {
    console.error('Error checking NFT existence:', error);
    return res.status(500).json({ error: error.message });
  }
};

// In-memory store for pending transfers (network:itemId -> record)
const pendingTransfersStore = new Map();

/** POST /nfts/update-owner — Post-buy sync: decrement remainingPieces, add piece holding for buyer, record trade (price/market cap). Creator/owner of token is never changed. */
export const updateNftOwner = async (req, res) => {
  try {
    const { network, itemId, tokenId, newOwner, listed, quantity = 1, price, transactionHash, seller } = req.body;
    if (!network || itemId == null || !newOwner) {
      return res.status(400).json({ error: "network, itemId, and newOwner are required" });
    }
    const net = String(network).toLowerCase();
    const buyerNorm = String(newOwner).toLowerCase();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // 1. Find NFT — token owner stays creator; we only update remainingPieces and piece holdings
    const existing = await nftModel.findOne({ network: net, itemId: String(itemId) });
    if (!existing) {
      // Fall through to LazyNFT check below
    } else {
      const currentRemaining = Math.max(0, Number(existing.remainingPieces ?? existing.pieces ?? 1));
      const newRemaining = Math.max(0, currentRemaining - qty);
      const priceStr = price != null ? String(price) : (existing.price || "0");
      const totalPieces = Math.max(1, Number(existing.pieces ?? 1));
      const lastPrice = priceStr;
      const marketCap = (parseFloat(priceStr) * totalPieces).toFixed(18);
      const updatePayload = {
        remainingPieces: newRemaining,
        lastPrice,
        marketCap,
        ...(tokenId != null && { tokenId: String(tokenId) }),
      };
      const nft = await nftModel.findOneAndUpdate(
        { network: net, itemId: String(itemId) },
        { $set: updatePayload },
        { new: true }
      );
      if (nft) {
        // Add piece holding for buyer (creator/owner of token unchanged)
        const holding = await pieceHoldingModel.findOneAndUpdate(
          { network: net, itemId: String(itemId), wallet: buyerNorm },
          { $inc: { pieces: qty } },
          { new: true, upsert: true }
        );
        // Record trade for transaction history & price movement (blockchain-style)
        const sellerNorm = (seller || existing.owner || existing.creator).toLowerCase();
        const totalAmount = (parseFloat(priceStr) * qty).toFixed(18);
        await nftTradeModel.create({
          network: net,
          itemId: String(itemId),
          transactionType: "primary_buy",
          seller: sellerNorm,
          buyer: buyerNorm,
          quantity: qty,
          pricePerPiece: priceStr,
          totalAmount,
          transactionHash: transactionHash || null,
        });
        return res.json({
          success: true,
          updated: "nft",
          nftId: nft._id,
          buyer: buyerNorm,
          remainingPieces: nft.remainingPieces,
          holdingPieces: holding?.pieces ?? qty,
          lastPrice: nft.lastPrice,
          marketCap: nft.marketCap,
        });
      }
    }

    // 1b. Legacy: if no pieces/remainingPieces, still allow owner update for 1:1 NFTs (not lazy-mint)
    const nftLegacy = await nftModel.findOneAndUpdate(
      { network: net, itemId: String(itemId) },
      { $set: { owner: buyerNorm, currentlyListed: listed !== undefined && listed !== null ? !!listed : true, ...(tokenId != null && { tokenId: String(tokenId) }) } },
      { new: true }
    );
    if (nftLegacy) {
      return res.json({ success: true, updated: "nft", nftId: nftLegacy._id, owner: buyerNorm, listed: !!listed });
    }

    // 2. Lazy-mint: itemId 24-char hex is LazyNFT _id; do NOT update LazyNFT here (only confirm-redemption updates it)
    if (/^[a-fA-F0-9]{24}$/.test(String(itemId))) {
      return res.status(400).json({
        error: "Lazy-mint listings are updated only via confirm-redemption. Do not call updateNftOwner for lazy-mint items.",
      });
    }

    return res.status(404).json({ error: "NFT not found for this network and itemId" });
  } catch (error) {
    console.error("Error updating NFT owner:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** POST /pending-transfers — Store pending transfer record (buyer/seller/txHash) */
export const createPendingTransfer = async (req, res) => {
  try {
    const { network, itemId, nftContract, buyerAddress, sellerAddress, transactionHash } = req.body;
    if (!network || itemId == null || !buyerAddress) {
      return res.status(400).json({ error: "network, itemId, and buyerAddress are required" });
    }
    const key = `${String(network).toLowerCase()}:${String(itemId)}`;
    pendingTransfersStore.set(key, {
      network: String(network).toLowerCase(),
      itemId: String(itemId),
      nftContract: nftContract || null,
      buyerAddress: String(buyerAddress).toLowerCase(),
      sellerAddress: sellerAddress ? String(sellerAddress).toLowerCase() : null,
      transactionHash: transactionHash || null,
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json({ success: true, message: "Pending transfer recorded" });
  } catch (error) {
    console.error("Error creating pending transfer:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ——— Piece sell orders (collectors sell pieces back into liquidity) ———

/** POST /nfts/piece-sell-orders — Collector lists pieces for sale (sell back liquidity). */
export const createPieceSellOrder = async (req, res) => {
  try {
    const { network, itemId, seller, quantity, pricePerPiece } = req.body;
    if (!network || !itemId || !seller || quantity == null || quantity < 1 || !pricePerPiece) {
      return res.status(400).json({ error: "network, itemId, seller, quantity (>=1), and pricePerPiece are required" });
    }
    const net = String(network).toLowerCase();
    const sellerNorm = String(seller).toLowerCase();
    const qty = Math.max(1, parseInt(quantity, 10));

    const holding = await pieceHoldingModel.findOne({ network: net, itemId: String(itemId), wallet: sellerNorm });
    const available = holding ? Number(holding.pieces) : 0;
    if (available < qty) {
      return res.status(400).json({ error: `Insufficient pieces. You have ${available}, requested ${qty}.` });
    }

    const order = await pieceSellOrderModel.create({
      network: net,
      itemId: String(itemId),
      seller: sellerNorm,
      quantity: qty,
      pricePerPiece: String(pricePerPiece),
      status: "active",
    });
    return res.status(201).json({ success: true, order: order.toObject() });
  } catch (error) {
    console.error("Error creating piece sell order:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** GET /nfts/piece-sell-orders/:network/:itemId — Active sell orders for an NFT (liquidity pool). */
export const getPieceSellOrdersByNft = async (req, res) => {
  try {
    const { network, itemId } = req.params;
    const net = String(network).toLowerCase();
    const orders = await pieceSellOrderModel
      .find({ network: net, itemId: String(itemId), status: "active" })
      .sort({ pricePerPiece: 1, createdAt: 1 })
      .lean();
    return res.json({ orders });
  } catch (error) {
    console.error("Error fetching piece sell orders:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** GET /nfts/piece-holdings/:wallet — Holdings by wallet (for My NFTs). */
export const getPieceHoldingsByWallet = async (req, res) => {
  try {
    const { wallet } = req.params;
    const holdings = await pieceHoldingModel
      .find({ wallet: String(wallet).toLowerCase(), pieces: { $gt: 0 } })
      .lean();
    return res.json({ holdings });
  } catch (error) {
    console.error("Error fetching piece holdings:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** POST /nfts/piece-sell-orders/:orderId/fill — Buy from a collector's sell order (fill order). */
export const fillPieceSellOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { buyer, quantity } = req.body;
    if (!buyer) {
      return res.status(400).json({ error: "buyer is required" });
    }
    const buyQty = Math.max(1, parseInt(quantity, 10) || 1);
    const buyerNorm = String(buyer).toLowerCase();

    const order = await pieceSellOrderModel.findById(orderId);
    if (!order || order.status !== "active") {
      return res.status(404).json({ error: "Order not found or not active" });
    }
    const remaining = order.quantity - (order.filledQuantity || 0);
    if (buyQty > remaining) {
      return res.status(400).json({ error: `Only ${remaining} pieces available in this order.` });
    }

    const sellerHolding = await pieceHoldingModel.findOne({
      network: order.network,
      itemId: order.itemId,
      wallet: order.seller,
    });
    if (!sellerHolding || Number(sellerHolding.pieces) < buyQty) {
      return res.status(400).json({ error: "Seller no longer has enough pieces." });
    }

    await pieceHoldingModel.findOneAndUpdate(
      { network: order.network, itemId: order.itemId, wallet: order.seller },
      { $inc: { pieces: -buyQty } },
      { new: true }
    );
    await pieceHoldingModel.findOneAndUpdate(
      { network: order.network, itemId: order.itemId, wallet: buyerNorm },
      { $inc: { pieces: buyQty } },
      { new: true, upsert: true }
    );

    const newFilled = (order.filledQuantity || 0) + buyQty;
    const newStatus = newFilled >= order.quantity ? "filled" : "partially_filled";
    await pieceSellOrderModel.findByIdAndUpdate(orderId, {
      filledQuantity: newFilled,
      status: newStatus,
    });

    const pricePerPiece = order.pricePerPiece;
    const totalAmount = (parseFloat(pricePerPiece) * buyQty).toFixed(18);
    await nftTradeModel.create({
      network: order.network,
      itemId: order.itemId,
      transactionType: "secondary_buy",
      seller: order.seller,
      buyer: buyerNorm,
      quantity: buyQty,
      pricePerPiece: String(pricePerPiece),
      totalAmount,
      transactionHash: null,
    });
    const nft = await nftModel.findOne({ network: order.network, itemId: order.itemId });
    if (nft) {
      const totalPieces = Math.max(1, Number(nft.pieces ?? 1));
      const marketCap = (parseFloat(pricePerPiece) * totalPieces).toFixed(18);
      await nftModel.updateOne(
        { network: order.network, itemId: order.itemId },
        { $set: { lastPrice: String(pricePerPiece), marketCap } }
      );
    }

    return res.json({
      success: true,
      filled: buyQty,
      orderId,
      status: newStatus,
      message: "Order filled. Payment (minus fee/royalty) should be sent to seller off-chain or via contract.",
    });
  } catch (error) {
    console.error("Error filling piece sell order:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** GET /nfts/:network/:itemId/trades — Transaction history for NFT (buy/sell — liquidity in/out). */
export const getNftTrades = async (req, res) => {
  try {
    const { network, itemId } = req.params;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const net = String(network).toLowerCase();
    const trades = await nftTradeModel
      .find({ network: net, itemId: String(itemId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ trades });
  } catch (error) {
    console.error("Error fetching NFT trades:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** GET /nfts/:network/:itemId/analytics — Price history, volume, market cap, price movement from trades. */
export const getNftAnalytics = async (req, res) => {
  try {
    const { network, itemId } = req.params;
    const period = (req.query.period || "7d").toLowerCase();
    const net = String(network).toLowerCase();
    const itemIdStr = String(itemId);

    const nft = await nftModel.findOne({ network: net, itemId: itemIdStr }).lean();
    if (!nft) {
      return res.status(200).json({
        network: net,
        itemId: itemIdStr,
        lastPrice: 0,
        marketCap: 0,
        volume24h: "0",
        volumeTotal: "0",
        priceChangePercent: "0",
        priceHistory: [],
        tradesCount: 0,
      });
    }

    const now = new Date();
    let since = new Date(now);
    if (period === "24h") since.setHours(now.getHours() - 24);
    else if (period === "7d") since.setDate(now.getDate() - 7);
    else if (period === "30d") since.setDate(now.getDate() - 30);
    else since.setDate(now.getDate() - 7);

    const trades = await nftTradeModel
      .find({ network: net, itemId: itemIdStr, createdAt: { $gte: since } })
      .sort({ createdAt: 1 })
      .lean();

    const priceHistory = trades.map((t) => ({
      date: t.createdAt,
      time: t.createdAt,
      price: parseFloat(t.pricePerPiece),
      volume: parseFloat(t.totalAmount),
    }));
    if (priceHistory.length === 0 && nft.lastPrice) {
      priceHistory.push({
        date: nft.updatedAt || nft.createdAt,
        time: nft.updatedAt || nft.createdAt,
        price: parseFloat(nft.lastPrice),
        volume: 0,
      });
    }

    const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const volume24h = trades.filter((t) => new Date(t.createdAt) >= new Date(now.getTime() - 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const lastPrice = nft.lastPrice ? parseFloat(nft.lastPrice) : (nft.price ? parseFloat(nft.price) : 0);
    const marketCap = nft.marketCap ? parseFloat(nft.marketCap) : (lastPrice * Math.max(1, nft.pieces || 1));
    const firstPriceInPeriod = priceHistory.length > 0 ? priceHistory[0].price : lastPrice;
    const priceChangePercent = firstPriceInPeriod > 0
      ? (((lastPrice - firstPriceInPeriod) / firstPriceInPeriod) * 100).toFixed(2)
      : "0";

    return res.json({
      network: net,
      itemId: itemIdStr,
      lastPrice,
      marketCap,
      volume24h: volume24h.toFixed(6),
      volumeTotal: totalVolume.toFixed(6),
      priceChangePercent: String(priceChangePercent),
      priceHistory,
      tradesCount: trades.length,
    });
  } catch (error) {
    console.error("Error fetching NFT analytics:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** GET /pending-transfers/:network/:itemId */
export const getPendingTransfer = async (req, res) => {
  try {
    const { network, itemId } = req.params;
    const key = `${String(network).toLowerCase()}:${String(itemId)}`;
    const record = pendingTransfersStore.get(key);
    if (!record) return res.status(404).json({ error: "Pending transfer not found" });
    return res.json(record);
  } catch (error) {
    console.error("Error fetching pending transfer:", error);
    return res.status(500).json({ error: error.message });
  }
};

/** DELETE /pending-transfers/:network/:itemId */
export const deletePendingTransfer = async (req, res) => {
  try {
    const { network, itemId } = req.params;
    const key = `${String(network).toLowerCase()}:${String(itemId)}`;
    if (!pendingTransfersStore.has(key)) return res.status(404).json({ error: "Pending transfer not found" });
    pendingTransfersStore.delete(key);
    return res.json({ success: true, message: "Pending transfer removed" });
  } catch (error) {
    console.error("Error deleting pending transfer:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const createNft = async (req, res) => {
  const nftData = req.body;
  const { deployContract = false, network = 'sepolia', metadataURI } = req.body;

  try {
    // Optional: double-check if already exists to avoid duplicates
    const exists = await nftModel.findOne({
      itemId: nftData.itemId,
      network: nftData.network,
    });
    if (exists) {
      return res.status(409).json({ error: "NFT already exists" });
    }

    // If deployContract is requested, mint on blockchain
    if (deployContract && metadataURI) {
      console.log(`🔗 Smart contract deployment requested for NFT`);

      // Get collection contract from database
      const collection = await Collection.findOne({
        collectionId: nftData.collection,
        network: network
      });

      if (!collection || !collection.contractAddress) {
        return res.status(400).json({
          error: "Collection contract not found or not deployed"
        });
      }

      try {
        // Mint on blockchain
        const mintResult = await nftContractService.mintNFT({
          network,
          collectionAddress: collection.contractAddress,
          toAddress: nftData.owner,
          metadataURI
        });

        if (!mintResult.success) {
          return res.status(500).json({
            error: "NFT minting failed",
            details: mintResult.error
          });
        }

        // Update NFT data with blockchain info
        nftData.tokenId = mintResult.tokenId;
        nftData.isMinted = true;
        nftData.mintedAt = new Date();
        nftData.mintTxHash = mintResult.mintTx;
        nftData.deploymentStatus = 'deployed';
        nftData.contractAddress = collection.contractAddress;
        nftData.chainSpecificData = {
          [network]: {
            tokenId: mintResult.tokenId,
            deploymentTx: mintResult.mintTx,
            deploymentBlock: mintResult.mintBlock,
            status: 'deployed'
          }
        };

        console.log(`✅ NFT minted with token ID: ${mintResult.tokenId}`);
      } catch (error) {
        console.error(`❌ Smart contract minting failed: ${error.message}`);
        return res.status(500).json({
          error: "Smart contract minting failed",
          details: error.message
        });
      }
    }

    // Canonical owner/creator of the token (never overwritten by piece sales)
    if (!nftData.creator) nftData.creator = nftData.owner || nftData.seller;
    const nft = new nftModel(nftData);
    await nft.save();

    res.status(201).json({
      message: "NFT created successfully",
      nft,
      ...(deployContract && {
        deployed: true,
        tokenId: nft.tokenId,
        txHash: nft.mintTxHash
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1. Fetch all collections grouped by network and collection separately
export const fetchCollectionsGroupedByNetwork = async (req, res) => {
  const { network } = req.params; // assuming route like /collections/:network
  console.log("🚀 ~ fetchCollectionsGroupedByNetwork ~ network:", network);

  try {
    // Add network filtering in $match
    const collections = await nftModel.aggregate([
      {
        $match: {
      network,
      collection: { $exists: true, $ne: null },
      $expr: {
        $ne: [
          { $trim: { input: "$collection" } },
          ""
        ]
      }
    }
      },
      {
        $group: {
          _id: { network: "$network", collection: "$collection" },
          count: { $sum: 1 },
          firstNft: { $first: "$$ROOT" }, // get first NFT in each collection
        },
      },
      {
        $group: {
          _id: "$_id.network",
          collections: {
            $push: {
              collection: "$_id.collection",
              count: "$count",
              nft: "$firstNft", // include just first nft here
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          network: "$_id",
          collections: 1,
        },
      },
    ]);

    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Fetch all NFTs (collection or non-collection) filtered by network
export const fetchAllNftsByNetwork = async (req, res) => {
  const { network } = req.params;
  try {
    // Fetch regular NFTs that are currently listed
    const regularNfts = await nftModel.find({ network, currentlyListed: true });
    
    // Fetch lazy NFTs that are pending and available for sale
    // Note: Lazy NFTs might not have network field, so we fetch all pending ones
    // and filter by network if needed, or include all if network matching is not critical
    const lazyNfts = await LazyNFT.find({ 
      status: 'pending',
      enableStraightBuy: true,
      expiresAt: { $gt: new Date() } // Not expired
    }).populate('collection');
    
    // Convert lazy NFTs to regular NFT format
    const formattedLazyNfts = lazyNfts.map(lazyNFT => formatLazyNFTAsNFT(lazyNFT, network));
    
    // Combine both types of NFTs
    const allNfts = [...regularNfts, ...formattedLazyNfts];
    
    // Sort by creation date (newest first)
    allNfts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json(allNfts);
  } catch (error) {
    console.error('Error fetching NFTs by network:', error);
    res.status(500).json({ error: error.message });
  }
};

// 2b. Fetch ALL NFTs for Explore page (regardless of listing status)
export const fetchAllNftsByNetworkForExplore = async (req, res) => {
  const { network } = req.params;
  try {
    // Return ALL regular NFTs except delisted/flagged ones - admin can delist NFTs
    const regularNfts = await nftModel.find({ 
      network,
      adminStatus: { $ne: 'delisted' } // Exclude delisted NFTs
    });
    
    // Fetch all lazy NFTs (pending, redeemed, etc.) for explore page
    const lazyNfts = await LazyNFT.find({ 
      status: { $in: ['pending', 'redeemed', 'fully_redeemed'] }, // Include pending and redeemed
      expiresAt: { $gt: new Date() } // Not expired
    }).populate('collection');
    
    // Convert lazy NFTs to regular NFT format
    const formattedLazyNfts = lazyNfts.map(lazyNFT => formatLazyNFTAsNFT(lazyNFT, network));
    
    // Combine both types of NFTs
    const allNfts = [...regularNfts, ...formattedLazyNfts];
    
    // Sort by creation date (newest first)
    allNfts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json(allNfts);
  } catch (error) {
    console.error('Error fetching NFTs for explore:', error);
    res.status(500).json({ error: error.message });
  }
};

// 3. Fetch all NFTs under a particular collection filtered by network and collection name
export const fetchCollectionNfts = async (req, res) => {
  const { network, collection } = req.params;
  try {
    // Fetch regular NFTs in the collection
    const regularNfts = await nftModel.find({ network, collection });
    
    // Find the collection to get its ID
    const collectionDoc = await Collection.findOne({ 
      $or: [
        { _id: collection },
        { collectionId: collection },
        { name: collection, network }
      ]
    });
    
    // Fetch lazy NFTs in the same collection
    let lazyNfts = [];
    if (collectionDoc) {
      lazyNfts = await LazyNFT.find({ 
        collection: collectionDoc._id,
        status: { $in: ['pending', 'redeemed', 'fully_redeemed'] },
        expiresAt: { $gt: new Date() }
      }).populate('collection');
    }
    
    // Convert lazy NFTs to regular NFT format
    const formattedLazyNfts = lazyNfts.map(lazyNFT => formatLazyNFTAsNFT(lazyNFT, network));
    
    // Combine both types of NFTs
    const allNfts = [...regularNfts, ...formattedLazyNfts];
    
    // Sort by creation date (newest first)
    allNfts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json(allNfts);
  } catch (error) {
    console.error('Error fetching collection NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Fetch single NFT using network, collection name, itemId, and tokenId
export const fetchSingleNft = async (req, res) => {
  const { network, collection, itemId, tokenId } = req.params;
  try {
    const query = { network, itemId, tokenId };
    if (collection) query.collection = collection;

    const nft = await nftModel.findOne(query);
    if (!nft) return res.status(404).json({ message: "NFT not found" });

    res.json(nft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Fetch all NFTs with no collection (single NFTs), filtered by network
export const fetchSingleNfts = async (req, res) => {
  const { network } = req.params;
  try {
    const nfts = await nftModel.find({
      network,
      $or: [
        { collection: { $exists: false } },
        { collection: null },
        { collection: "" },
        { collection: { $regex: /^\s*$/ } }, // matches empty or only whitespace
      ],
    });
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 6. Edit single NFT (non-collection) price or other fields using network and itemId
export const editSingleNft = async (req, res) => {
  const { network, itemId } = req.params;
  const updateFields = req.body; // example: { price: "100" }

  try {
    // Ensure it is a single NFT (no collection)
    const nft = await nftModel.findOneAndUpdate(
      {
        network,
        itemId,
        $or: [
          { collection: { $exists: false } },
          { collection: "" },
          { collection: null },
        ],
      },
      updateFields,
      { new: true }
    );

    if (!nft)
      return res
        .status(404)
        .json({ message: "NFT not found or is part of a collection" });

    res.json(nft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Edit single NFT within a collection using network, itemId, collection name, and update fields
export const editNftInCollection = async (req, res) => {
  const { network, itemId, collection } = req.params;
  const updateFields = req.body;

  try {
    const nft = await nftModel.findOneAndUpdate(
      { network, itemId, collection },
      updateFields,
      { new: true }
    );

    if (!nft)
      return res
        .status(404)
        .json({ message: "NFT not found in the specified collection" });

    res.json(nft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Delete single NFT (non-collection) using network and itemId
export const deleteSingleNft = async (req, res) => {
  const { network, itemId } = req.params;

  try {
    const nft = await nftModel.findOneAndDelete({
      network,
      itemId,
      $or: [
        { collection: { $exists: false } },
        { collection: "" },
        { collection: null },
      ],
    });

    if (!nft)
      return res
        .status(404)
        .json({ message: "NFT not found or is part of a collection" });

    res.json({ message: "NFT deleted successfully", nft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Delete single NFT within a collection using network, itemId, and collection name
export const deleteNftInCollection = async (req, res) => {
  const { network, itemId, collection } = req.params;

  try {
    const nft = await nftModel.findOneAndDelete({
      network,
      itemId,
      collection,
    });

    if (!nft)
      return res
        .status(404)
        .json({ message: "NFT not found in the specified collection" });

    res.json({ message: "NFT deleted successfully", nft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ISSUE #4: Fetch user's owned NFTs by wallet address
export const fetchUserNFTs = async (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Find all regular NFTs owned by the wallet address
    const regularNFTs = await nftModel.find({
      owner: { $regex: `^${walletAddress}$`, $options: 'i' } // Case-insensitive match
    }).sort({ mintedAt: -1 }); // Sort by minted date, newest first

    // Find lazy NFTs:
    // 1. Lazy NFTs owned by user (redeemed and bought by user)
    // 2. Lazy NFTs created by user (pending, so they "own" them as creator)
    const lazyNFTsOwned = await LazyNFT.find({
      buyer: normalizedAddress,
      status: 'redeemed'
    }).populate('collection').sort({ redeemedAt: -1 });
    
    const lazyNFTsCreated = await LazyNFT.find({
      creator: normalizedAddress,
      status: 'pending'
    }).populate('collection').sort({ createdAt: -1 });

    // Combine lazy NFTs (avoid duplicates)
    const allLazyNFTs = [...lazyNFTsOwned];
    lazyNFTsCreated.forEach(lazyNFT => {
      if (!allLazyNFTs.find(existing => existing._id.toString() === lazyNFT._id.toString())) {
        allLazyNFTs.push(lazyNFT);
      }
    });

    // Convert lazy NFTs to regular NFT format
    const formattedLazyNFTs = allLazyNFTs.map(lazyNFT => 
      formatLazyNFTAsNFT(lazyNFT, lazyNFT.network || 'polygon')
    );

    // Include NFTs where user has piece holdings (collector owns pieces)
    const holdings = await pieceHoldingModel.find({
      wallet: normalizedAddress,
      pieces: { $gt: 0 },
    }).lean();
    const seen = new Set(regularNFTs.map((n) => `${n.network}:${n.itemId}`));
    for (const h of holdings) {
      if (seen.has(`${h.network}:${h.itemId}`)) continue;
      const nft = await nftModel.findOne({ network: h.network, itemId: h.itemId }).lean();
      if (nft) {
        seen.add(`${h.network}:${h.itemId}`);
        regularNFTs.push({ ...nft, userPieces: h.pieces });
      }
    }

    // Combine both types
    const allNFTs = [...regularNFTs, ...formattedLazyNFTs];

    // Sort by creation/mint date (newest first)
    allNFTs.sort((a, b) => {
      const dateA = new Date(a.mintedAt || a.createdAt || 0);
      const dateB = new Date(b.mintedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      walletAddress,
      count: allNFTs.length,
      nfts: allNFTs,
    });
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fetch user's NFTs by network
export const fetchUserNFTsByNetwork = async (req, res) => {
  const { walletAddress, network } = req.params;

  if (!walletAddress || !network) {
    return res.status(400).json({ error: "Wallet address and network are required" });
  }

  try {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Find regular NFTs owned by the wallet address on this network
    const regularNFTs = await nftModel.find({
      owner: { $regex: `^${walletAddress}$`, $options: 'i' },
      network
    }).sort({ mintedAt: -1 });

    // Find lazy NFTs owned or created by user
    const lazyNFTsOwned = await LazyNFT.find({
      buyer: normalizedAddress,
      status: 'redeemed'
    }).populate('collection').sort({ redeemedAt: -1 });
    
    const lazyNFTsCreated = await LazyNFT.find({
      creator: normalizedAddress,
      status: 'pending'
    }).populate('collection').sort({ createdAt: -1 });

    // Combine lazy NFTs (avoid duplicates)
    const allLazyNFTs = [...lazyNFTsOwned];
    lazyNFTsCreated.forEach(lazyNFT => {
      if (!allLazyNFTs.find(existing => existing._id.toString() === lazyNFT._id.toString())) {
        allLazyNFTs.push(lazyNFT);
      }
    });

    // Convert lazy NFTs to regular NFT format
    const formattedLazyNFTs = allLazyNFTs.map(lazyNFT => 
      formatLazyNFTAsNFT(lazyNFT, network)
    );

    // Combine both types
    const allNFTs = [...regularNFTs, ...formattedLazyNFTs];

    // Sort by creation/mint date (newest first)
    allNFTs.sort((a, b) => {
      const dateA = new Date(a.mintedAt || a.createdAt || 0);
      const dateB = new Date(b.mintedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      walletAddress,
      network,
      count: allNFTs.length,
      nfts: allNFTs,
    });
  } catch (error) {
    console.error('Error fetching user NFTs by network:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fetch user's minted NFTs by wallet address
export const fetchUserMintedNFTs = async (req, res) => {
  const { walletAddress } = req.params;

  console.log('fetchUserMintedNFTs called with walletAddress:', walletAddress);

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Find all regular minted NFTs owned by the wallet address
    const regularMintedNFTs = await nftModel.find({
      owner: { $regex: `^${walletAddress}$`, $options: 'i' },
      isMinted: true
    }).sort({ mintedAt: -1 }); // Sort by minted date, newest first

    // Find lazy NFTs that were redeemed (minted) by this user
    const lazyMintedNFTs = await LazyNFT.find({
      buyer: normalizedAddress,
      status: 'redeemed',
      tokenId: { $ne: null } // Only redeemed ones with tokenId
    }).populate('collection').sort({ redeemedAt: -1 });

    // Convert lazy NFTs to regular NFT format
    const formattedLazyNFTs = lazyMintedNFTs.map(lazyNFT => 
      formatLazyNFTAsNFT(lazyNFT, lazyNFT.network || 'polygon')
    );

    // Combine both types
    const allMintedNFTs = [...regularMintedNFTs, ...formattedLazyNFTs];

    // Sort by mint date (newest first)
    allMintedNFTs.sort((a, b) => {
      const dateA = new Date(a.mintedAt || a.redeemedAt || a.createdAt || 0);
      const dateB = new Date(b.mintedAt || b.redeemedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    console.log('Found minted NFTs for', walletAddress, ':', allMintedNFTs.length);
    console.log('Regular NFTs:', regularMintedNFTs.length, 'Lazy NFTs:', lazyMintedNFTs.length);

    res.json({
      success: true,
      walletAddress,
      count: allMintedNFTs.length,
      nfts: allMintedNFTs,
    });
  } catch (error) {
    console.error('Error fetching user minted NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};
