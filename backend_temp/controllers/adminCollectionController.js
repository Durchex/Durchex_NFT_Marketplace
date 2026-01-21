import Collection from '../models/collectionModel.js';
import IPFSService from '../services/ipfsService.js';
import logger from '../utils/logger.js';

/**
 * Create a new collection (Admin endpoint)
 * Handles image upload and storage
 */
export const createCollectionAdmin = async (req, res) => {
  try {
    const { name, description, symbol, network, image, creatorWallet } = req.body;

    // Validate required fields
    if (!name || !network) {
      return res.status(400).json({ error: 'Name and network are required' });
    }

    // Use admin wallet or provided creator wallet
    const adminWallet = req.admin?.wallet || creatorWallet || 'admin-wallet';
    const creatorName = req.admin?.username || 'Admin';

    // Check for duplicates
    const existingCollection = await Collection.findOne({
      name: name.trim(),
      network,
      creatorWallet: adminWallet.toLowerCase()
    });

    if (existingCollection) {
      return res.status(409).json({ error: 'Collection with this name already exists for this network' });
    }

    let imageURL = null;

    // Handle image upload
    if (image) {
      try {
        // If image is base64 or file data
        if (typeof image === 'string' && image.startsWith('data:image')) {
          // Convert base64 to buffer
          const base64Data = image.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Upload to IPFS
          const ipfsHash = await IPFSService.uploadImage(buffer, `${name}-collection-${Date.now()}`);
          imageURL = `ipfs://${ipfsHash}`;
          
          logger.info('Collection image uploaded to IPFS', { 
            collectionName: name,
            ipfsHash 
          });
        } else if (typeof image === 'object') {
          // Handle file object if sent via multipart
          const ipfsHash = await IPFSService.uploadImage(image, `${name}-collection-${Date.now()}`);
          imageURL = `ipfs://${ipfsHash}`;
        } else {
          imageURL = image; // Already a URL
        }
      } catch (imageError) {
        logger.error('Error uploading collection image', { error: imageError.message });
        // Continue without image if upload fails
        imageURL = null;
      }
    }

    // Create unique collection ID
    const collectionId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create collection document
    const collectionData = {
      collectionId,
      name: name.trim(),
      description: description || '',
      creatorWallet: adminWallet.toLowerCase(),
      creatorName,
      image: imageURL,
      symbol: symbol || name.slice(0, 3).toUpperCase(),
      network: network.toLowerCase(),
      contractDeploymentStatus: 'pending'
    };

    const collection = new Collection(collectionData);
    await collection.save();

    logger.info('Collection created successfully', {
      collectionId: collection._id,
      name: collection.name,
      network: collection.network
    });

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection: {
        _id: collection._id,
        collectionId: collection.collectionId,
        name: collection.name,
        image: collection.image,
        description: collection.description,
        network: collection.network,
        creatorWallet: collection.creatorWallet,
        createdAt: collection.createdAt
      }
    });
  } catch (error) {
    logger.error('Error creating collection', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all collections (Admin)
 */
export const getAllCollectionsAdmin = async (req, res) => {
  try {
    const { network, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (network) query.network = network.toLowerCase();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const collections = await Collection.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Collection.countDocuments(query);

    res.json({
      success: true,
      collections,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching collections', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get collection details
 */
export const getCollectionDetailsAdmin = async (req, res) => {
  try {
    const { collectionId } = req.params;

    const collection = await Collection.findOne({
      $or: [
        { _id: collectionId },
        { collectionId }
      ]
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({
      success: true,
      collection
    });
  } catch (error) {
    logger.error('Error fetching collection details', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update collection
 */
export const updateCollectionAdmin = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { name, description, image, symbol } = req.body;

    const collection = await Collection.findOne({
      $or: [
        { _id: collectionId },
        { collectionId }
      ]
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Update image if provided
    if (image && image !== collection.image) {
      try {
        if (typeof image === 'string' && image.startsWith('data:image')) {
          const base64Data = image.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const ipfsHash = await uploadImageToIPFS(buffer, `${name || collection.name}-${Date.now()}`);
          collection.image = `ipfs://${ipfsHash}`;
        } else {
          collection.image = image;
        }
      } catch (imageError) {
        logger.error('Error uploading collection image', { error: imageError.message });
      }
    }

    // Update other fields
    if (name) collection.name = name;
    if (description) collection.description = description;
    if (symbol) collection.symbol = symbol;

    await collection.save();

    logger.info('Collection updated', { collectionId: collection._id });

    res.json({
      success: true,
      message: 'Collection updated successfully',
      collection
    });
  } catch (error) {
    logger.error('Error updating collection', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete collection
 */
export const deleteCollectionAdmin = async (req, res) => {
  try {
    const { collectionId } = req.params;

    const collection = await Collection.findOneAndDelete({
      $or: [
        { _id: collectionId },
        { collectionId }
      ]
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    logger.info('Collection deleted', { collectionId: collection._id });

    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting collection', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};
