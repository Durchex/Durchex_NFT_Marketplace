import express from "express";
import {
  getMarketplaceSettingsByNetwork,
  getAllMarketplaceSettings,
  upsertMarketplaceSettings,
} from "../controllers/marketplaceSettingsController.js";

const router = express.Router();

router.get("/", getAllMarketplaceSettings);
router.get("/:network", getMarketplaceSettingsByNetwork);
router.put("/:network", upsertMarketplaceSettings);

export default router;
