import mongoose from "mongoose";
const Schema = mongoose.Schema;

// NFT schema definition
const nftSchema = new Schema(

  {
     collection: {
      type: String, // The name or ID of the NFT collection
      required: false,
    },
    network: {
      type: String, // Blockchain network (e.g., Ethereum, Polygon, Solana)
      required: true,
    },
    itemId: {
      type: String,
      required: true,
      unique: true,
    },
    nftContract: {
      type: String,
      required: true,
    },
    tokenId: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    seller: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    currentlyListed: {
      type: Boolean,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    properties: {
      type: Object,
      required: true,
    },
    royalties: {
      type: Object,
    },
  },
  { timestamps: true }
);

// Model
export const nftModel = mongoose.model("NFT", nftSchema);

// Utility functions
export const getNfts = () => nftModel.find();
export const getNftByItemId = (itemId) => nftModel.findOne({ itemId });
export const createNft = async (values) => {
  const nft = new nftModel(values);
  await nft.save();
  return nft.toObject();
};
export const deleteNftByItemId = (itemId) =>
  nftModel.findOneAndDelete({ itemId });

export const updateNftByItemId = (itemId, values, newOption = true) =>
  nftModel.findOneAndUpdate({ itemId }, values, { new: newOption });
