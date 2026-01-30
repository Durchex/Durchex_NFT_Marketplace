import {
  getByNetwork,
  getAll,
  upsert,
} from "../models/marketplaceSettingsModel.js";

/**
 * Get marketplace settings for a single network.
 */
export const getMarketplaceSettingsByNetwork = async (req, res) => {
  try {
    const { network } = req.params;
    if (!network) {
      return res.status(400).json({ error: "Network is required" });
    }
    const doc = await getByNetwork(network);
    if (!doc) {
      return res.json({
        network: network.toLowerCase(),
        saleFeeBps: 250,
        treasuryWallet: "",
        updatedAt: null,
      });
    }
    res.json({
      network: doc.network,
      saleFeeBps: doc.saleFeeBps,
      treasuryWallet: doc.treasuryWallet || "",
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error("Error getting marketplace settings:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get marketplace settings for all networks.
 */
export const getAllMarketplaceSettings = async (req, res) => {
  try {
    const docs = await getAll();
    res.json(docs || []);
  } catch (error) {
    console.error("Error getting all marketplace settings:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upsert marketplace settings for a network (sale fee % and treasury wallet).
 */
export const upsertMarketplaceSettings = async (req, res) => {
  try {
    const { network } = req.params;
    const { saleFeeBps, treasuryWallet, updatedBy } = req.body;
    if (!network) {
      return res.status(400).json({ error: "Network is required" });
    }
    const net = String(network).toLowerCase().trim();
    if (saleFeeBps != null && (saleFeeBps < 0 || saleFeeBps > 1000)) {
      return res.status(400).json({ error: "saleFeeBps must be between 0 and 1000" });
    }
    const doc = await upsert(net, {
      saleFeeBps,
      treasuryWallet,
      updatedBy,
    });
    res.json({
      network: doc.network,
      saleFeeBps: doc.saleFeeBps,
      treasuryWallet: doc.treasuryWallet || "",
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error("Error upserting marketplace settings:", error);
    res.status(500).json({ error: error.message });
  }
};
