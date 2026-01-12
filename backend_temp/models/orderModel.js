import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  buyer: {
    type: String,
    required: true,
    lowercase: true,
    description: "Buyer's wallet address"
  },
  seller: {
    type: String,
    required: true,
    lowercase: true,
    description: "Seller's wallet address"
  },
  nftId: {
    type: Number,
    required: true
  },
  contractAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  nftName: String,
  nftImage: String,
  collectionName: String,
  price: {
    type: String,
    required: true,
    description: "Price in ETH/SOL/native currency"
  },
  amount: {
    type: String,
    required: true,
    description: "Exact amount in wei/lamports"
  },
  currency: {
    type: String,
    enum: ['ETH', 'SOL', 'MATIC', 'BNB', 'ARB', 'BASE'],
    required: true
  },
  network: {
    type: String,
    enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'solana'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionHash: String,
  paymentMethod: {
    type: String,
    enum: ['crypto', 'card', 'bank_transfer'],
    default: 'crypto'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  expiresAt: {
    type: Date,
    description: "Order expiration time (24 hours from creation)"
  }
}, {
  timestamps: true
});

// TTL index to auto-delete expired orders after 24 hours
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default OrderModel;
