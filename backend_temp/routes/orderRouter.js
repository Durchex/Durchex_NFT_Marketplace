import express from "express";
import {
  createOrder,
  getOrderById,
  getUserOrders,
  getSellerOrders,
  confirmPayment,
  cancelOrder,
  getNFTOrders,
  updateOrderStatus
} from "../controllers/orderController.js";

const router = express.Router();

// Create new order
router.post("/", createOrder);

// Get order by ID
router.get("/order/:orderId", getOrderById);

// Get user's orders (as buyer)
router.get("/buyer/:walletAddress", getUserOrders);

// Get seller's orders
router.get("/seller/:walletAddress", getSellerOrders);

// Get all orders for a specific NFT
router.get("/nft/:contractAddress/:nftId", getNFTOrders);

// Confirm payment
router.post("/confirm-payment", confirmPayment);

// Update order status
router.patch("/:orderId/status", updateOrderStatus);

// Cancel order
router.post("/cancel", cancelOrder);

export default router;
