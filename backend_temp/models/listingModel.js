import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  listingId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  seller: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  nftContract: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  tokenId: {
    type: String,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  price: {
    type: String, // Store as string to handle large numbers
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null // null for fixed price listings
  },
  paymentToken: {
    type: String,
    default: '0x0000000000000000000000000000000000000000', // ETH
    lowercase: true
  },
  isERC1155: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  signature: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    required: true
  },
  network: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  marketplaceContract: {
    type: String,
    required: true,
    lowercase: true
  },
  // Link to the parent NFT document so we can compute floor price across all
  // pieces of a multi-piece lazy mint NFT (each piece has its own tokenId).
  parentNftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT',
    index: true,
    default: null
  },
  listingType: {
    type: String,
    enum: ['fixed', 'auction'],
    default: 'fixed',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
listingSchema.index({ nftContract: 1, tokenId: 1, active: 1 });
listingSchema.index({ seller: 1, active: 1 });
listingSchema.index({ network: 1, active: 1 });
listingSchema.index({ endTime: 1, active: 1 });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
