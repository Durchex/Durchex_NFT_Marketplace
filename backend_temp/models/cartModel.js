import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Cart Schema definition
const cartSchema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    nftId: {
      type: Number,
      required: true,
    },
    contractAddress: {
      type: String,
      required: true, // The contract address will help track NFTs across different contracts
    },
    quantity: {
      type: Number,
      default: 1,
    },
    // Additional NFT metadata for display
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      default: "0",
    },
    tokenId: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed, // Flexible metadata object
    },
  },
  { timestamps: true }
);

// Cart model
export const cartModel = mongoose.model("Cart", cartSchema);

// Helper functions
export const getCartByWalletAddress = (walletAddress) =>
  cartModel.find({ walletAddress });

export const addToCart = async (values) => {
  const cartItem = new cartModel(values);
  await cartItem.save();
  return cartItem.toObject();
};

export const removeFromCart = (walletAddress, nftId, contractAddress) =>
  cartModel.findOneAndDelete({ walletAddress, nftId, contractAddress });

export const clearCart = (walletAddress) =>
  cartModel.deleteMany({ walletAddress });
