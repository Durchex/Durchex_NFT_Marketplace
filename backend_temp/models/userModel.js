import mongoose from "mongoose";
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
  },
  { timestamps: true }
);

// Model
export const nftUserModel = mongoose.model("NFTUser", userSchema);

// Utility functions
export const getUsers = () => nftUserModel.find();
export const getUserByWalletAddress = (walletAddress) => nftUserModel.findOne({ walletAddress });
export const createUser = async (values) => {
    const user = new nftUserModel(values);
    await user.save();
    return user.toObject();
};
export const deleteUserByWalletAddress = (walletAddress) => 
    nftUserModel.findOneAndDelete({ walletAddress });

export const updateUserByWalletAddress = (walletAddress, values, newOption = true) =>
    nftUserModel.findOneAndUpdate({ walletAddress }, values, { new: newOption });
