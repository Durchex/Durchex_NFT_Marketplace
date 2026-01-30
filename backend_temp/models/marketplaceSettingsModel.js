import mongoose from "mongoose";

const Schema = mongoose.Schema;

/**
 * Per-network marketplace settings: sale fee % and treasury wallet.
 * Used as stored config; on-chain contracts remain source of truth for actual fee splits.
 */
const marketplaceSettingsSchema = new Schema(
  {
    network: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    saleFeeBps: {
      type: Number,
      default: 250,
      min: 0,
      max: 1000,
      comment: "Sale fee in basis points (e.g. 250 = 2.5%)",
    },
    treasuryWallet: {
      type: String,
      default: "",
      trim: true,
      comment: "Marketplace treasury wallet address (0x...) for this network",
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const MarketplaceSettingsModel = mongoose.model(
  "MarketplaceSettings",
  marketplaceSettingsSchema
);

export const getByNetwork = (network) =>
  MarketplaceSettingsModel.findOne({
    network: String(network).toLowerCase().trim(),
  });

export const getAll = () => MarketplaceSettingsModel.find().lean();

export const upsert = async (network, { saleFeeBps, treasuryWallet, updatedBy }) => {
  const net = String(network).toLowerCase().trim();
  return MarketplaceSettingsModel.findOneAndUpdate(
    { network: net },
    {
      saleFeeBps: saleFeeBps != null ? saleFeeBps : 250,
      treasuryWallet: treasuryWallet != null ? String(treasuryWallet).trim() : "",
      updatedBy: updatedBy || undefined,
      updatedAt: new Date(),
    },
    { new: true, upsert: true, runValidators: true }
  );
};
