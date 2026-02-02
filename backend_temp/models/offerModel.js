import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  offerId: {
    type: String,
    unique: true,
    required: true
  },
  maker: {
    type: String,
    required: true,
    lowercase: true,
    description: "User making the offer (buyer)"
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
  nftOwner: {
    type: String,
    lowercase: true,
    description: "Current owner of the NFT"
  },
  offerPrice: {
    type: String,
    required: true,
    description: "Offered price in ETH/SOL"
  },
  offerAmount: {
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
    enum: ['active', 'accepted', 'rejected', 'cancelled', 'expired'],
    default: 'active'
  },
  message: String,
  contractOfferId: { type: String, description: 'On-chain offer ID from Offer.sol' },
  onChainOfferId: { type: String, description: 'Alias for contractOfferId' },
  expiresAt: {
    type: Date,
    description: "When the offer expires (7 days from creation by default)"
  },
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// TTL index to auto-expire offers
offerSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OfferModel = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

export default OfferModel;
