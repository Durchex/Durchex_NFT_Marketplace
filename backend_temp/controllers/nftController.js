import { nftModel } from "../models/nftModel.js"; // adjust path accordingly

export const checkNftExists = async (req, res) => {
  const { itemId, network } = req.body;

  if (!itemId || !network) {
    return res.status(400).json({ error: "itemId and network are required" });
  }

  try {
    const nft = await nftModel.findOne({ itemId, network });
    res.json({ exists: !!nft });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const nfts = await nftModel.find({ network });
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
