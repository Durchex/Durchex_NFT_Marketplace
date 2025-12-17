import { nftUserModel } from '../models/userModel.js';
import { nftModel } from '../models/nftModel.js';
import { cartModel } from '../models/cartModel.js';

// Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await nftUserModel.countDocuments();
    
    // Get total NFTs
    const totalNFTs = await nftModel.countDocuments();
    
    // Get active listings (currentlyListed = true)
    const activeSales = await nftModel.countDocuments({ currentlyListed: true });
    
    // Calculate total volume (sum of all NFT prices)
    const nfts = await nftModel.find({ currentlyListed: true });
    const totalVolume = nfts.reduce((sum, nft) => {
      const price = parseFloat(nft.price) || 0;
      return sum + price;
    }, 0);

    // Get recent activities (recent NFTs and users)
    const recentNFTs = await nftModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name collection owner createdAt currentlyListed')
      .lean();

    const recentUsers = await nftUserModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username walletAddress createdAt')
      .lean();

    const recentActivities = [
      ...recentNFTs.map(nft => ({
        id: nft._id,
        type: nft.currentlyListed ? 'listing' : 'nft',
        description: nft.currentlyListed 
          ? `NFT "${nft.name}" listed for sale`
          : `NFT "${nft.name}" created`,
        time: nft.createdAt,
        user: nft.owner
      })),
      ...recentUsers.map(user => ({
        id: user._id,
        type: 'user',
        description: `New user "${user.username}" registered`,
        time: user.createdAt,
        user: user.walletAddress
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    // Get top collections
    const topCollections = await nftModel.aggregate([
      {
        $match: {
          collection: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$collection',
          count: { $sum: 1 },
          totalVolume: { $sum: { $toDouble: '$price' } }
        }
      },
      {
        $sort: { totalVolume: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          items: '$count',
          volume: { $toString: '$totalVolume' },
          change: '+0%' // Can be calculated based on historical data
        }
      }
    ]);

    res.json({
      totalUsers,
      totalNFTs,
      totalVolume: totalVolume.toFixed(4),
      activeSales,
      recentActivities,
      topCollections
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all users with pagination and search
export const getAllUsersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { walletAddress: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await nftUserModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await nftUserModel.countDocuments(query);

    // Get NFT counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const nftCount = await nftModel.countDocuments({ owner: user.walletAddress });
        const listedCount = await nftModel.countDocuments({ 
          owner: user.walletAddress, 
          currentlyListed: true 
        });
        return {
          ...user,
          nftCount,
          listedCount
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const updates = req.body;

    const user = await nftUserModel.findOneAndUpdate(
      { walletAddress },
      updates,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all NFTs with pagination and filters
export const getAllNFTsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { network, status, search } = req.query;

    let query = {};
    if (network) query.network = network;
    if (status === 'listed') query.currentlyListed = true;
    if (status === 'unlisted') query.currentlyListed = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { collection: { $regex: search, $options: 'i' } },
        { itemId: { $regex: search, $options: 'i' } }
      ];
    }

    const nfts = await nftModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await nftModel.countDocuments(query);

    res.json({
      nfts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update NFT status
export const updateNFTStatus = async (req, res) => {
  try {
    const { network, itemId } = req.params;
    const updates = req.body;

    const nft = await nftModel.findOneAndUpdate(
      { network, itemId },
      updates,
      { new: true }
    );

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json(nft);
  } catch (error) {
    console.error('Error updating NFT:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get transactions (from NFTs that have been sold)
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { network, type, search } = req.query;

    // Get NFTs that have been sold (owner !== seller and currentlyListed = false)
    let query = {
      $expr: { $ne: ['$owner', '$seller'] },
      currentlyListed: false
    };

    if (network) query.network = network;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } },
        { seller: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await nftModel.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name collection network owner seller price updatedAt image')
      .lean();

    const total = await nftModel.countDocuments(query);

    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      hash: `0x${tx._id.toString().slice(-16)}...`,
      type: 'Sale',
      amount: `${parseFloat(tx.price).toFixed(4)} ETH`,
      status: 'completed',
      timestamp: tx.updatedAt,
      from: tx.seller,
      to: tx.owner,
      nft: {
        name: tx.name,
        image: tx.image,
        collection: tx.collection
      }
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get orders (active listings)
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { network, status, search } = req.query;

    let query = { currentlyListed: true };
    if (network) query.network = network;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { collection: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await nftModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name collection network owner seller price createdAt image itemId tokenId')
      .lean();

    const total = await nftModel.countDocuments(query);

    const formattedOrders = orders.map(order => ({
      id: order._id,
      nft: {
        name: order.name,
        image: order.image,
        collection: order.collection
      },
      seller: order.owner,
      price: `${parseFloat(order.price).toFixed(4)} ETH`,
      status: 'active',
      createdAt: order.createdAt,
      network: order.network,
      itemId: order.itemId,
      tokenId: order.tokenId
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get analytics
export const getAnalytics = async (req, res) => {
  try {
    const period = req.query.period || '7d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User growth
    const totalUsers = await nftUserModel.countDocuments();
    const newUsers = await nftUserModel.countDocuments({
      createdAt: { $gte: startDate }
    });

    // NFT growth
    const totalNFTs = await nftModel.countDocuments();
    const newNFTs = await nftModel.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Volume analytics
    const listedNFTs = await nftModel.find({ currentlyListed: true });
    const totalVolume = listedNFTs.reduce((sum, nft) => sum + (parseFloat(nft.price) || 0), 0);

    // Sales analytics
    const sales = await nftModel.find({
      $expr: { $ne: ['$owner', '$seller'] },
      currentlyListed: false,
      updatedAt: { $gte: startDate }
    });
    const salesVolume = sales.reduce((sum, nft) => sum + (parseFloat(nft.price) || 0), 0);

    // Daily stats for chart
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayUsers = await nftUserModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      const dayNFTs = await nftModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      const daySales = await nftModel.countDocuments({
        $expr: { $ne: ['$owner', '$seller'] },
        currentlyListed: false,
        updatedAt: { $gte: date, $lt: nextDate }
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        users: dayUsers,
        nfts: dayNFTs,
        sales: daySales
      });
    }

    res.json({
      users: {
        total: totalUsers,
        new: newUsers,
        growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : '0'
      },
      nfts: {
        total: totalNFTs,
        new: newNFTs,
        growth: totalNFTs > 0 ? ((newNFTs / totalNFTs) * 100).toFixed(2) : '0'
      },
      volume: {
        total: totalVolume.toFixed(4),
        sales: salesVolume.toFixed(4),
        growth: '0' // Can be calculated based on previous period
      },
      sales: {
        total: sales.length,
        period: days
      },
      dailyStats
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get activity log
export const getActivityLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { type, search } = req.query;

    let activities = [];

    // Get NFT activities
    if (!type || type === 'nft' || type === 'all') {
      const nftActivities = await nftModel.find()
        .sort({ updatedAt: -1 })
        .limit(100)
        .select('name collection owner seller currentlyListed createdAt updatedAt')
        .lean();

      activities.push(...nftActivities.map(nft => ({
        id: nft._id,
        type: nft.currentlyListed ? 'listing' : 'nft',
        action: nft.currentlyListed ? 'NFT Listed' : 'NFT Created',
        description: `NFT "${nft.name}" ${nft.currentlyListed ? 'listed for sale' : 'created'}`,
        user: nft.owner,
        timestamp: nft.currentlyListed ? nft.updatedAt : nft.createdAt,
        metadata: {
          collection: nft.collection,
          seller: nft.seller
        }
      })));
    }

    // Get user activities
    if (!type || type === 'user' || type === 'all') {
      const userActivities = await nftUserModel.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select('username walletAddress createdAt')
        .lean();

      activities.push(...userActivities.map(user => ({
        id: user._id,
        type: 'user',
        action: 'User Registration',
        description: `User "${user.username}" registered`,
        user: user.walletAddress,
        timestamp: user.createdAt,
        metadata: {
          username: user.username
        }
      })));
    }

    // Sort by timestamp and apply filters
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (search) {
      activities = activities.filter(activity =>
        activity.description.toLowerCase().includes(search.toLowerCase()) ||
        activity.user.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type && type !== 'all') {
      activities = activities.filter(activity => activity.type === type);
    }

    const total = activities.length;
    const paginatedActivities = activities.slice(skip, skip + limit);

    res.json({
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting activity log:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate report
export const generateReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, network } = req.body;

    let report = {};

    switch (reportType) {
      case 'users':
        const users = await nftUserModel.find({
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).lean();
        report = {
          type: 'users',
          period: { startDate, endDate },
          total: users.length,
          data: users
        };
        break;

      case 'sales':
        const sales = await nftModel.find({
          $expr: { $ne: ['$owner', '$seller'] },
          currentlyListed: false,
          updatedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          ...(network && { network })
        }).lean();
        const salesVolume = sales.reduce((sum, nft) => sum + (parseFloat(nft.price) || 0), 0);
        report = {
          type: 'sales',
          period: { startDate, endDate },
          total: sales.length,
          volume: salesVolume.toFixed(4),
          data: sales
        };
        break;

      case 'nfts':
        const nfts = await nftModel.find({
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          ...(network && { network })
        }).lean();
        report = {
          type: 'nfts',
          period: { startDate, endDate },
          total: nfts.length,
          data: nfts
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all reports
export const getReports = async (req, res) => {
  try {
    // In a real app, you'd store reports in a database
    // For now, return available report types
    res.json({
      reports: [
        { id: 1, type: 'users', name: 'User Report', createdAt: new Date() },
        { id: 2, type: 'sales', name: 'Sales Report', createdAt: new Date() },
        { id: 3, type: 'nfts', name: 'NFT Report', createdAt: new Date() }
      ]
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// UNMINTED NFT & FEE SUBSIDY MANAGEMENT
// ============================================

// Create an unminted NFT (for giveaways and presale)
export const createUnmintedNFT = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      category,
      collection,
      network,
      price,
      properties,
      isGiveaway,
      adminNotes
    } = req.body;

    // Generate unique itemId
    const itemId = `${collection}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const unmintedNFT = await nftModel.create({
      itemId,
      name,
      description,
      image,
      category,
      collection,
      network,
      price: price || '0',
      properties: properties || {},
      owner: 'admin', // Admin owns it until minted/given away
      seller: 'admin',
      nftContract: 'pending',
      tokenId: 'pending',
      currentlyListed: true,
      isMinted: false,
      isGiveaway: isGiveaway || false,
      giveawayStatus: isGiveaway ? 'pending' : 'pending',
      adminNotes: adminNotes || null,
      royalties: {}
    });

    res.status(201).json({
      success: true,
      message: 'Unminted NFT created successfully',
      nft: unmintedNFT
    });
  } catch (error) {
    console.error('Error creating unminted NFT:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all unminted NFTs
export const getUnmintedNFTs = async (req, res) => {
  try {
    const { isGiveaway, network } = req.query;
    
    let filter = { isMinted: false };
    
    if (isGiveaway !== undefined) {
      filter.isGiveaway = isGiveaway === 'true';
    }
    
    if (network) {
      filter.network = network;
    }

    const unmintedNFTs = await nftModel.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: unmintedNFTs.length,
      nfts: unmintedNFTs
    });
  } catch (error) {
    console.error('Error fetching unminted NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Offer NFT to a specific user
export const offerNFTToUser = async (req, res) => {
  try {
    const { itemId, walletAddress, subsidyPercentage } = req.body;

    if (!itemId || !walletAddress) {
      return res.status(400).json({ 
        error: 'itemId and walletAddress are required' 
      });
    }

    const nft = await nftModel.findOne({ itemId });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    if (nft.isMinted) {
      return res.status(400).json({ 
        error: 'Cannot offer already minted NFTs' 
      });
    }

    // Update NFT with offer details
    const updatedNFT = await nftModel.findOneAndUpdate(
      { itemId },
      {
        offeredTo: walletAddress,
        giveawayStatus: 'offered',
        feeSubsidyEnabled: subsidyPercentage > 0,
        feeSubsidyPercentage: subsidyPercentage || 0
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `NFT offered to ${walletAddress}`,
      nft: updatedNFT
    });
  } catch (error) {
    console.error('Error offering NFT to user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Set fee subsidy for an NFT
export const setFeeSubsidy = async (req, res) => {
  try {
    const { itemId, percentage, recipients } = req.body;

    if (!itemId || percentage === undefined) {
      return res.status(400).json({ 
        error: 'itemId and percentage are required' 
      });
    }

    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({ 
        error: 'Percentage must be between 0 and 100' 
      });
    }

    const nft = await nftModel.findOne({ itemId });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Update NFT with subsidy details
    const updatedNFT = await nftModel.findOneAndUpdate(
      { itemId },
      {
        feeSubsidyEnabled: percentage > 0,
        feeSubsidyPercentage: percentage,
        feeSubsidyRecipients: recipients || []
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Fee subsidy set to ${percentage}%`,
      nft: updatedNFT
    });
  } catch (error) {
    console.error('Error setting fee subsidy:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get fee subsidy info for an NFT
export const getFeeSubsidyInfo = async (req, res) => {
  try {
    const { itemId } = req.params;

    const nft = await nftModel.findOne({ itemId });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json({
      success: true,
      itemId,
      feeSubsidyEnabled: nft.feeSubsidyEnabled,
      feeSubsidyPercentage: nft.feeSubsidyPercentage,
      recipients: nft.feeSubsidyRecipients || [],
      offeredTo: nft.offeredTo
    });
  } catch (error) {
    console.error('Error getting fee subsidy info:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark NFT as minted
export const markNFTAsMinted = async (req, res) => {
  try {
    const { itemId, tokenId, txHash, nftContract } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const updatedNFT = await nftModel.findOneAndUpdate(
      { itemId },
      {
        isMinted: true,
        mintedAt: new Date(),
        mintTxHash: txHash,
        tokenId: tokenId || 'pending',
        nftContract: nftContract || 'pending',
        giveawayStatus: 'minted'
      },
      { new: true }
    );

    if (!updatedNFT) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json({
      success: true,
      message: 'NFT marked as minted',
      nft: updatedNFT
    });
  } catch (error) {
    console.error('Error marking NFT as minted:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get giveaway NFTs
export const getGiveawayNFTs = async (req, res) => {
  try {
    const { status, offeredTo } = req.query;

    let filter = { isGiveaway: true };

    if (status) {
      filter.giveawayStatus = status;
    }

    if (offeredTo) {
      filter.offeredTo = offeredTo.toLowerCase();
    }

    const giveaways = await nftModel.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: giveaways.length,
      giveaways
    });
  } catch (error) {
    console.error('Error fetching giveaway NFTs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Revoke NFT offer
export const revokeNFTOffer = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const updatedNFT = await nftModel.findOneAndUpdate(
      { itemId },
      {
        offeredTo: null,
        giveawayStatus: 'pending',
        feeSubsidyEnabled: false,
        feeSubsidyPercentage: 0
      },
      { new: true }
    );

    if (!updatedNFT) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json({
      success: true,
      message: 'NFT offer revoked',
      nft: updatedNFT
    });
  } catch (error) {
    console.error('Error revoking NFT offer:', error);
    res.status(500).json({ error: error.message });
  }
};

