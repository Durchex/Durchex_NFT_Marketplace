import OrderModel from "../models/orderModel.js";
import NFTModel from "../models/nftModel.js";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { 
      buyer, 
      seller, 
      nftId, 
      contractAddress, 
      price, 
      amount,
      currency,
      network,
      nftName,
      nftImage,
      collectionName,
      paymentMethod = 'crypto'
    } = req.body;

    // Validate required fields
    if (!buyer || !seller || !nftId || !contractAddress || !price || !amount || !currency || !network) {
      return res.status(400).json({ 
        error: "Missing required fields" 
      });
    }

    // Create order ID
    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const order = new OrderModel({
      orderId,
      buyer: buyer.toLowerCase(),
      seller: seller.toLowerCase(),
      nftId,
      contractAddress: contractAddress.toLowerCase(),
      price,
      amount,
      currency,
      network,
      nftName,
      nftImage,
      collectionName,
      paymentMethod,
      status: 'pending',
      expiresAt
    });

    await order.save();

    res.status(201).json({
      success: true,
      order,
      message: "Order created successfully"
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's orders (as buyer)
export const getUserOrders = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const orders = await OrderModel.find({ 
      buyer: walletAddress.toLowerCase() 
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seller's orders (as seller)
export const getSellerOrders = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const orders = await OrderModel.find({ 
      seller: walletAddress.toLowerCase() 
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Confirm payment and complete order
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, transactionHash, status = 'completed' } = req.body;

    if (!orderId || !transactionHash) {
      return res.status(400).json({ 
        error: "orderId and transactionHash are required" 
      });
    }

    const order = await OrderModel.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update order with transaction details
    order.status = status;
    order.transactionHash = transactionHash;
    if (status === 'completed') {
      order.completedAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
      message: "Payment confirmed"
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const order = await OrderModel.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === 'completed' || order.status === 'confirmed') {
      return res.status(400).json({ 
        error: "Cannot cancel a confirmed or completed order" 
      });
    }

    order.status = 'cancelled';
    order.notes = reason || 'User cancelled order';

    await order.save();

    res.status(200).json({
      success: true,
      order,
      message: "Order cancelled successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all orders for a specific NFT
export const getNFTOrders = async (req, res) => {
  try {
    const { contractAddress, nftId } = req.params;
    
    const orders = await OrderModel.find({
      contractAddress: contractAddress.toLowerCase(),
      nftId: Number(nftId)
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, transactionHash } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ 
        error: "orderId and status are required" 
      });
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const order = await OrderModel.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    if (transactionHash) {
      order.transactionHash = transactionHash;
    }
    if (status === 'completed') {
      order.completedAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: error.message });
  }
};
