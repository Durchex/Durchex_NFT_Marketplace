import express from 'express';
import {
  updateUserCoverPhoto,
  removeUserCoverPhoto,
  updateCollectionCoverPhoto,
  removeCollectionCoverPhoto,
  getUserProfile,
  getCollection,
  updateCollectionBanner
} from '../controllers/coverPhotoController.js';

const router = express.Router();

// User cover photo routes
router.post('/user/cover-photo', updateUserCoverPhoto);
router.delete('/user/cover-photo', removeUserCoverPhoto);
router.get('/user/:walletAddress', getUserProfile);

// Collection cover photo routes
router.post('/collection/cover-photo', updateCollectionCoverPhoto);
router.delete('/collection/cover-photo', removeCollectionCoverPhoto);
router.post('/collection/banner', updateCollectionBanner);
router.get('/collection/:collectionId', getCollection);

export default router;
