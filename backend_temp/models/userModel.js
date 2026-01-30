import mongoose from "mongoose";
import crypto from "crypto";

const Schema = mongoose.Schema;

// User schema definition
const userSchema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    image: {
      type: String,
    },
    coverPhoto: {
      type: String,
      default: null
    },
    socialLinks: [
      {
        type: String,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
    },
    favoriteCreators: [
      {
        type: String, // storing usernames
      },
    ],
    gameCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },
    gameCodeRedeemed: {
      type: Boolean,
      default: false,
    },
    gameBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Model
export const nftUserModel = mongoose.model("NFTUser", userSchema);

function generateGameCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function ensureUniqueGameCode() {
  let code;
  let exists = true;
  while (exists) {
    code = generateGameCode();
    const found = await nftUserModel.findOne({ gameCode: code });
    exists = !!found;
  }
  return code;
}

// Utility functions
export const getUsers = () => nftUserModel.find();
export const getUserByWalletAddress = (walletAddress) => nftUserModel.findOne({ walletAddress: walletAddress?.toLowerCase?.() || walletAddress });
export const getUserByGameCode = (code) => nftUserModel.findOne({ gameCode: (code || "").trim().toUpperCase() });

export const createUser = async (values) => {
  if (!values.gameCode) {
    values.gameCode = await ensureUniqueGameCode();
    values.gameCodeRedeemed = false;
  }
  const user = new nftUserModel(values);
  await user.save();
  return user.toObject();
};
export const deleteUserByWalletAddress = (walletAddress) => 
    nftUserModel.findOneAndDelete({ walletAddress });

export const updateUserByWalletAddress = (walletAddress, values, newOption = true) =>
    nftUserModel.findOneAndUpdate({ walletAddress: (walletAddress || "").toLowerCase() }, values, { new: newOption });

export { ensureUniqueGameCode };
