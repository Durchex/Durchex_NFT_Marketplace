// backend_temp/models/lazyNFTModel.js
import mongoose from 'mongoose';

const lazyNFTSchema = new mongoose.Schema(
    {
        // Creator information
        creator: {
            type: String,
            required: true,
            lowercase: true,
            index: true,
        },

        // NFT Metadata
        ipfsURI: {
            type: String,
            required: true,
            index: true,
        },

        name: {
            type: String,
            default: '',
        },

        description: {
            type: String,
            default: '',
        },

        imageURI: {
            type: String,
            default: '',
        },

        // Signing & Verification
        signature: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        messageHash: {
            type: String,
            required: true,
        },

        royaltyPercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 50,
            default: 10,
        },

        nonce: {
            type: Number,
            required: true,
        },

        // Status tracking
        status: {
            type: String,
            enum: ['pending', 'redeemed', 'expired', 'cancelled'],
            default: 'pending',
            index: true,
        },

        // After redemption
        tokenId: {
            type: String,
            default: null,
            index: true,
        },

        buyer: {
            type: String,
            lowercase: true,
            default: null,
            index: true,
        },

        transactionHash: {
            type: String,
            default: null,
            index: true,
        },

        salePrice: {
            type: String, // Store as string to preserve precision (wei)
            default: null,
        },

        // Stock/Pieces management
        pieces: {
            type: Number,
            default: 1,
            min: 1,
        },

        remainingPieces: {
            type: Number,
            default: 1,
            min: 0,
        },

        // Pricing and metadata
        price: {
            type: String, // Price in ETH or native token
            default: null,
        },

        // Optional floor price (starting price / lowest listing)
        floorPrice: {
            type: String,
            default: null,
        },

        category: {
            type: String,
            default: '',
        },

        // Chain/network (e.g. polygon, ethereum, arbitrum, bsc, base)
        network: {
            type: String,
            default: 'polygon',
            lowercase: true,
            index: true,
        },

        collection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Collection',
            default: null,
        },

        // Minting control
        enableStraightBuy: {
            type: Boolean,
            default: true,
        },

        // Metadata for discovery
        attributes: [
            {
                trait_type: String,
                value: String,
            },
        ],

        // Tracking
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            index: true,
        },

        redeemedAt: {
            type: Date,
            default: null,
        },

        tags: [String],

        views: {
            type: Number,
            default: 0,
        },

        likes: [
            {
                type: String,
                lowercase: true,
            },
        ],

        // Search indexing
        searchText: {
            type: String,
            default: '',
            text: true,
        },
    },
    {
        timestamps: true,
        collection: 'lazy_nfts',
    }
);

// Create indexes
lazyNFTSchema.index({ creator: 1, status: 1 });
lazyNFTSchema.index({ status: 1, createdAt: -1 });
lazyNFTSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
lazyNFTSchema.index({ 'attributes.trait_type': 1, 'attributes.value': 1 });

// Pre-save middleware
lazyNFTSchema.pre('save', function (next) {
    // Generate search text
    this.searchText = `${this.name} ${this.description} ${this.creator}`.toLowerCase();
    next();
});

// Instance methods
lazyNFTSchema.methods.isExpired = function () {
    return this.expiresAt < new Date();
};

lazyNFTSchema.methods.isRedeemed = function () {
    return this.status === 'redeemed' && this.tokenId;
};

lazyNFTSchema.methods.canBeRedeemed = function () {
    return this.status === 'pending' && !this.isExpired();
};

lazyNFTSchema.methods.incrementView = async function () {
    this.views += 1;
    await this.save();
};

lazyNFTSchema.methods.addLike = async function (address) {
    if (!this.likes.includes(address.toLowerCase())) {
        this.likes.push(address.toLowerCase());
        await this.save();
    }
};

lazyNFTSchema.methods.removeLike = async function (address) {
    this.likes = this.likes.filter((like) => like !== address.toLowerCase());
    await this.save();
};

// Static methods
lazyNFTSchema.statics.getByCreator = function (creatorAddress, status = 'pending') {
    return this.find({
        creator: creatorAddress.toLowerCase(),
        status: status,
    }).sort({ createdAt: -1 });
};

lazyNFTSchema.statics.getAvailable = function (page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

lazyNFTSchema.statics.countAvailable = function () {
    return this.countDocuments({ status: 'pending' });
};

lazyNFTSchema.statics.getBySignature = function (signature) {
    return this.findOne({ signature });
};

lazyNFTSchema.statics.cleanupExpired = async function () {
    const result = await this.deleteMany({
        status: 'pending',
        expiresAt: { $lt: new Date() },
    });
    return result;
};

lazyNFTSchema.statics.getStats = async function () {
    const [total, pending, redeemed] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ status: 'pending' }),
        this.countDocuments({ status: 'redeemed' }),
    ]);

    return {
        total,
        pending,
        redeemed,
        conversionRate: total > 0 ? (redeemed / total) * 100 : 0,
    };
};

export default mongoose.model('LazyNFT', lazyNFTSchema);
