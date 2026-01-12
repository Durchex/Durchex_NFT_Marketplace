import { updateUserByWalletAddress, getUserByWalletAddress } from '../models/userModel.js';
import Collection from '../models/collectionModel.js';

// Update user cover photo
export const updateUserCoverPhoto = async (req, res) => {
  try {
    const { walletAddress, coverPhotoUrl } = req.body;

    if (!walletAddress || !coverPhotoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: walletAddress, coverPhotoUrl'
      });
    }

    const updatedUser = await updateUserByWalletAddress(
      walletAddress.toLowerCase(),
      { coverPhoto: coverPhotoUrl },
      true
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cover photo updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user cover photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cover photo',
      error: error.message
    });
  }
};

// Remove user cover photo
export const removeUserCoverPhoto = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    const updatedUser = await updateUserByWalletAddress(
      walletAddress.toLowerCase(),
      { coverPhoto: null },
      true
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cover photo removed successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error removing cover photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing cover photo',
      error: error.message
    });
  }
};

// Update collection cover photo
export const updateCollectionCoverPhoto = async (req, res) => {
  try {
    const { collectionId, coverPhotoUrl } = req.body;

    if (!collectionId || !coverPhotoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: collectionId, coverPhotoUrl'
      });
    }

    const collection = await Collection.findOneAndUpdate(
      { collectionId },
      { coverPhoto: coverPhotoUrl, updatedAt: new Date() },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Collection cover photo updated successfully',
      collection
    });
  } catch (error) {
    console.error('Error updating collection cover photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating collection cover photo',
      error: error.message
    });
  }
};

// Remove collection cover photo
export const removeCollectionCoverPhoto = async (req, res) => {
  try {
    const { collectionId } = req.body;

    if (!collectionId) {
      return res.status(400).json({
        success: false,
        message: 'Collection ID required'
      });
    }

    const collection = await Collection.findOneAndUpdate(
      { collectionId },
      { coverPhoto: null, updatedAt: new Date() },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Collection cover photo removed successfully',
      collection
    });
  } catch (error) {
    console.error('Error removing collection cover photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing collection cover photo',
      error: error.message
    });
  }
};

// Get user profile with cover photo
export const getUserProfile = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const user = await getUserByWalletAddress(walletAddress.toLowerCase());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Get collection with cover photo
export const getCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    const collection = await Collection.findOne({ collectionId });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collection',
      error: error.message
    });
  }
};

// Update collection banner/image
export const updateCollectionBanner = async (req, res) => {
  try {
    const { collectionId, bannerUrl } = req.body;

    if (!collectionId || !bannerUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const collection = await Collection.findOneAndUpdate(
      { collectionId },
      { banner: bannerUrl, updatedAt: new Date() },
      { new: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Collection banner updated',
      collection
    });
  } catch (error) {
    console.error('Error updating collection banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating banner',
      error: error.message
    });
  }
};
