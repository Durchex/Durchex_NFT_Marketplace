import { NFTLike, CollectionLike, CreatorFollow, NFTView, CollectionView, NFTShare, EngagementStats } from '../models/engagementModel.js';

// ==================== LIKES ====================

// Like an NFT
export const likeNFT = async (req, res) => {
  try {
    const { nftId, itemId, contractAddress, network, userWallet } = req.body;

    if (!nftId || !itemId || !contractAddress || !network || !userWallet) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Try to create like (will fail if duplicate)
    const like = new NFTLike({
      nftId,
      itemId,
      contractAddress: contractAddress.toLowerCase(),
      network,
      userWallet: userWallet.toLowerCase()
    });

    await like.save();

    // Update stats
    await updateEngagementStats('nft', nftId, network, { increment: 'likeCount' });

    res.status(201).json({
      success: true,
      message: 'NFT liked successfully',
      liked: true
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Already liked this NFT'
      });
    }
    console.error('Error liking NFT:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking NFT',
      error: error.message
    });
  }
};

// Unlike an NFT
export const unlikeNFT = async (req, res) => {
  try {
    const { nftId, network, userWallet } = req.body;

    const deleted = await NFTLike.findOneAndDelete({
      nftId,
      userWallet: userWallet.toLowerCase()
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Like not found'
      });
    }

    // Update stats
    await updateEngagementStats('nft', nftId, network, { decrement: 'likeCount' });

    res.status(200).json({
      success: true,
      message: 'NFT unliked successfully',
      liked: false
    });
  } catch (error) {
    console.error('Error unliking NFT:', error);
    res.status(500).json({
      success: false,
      message: 'Error unliking NFT',
      error: error.message
    });
  }
};

// Check if user liked an NFT
export const isNFTLiked = async (req, res) => {
  try {
    const { nftId, userWallet } = req.query;

    const like = await NFTLike.findOne({
      nftId,
      userWallet: userWallet.toLowerCase()
    });

    res.status(200).json({
      success: true,
      liked: !!like
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking like status',
      error: error.message
    });
  }
};

// Like a Collection
export const likeCollection = async (req, res) => {
  try {
    const { collectionId, collectionName, network, userWallet } = req.body;

    const like = new CollectionLike({
      collectionId,
      collectionName,
      network,
      userWallet: userWallet.toLowerCase()
    });

    await like.save();
    await updateEngagementStats('collection', collectionId, network, { increment: 'likeCount' });

    res.status(201).json({
      success: true,
      message: 'Collection liked successfully',
      liked: true
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Already liked this collection'
      });
    }
    console.error('Error liking collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking collection',
      error: error.message
    });
  }
};

// Unlike a Collection
export const unlikeCollection = async (req, res) => {
  try {
    const { collectionId, network, userWallet } = req.body;

    const deleted = await CollectionLike.findOneAndDelete({
      collectionId,
      userWallet: userWallet.toLowerCase()
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Like not found'
      });
    }

    await updateEngagementStats('collection', collectionId, network, { decrement: 'likeCount' });

    res.status(200).json({
      success: true,
      message: 'Collection unliked successfully',
      liked: false
    });
  } catch (error) {
    console.error('Error unliking collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error unliking collection',
      error: error.message
    });
  }
};

// ==================== FOLLOWS ====================

// Follow a Creator
export const followCreator = async (req, res) => {
  try {
    const { creatorWallet, followerWallet, followerName } = req.body;

    if (!creatorWallet || !followerWallet) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (creatorWallet.toLowerCase() === followerWallet.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const follow = new CreatorFollow({
      creatorWallet: creatorWallet.toLowerCase(),
      followerWallet: followerWallet.toLowerCase(),
      followerName: followerName || ''
    });

    await follow.save();
    await updateEngagementStats('creator', creatorWallet.toLowerCase(), null, { increment: 'followCount' });

    res.status(201).json({
      success: true,
      message: 'Creator followed successfully',
      following: true
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Already following this creator'
      });
    }
    console.error('Error following creator:', error);
    res.status(500).json({
      success: false,
      message: 'Error following creator',
      error: error.message
    });
  }
};

// Unfollow a Creator
export const unfollowCreator = async (req, res) => {
  try {
    const { creatorWallet, followerWallet } = req.body;

    const deleted = await CreatorFollow.findOneAndDelete({
      creatorWallet: creatorWallet.toLowerCase(),
      followerWallet: followerWallet.toLowerCase()
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Follow relationship not found'
      });
    }

    await updateEngagementStats('creator', creatorWallet.toLowerCase(), null, { decrement: 'followCount' });

    res.status(200).json({
      success: true,
      message: 'Creator unfollowed successfully',
      following: false
    });
  } catch (error) {
    console.error('Error unfollowing creator:', error);
    res.status(500).json({
      success: false,
      message: 'Error unfollowing creator',
      error: error.message
    });
  }
};

