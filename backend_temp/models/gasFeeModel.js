import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Gas Fee Regulation schema
const gasFeeSchema = new Schema(
  {
    network: {
      type: String,
      required: true,
      unique: true,
      enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'tezos', 'hyperliquid'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    minGasPrice: {
      type: String, // in wei
      default: '0',
    },
    maxGasPrice: {
      type: String, // in wei
      default: '0',
    },
    defaultGasPrice: {
      type: String, // in wei
      default: '0',
    },
    gasLimit: {
      type: Number,
      default: 500000,
    },
    multiplier: {
      type: Number,
      default: 1.0, // Multiplier for gas price (e.g., 1.2 = 20% increase)
    },
    regulations: {
      enabled: {
        type: Boolean,
        default: true,
      },
      enforceMin: {
        type: Boolean,
        default: false,
      },
      enforceMax: {
        type: Boolean,
        default: false,
      },
      autoAdjust: {
        type: Boolean,
        default: false,
      },
    },
    updatedBy: {
      type: String, // Admin wallet address or ID
    },
  },
  { timestamps: true }
);

// Model
export const gasFeeModel = mongoose.model("GasFee", gasFeeSchema);

// Utility functions
export const getGasFeeByNetwork = (network) => gasFeeModel.findOne({ network });
export const getAllGasFees = () => gasFeeModel.find();
export const updateGasFee = async (network, values) => {
  return gasFeeModel.findOneAndUpdate(
    { network },
    { ...values, updatedAt: new Date() },
    { new: true, upsert: true }
  );
};
export const createGasFee = async (values) => {
  const gasFee = new gasFeeModel(values);
  await gasFee.save();
  return gasFee.toObject();
};
