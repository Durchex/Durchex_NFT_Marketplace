import express from 'express';
import {
  likeNFT,
  unlikeNFT,
  isNFTLiked,
  likeCollection,
  unlikeCollection,
  followCreator,
  unfollowCreator,
  isFollowingCreator,
  getCreatorFollowers,
  getFollowingList,
  trackNFTView,
  trackCollectionView,
  trackNFTShare,
  getEngagementStats
} from '../controllers/engagementController.js';

const router = express.Router();

// NFT Like routes
router.post('/likes/nft', likeNFT);
router.delete('/likes/nft', unlikeNFT);
router.get('/likes/nft/check', isNFTLiked);

// Collection Like routes
router.post('/likes/collection', likeCollection);
router.delete('/likes/collection', unlikeCollection);

// Creator Follow routes
router.post('/follow', followCreator);
router.delete('/follow', unfollowCreator);
router.get('/follow/check', isFollowingCreator);
router.get('/followers/:creatorWallet', getCreatorFollowers);
router.get('/following/:followerWallet', getFollowingList);

// View tracking routes
router.post('/views/nft', trackNFTView);
router.post('/views/collection', trackCollectionView);

// Share tracking routes
router.post('/shares/nft', trackNFTShare);

// Stats routes
router.get('/stats', getEngagementStats);

export default router;