// Check if user follows a creator
export const isFollowingCreator = async (req, res) => {
  try {
    const { creatorWallet, followerWallet } = req.query;

    const follow = await CreatorFollow.findOne({
      creatorWallet: creatorWallet.toLowerCase(),
      followerWallet: followerWallet.toLowerCase()
    });

    res.status(200).json({
      success: true,
      following: !!follow
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking follow status',
      error: error.message
    });
  }
};

// Get creator followers
export const getCreatorFollowers = async (req, res) => {
  try {
    const { creatorWallet, limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const followers = await CreatorFollow.find({
      creatorWallet: creatorWallet.toLowerCase()
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CreatorFollow.countDocuments({
      creatorWallet: creatorWallet.toLowerCase()
    });

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      followers
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching followers',
      error: error.message
    });
  }
};

// Get creators followed by user
export const getFollowingList = async (req, res) => {
  try {
    const { followerWallet, limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const following = await CreatorFollow.find({
      followerWallet: followerWallet.toLowerCase()
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CreatorFollow.countDocuments({
      followerWallet: followerWallet.toLowerCase()
    });

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      following
    });
  } catch (error) {
    console.error('Error fetching following list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching following list',
      error: error.message
    });
  }
};

// ==================== VIEWS ====================

// Track NFT View
export const trackNFTView = async (req, res) => {
  try {
    const { nftId, itemId, contractAddress, network, userWallet, ipAddress, userAgent } = req.body;

    const view = new NFTView({
      nftId,
      itemId,
      contractAddress: contractAddress != null ? String(contractAddress).toLowerCase() : null,
      network: network != null ? String(network).toLowerCase() : null,
      userWallet: userWallet ? String(userWallet).toLowerCase() : null,
      ipAddress: ipAddress || req.ip || null,
      userAgent: userAgent || req.headers['user-agent'] || null
    });

    await view.save();
    await updateEngagementStats('nft', nftId, network, { increment: 'viewCount', incrementUniqueViewers: true });

    res.status(201).json({
      success: true,
      message: 'View tracked'
    });
  } catch (error) {
    console.error('Error tracking NFT view:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking view',
      error: error.message
    });
  }
};

// Track Collection View
export const trackCollectionView = async (req, res) => {
  try {
    const { collectionId, collectionName, network, userWallet, ipAddress } = req.body;

    const view = new CollectionView({
      collectionId,
      collectionName,
      network,
      userWallet: userWallet ? userWallet.toLowerCase() : null,
      ipAddress: ipAddress || req.ip || null
    });

    await view.save();
    await updateEngagementStats('collection', collectionId, network, { increment: 'viewCount' });

    res.status(201).json({
      success: true,
      message: 'View tracked'
    });
  } catch (error) {
    console.error('Error tracking collection view:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking view',
      error: error.message
    });
  }
};

// ==================== SHARES ====================

// Track NFT Share
export const trackNFTShare = async (req, res) => {
  try {
    const { nftId, itemId, contractAddress, network, userWallet, shareMethod } = req.body;

    const share = new NFTShare({
      nftId,
      itemId,
      contractAddress: contractAddress != null ? String(contractAddress).toLowerCase() : null,
      network: network != null ? String(network).toLowerCase() : null,
      userWallet: userWallet ? String(userWallet).toLowerCase() : null,
      shareMethod: shareMethod || 'other'
    });

    await share.save();
    await updateEngagementStats('nft', nftId, network, { increment: 'shareCount' });

    res.status(201).json({
      success: true,
      message: 'Share tracked'
    });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking share',
      error: error.message
    });
  }
};

// ==================== STATS ====================

// Get engagement stats
export const getEngagementStats = async (req, res) => {
  try {
    const { entityType, entityId, network } = req.query;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const query = { entityType, entityId };
    if (network && entityType !== 'creator') {
      query.network = network;
    }

    let stats = await EngagementStats.findOne(query);

    // If stats don't exist yet, create them
    if (!stats) {
      stats = new EngagementStats({
        entityType,
        entityId,
        network: network || null
      });
      await stats.save();
    }

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

// Helper function to update engagement stats
async function updateEngagementStats(entityType, entityId, network = null, action) {
  try {
    const query = { entityType, entityId };
    if (network && entityType !== 'creator') {
      query.network = network;
    }

    const update = {};
    if (action.increment) {
      update[action.increment] = { $inc: 1 };
    }
    if (action.decrement) {
      update[action.decrement] = { $inc: -1 };
    }

    update.lastUpdated = new Date();

    // Use update instead of inc to support both inc and dec
    const stats = await EngagementStats.findOneAndUpdate(
      query,
      { $set: update },
      { upsert: true, new: true }
    );

    return stats;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}
