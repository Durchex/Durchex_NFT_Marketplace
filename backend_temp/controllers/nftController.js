import Collection from "../models/collectionModel.js";
import { nftModel } from "../models/nftModel.js";

// Create a new NFT Collection
export const createCollection = async (req, res) => {
  try {
    const data = req.body;
    // Basic validation (customize as needed)
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
      creatorWallet: data.creatorWallet.toLowerCase()
    };
    
    const collection = new Collection(collectionData);
    await collection.save();
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    console.log('🔍 getCollection called with collectionId:', collectionId);
    
    // Try to find by custom collectionId first, then by MongoDB _id
    let collection = await Collection.findOne({ collectionId });
    console.log('📊 findOne result:', collection ? `Found: ${collection.name}` : 'Not found');
    
    if (!collection) {
      collection = await Collection.findById(collectionId);
      console.log('📊 findById result:', collection ? `Found: ${collection.name}` : 'Not found');
    }
    
    if (!collection) {
      console.log('❌ Collection not found for:', collectionId);
      return res.status(404).json({ error: "Collection not found" });
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
    
    // Query NFTs where the collection field matches the collectionId
    const nfts = await nftModel.find({
      collection: collectionId
    }).sort({ createdAt: -1 });
    
    res.status(200).json(nfts);
  } catch (error) {
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

export const createNft = async (req, res) => {
  const nftData = req.body;

  // Optional: Validate required fields here before saving

  try {
    // Optional: double-check if already exists to avoid duplicates
    const exists = await nftModel.findOne({
      itemId: nftData.itemId,
      network: nftData.network,
    });
    if (exists) {
      return res.status(409).json({ error: "NFT already exists" });
    }

    const nft = new nftModel(nftData);
    await nft.save();

    res.status(201).json(nft);
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
    // Only return NFTs that are currently listed (admin has approved for sale)
    const nfts = await nftModel.find({ network, currentlyListed: true });
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2b. Fetch ALL NFTs for Explore page (regardless of listing status)
export const fetchAllNftsByNetworkForExplore = async (req, res) => {
  const { network } = req.params;
  try {
    // Return ALL NFTs except delisted/flagged ones - admin can delist NFTs
    const nfts = await nftModel.find({ 
      network,
      adminStatus: { $ne: 'delisted' } // Exclude delisted NFTs
    });
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Fetch all NFTs under a particular collection filtered by network and collection name
export const fetchCollectionNfts = async (req, res) => {
  const { network, collection } = req.params;
  try {
    const nfts = await nftModel.find({ network, collection });
    res.json(nfts);
  } catch (error) {
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
    // Find all NFTs owned by the wallet address (normalized to lowercase)
    const userNFTs = await nftModel.find({
      owner: { $regex: `^${walletAddress}$`, $options: 'i' } // Case-insensitive match
    }).sort({ mintedAt: -1 }); // Sort by minted date, newest first

    res.json({
      success: true,
      walletAddress,
      count: userNFTs.length,
      nfts: userNFTs,
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
    const userNFTs = await nftModel.find({
      owner: { $regex: `^${walletAddress}$`, $options: 'i' },
      network
    }).sort({ mintedAt: -1 });

    res.json({
      success: true,
      walletAddress,
      network,
      count: userNFTs.length,
      nfts: userNFTs,
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
    // Find all minted NFTs owned by the wallet address (normalized to lowercase)
    const userMintedNFTs = await nftModel.find({
      owner: { $regex: `^${walletAddress}$`, $options: 'i' },
      isMinted: true
    }).sort({ mintedAt: -1 }); // Sort by minted date, newest first

    console.log('Found minted NFTs for', walletAddress, ':', userMintedNFTs.length);
    console.log('NFTs details:', userMintedNFTs.map(nft => ({ name: nft.name, tokenId: nft.tokenId, isMinted: nft.isMinted, owner: nft.owner })));

    res.json({
      success: true,
      walletAddress,
      count: userMintedNFTs.length,
      nfts: userMintedNFTs,
    });
  } catch (error) {
    console.error('Error fetching user minted NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};
