
import express from 'express';
import BridgeService from '../services/BridgeService.js';
import auth from '../middleware/auth.js';
import tryCatch from '../middleware/tryCatch.js';
const router = express.Router();

const bridgeService = new BridgeService();

// Initiate cross-chain bridge transfer
router.post('/initiate', auth, tryCatch(async (req, res) => {
  const {
    sourceChain,
    destinationChain,
    nftAddress,
    tokenId,
    amount,
    tokenType,
    bridgeAddress,
    recipientAddress
  } = req.body;

  // Validate parameters
  const validation = bridgeService.validateBridgeParams({
    sourceChain,
    destinationChain,
    nftAddress,
    recipientAddress: recipientAddress || req.user.address,
    tokenType,
    amount
  });

  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const result = await bridgeService.initiateBridge({
    userAddress: req.user.address,
    sourceChain,
    destinationChain,
    nftAddress,
    tokenId,
    amount,
    tokenType,
    bridgeAddress,
    recipientAddress: recipientAddress || req.user.address
  });

  return res.status(200).json({
    message: 'Bridge transfer initiated successfully',
    ...result
  });
}));

// Get transfer status
router.get('/status/:sourceChain/:bridgeAddress/:transferId', tryCatch(async (req, res) => {
  const { sourceChain, bridgeAddress, transferId } = req.params;

  if (!transferId) {
    return res.status(400).json({ error: 'Transfer ID is required' });
  }

  const transfer = await bridgeService.getTransferStatus(sourceChain, bridgeAddress, transferId);

  return res.status(200).json(transfer);
}));

// Get user transfer history
router.get('/history/:userAddress', auth, tryCatch(async (req, res) => {
  const { userAddress } = req.params;
  const { sourceChain = 'ethereum', bridgeAddress } = req.query;

  if (userAddress.toLowerCase() !== req.user.address.toLowerCase()) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!bridgeAddress) {
    return res.status(400).json({ error: 'Bridge address is required' });
  }

  const transfers = await bridgeService.getUserTransferHistory(
    sourceChain,
    bridgeAddress,
    userAddress
  );

  return res.status(200).json({
    userAddress,
    total: transfers.length,
    transfers
  });
}));

// Get bridge statistics
router.get('/stats', tryCatch(async (req, res) => {
  const { sourceChain = 'ethereum', bridgeAddress } = req.query;

  if (!bridgeAddress) {
    return res.status(400).json({ error: 'Bridge address is required' });
  }

  const stats = await bridgeService.getBridgeStats(sourceChain, bridgeAddress);

  return res.status(200).json(stats);
}));

// Estimate bridge transfer cost
router.post('/estimate-cost', tryCatch(async (req, res) => {
  const {
    sourceChain,
    destinationChain,
    tokenType,
    quantity = 1
  } = req.body;

  if (!sourceChain || !destinationChain) {
    return res.status(400).json({ error: 'Source and destination chains are required' });
  }

  if (sourceChain === destinationChain) {
    return res.status(400).json({ error: 'Source and destination cannot be the same' });
  }

  const estimate = await bridgeService.estimateTransferCost({
    sourceChain,
    destinationChain,
    tokenType,
    quantity
  });

  return res.status(200).json(estimate);
}));

// Get supported chains
router.get('/supported-chains', tryCatch(async (req, res) => {
  const chains = bridgeService.getSupportedChains();

  return res.status(200).json(chains);
}));

// Get chain information
router.get('/chain/:chainName', tryCatch(async (req, res) => {
  const { chainName } = req.params;

  const chains = bridgeService.getSupportedChains();
  const chain = chains.find(c => c.name === chainName.toLowerCase());

  if (!chain) {
    return res.status(404).json({ error: 'Chain not found' });
  }

  return res.status(200).json(chain);
}));

// Get bridge routes (supported transfer paths)
router.get('/routes', tryCatch(async (req, res) => {
  const chains = bridgeService.getSupportedChains();
  const routes = [];

  for (let i = 0; i < chains.length; i++) {
    for (let j = 0; j < chains.length; j++) {
      if (i !== j) {
        routes.push({
          from: chains[i].name,
          to: chains[j].name,
          fromChainId: chains[i].chainId,
          toChainId: chains[j].chainId,
          supported: true
        });
      }
    }
  }

  return res.status(200).json({
    totalRoutes: routes.length,
    routes
  });
}));

// Validate bridge parameters
router.post('/validate', tryCatch(async (req, res) => {
  const {
    sourceChain,
    destinationChain,
    nftAddress,
    recipientAddress,
    tokenType,
    amount
  } = req.body;

  const validation = bridgeService.validateBridgeParams({
    sourceChain,
    destinationChain,
    nftAddress,
    recipientAddress,
    tokenType,
    amount
  });

  return res.status(200).json({
    valid: validation.valid,
    errors: validation.errors
  });
}));

// Get bridge contract details
router.get('/contract/:sourceChain/:bridgeAddress', tryCatch(async (req, res) => {
  const { sourceChain, bridgeAddress } = req.params;

  if (!bridgeAddress) {
    return res.status(400).json({ error: 'Bridge address is required' });
  }

  const stats = await bridgeService.getBridgeStats(sourceChain, bridgeAddress);

  return res.status(200).json({
    sourceChain,
    bridgeAddress,
    stats,
    supportedChains: ['ethereum', 'polygon', 'arbitrum']
  });
}));

// Get bridge transfer limits
router.get('/limits', tryCatch(async (req, res) => {
  // Define bridge transfer limits per chain and token type
  const limits = {
    ethereum: {
      ERC721: { min: 1, max: 100, cooldown: 0 },
      ERC1155: { min: 1, max: 1000, cooldown: 0 },
      ERC20: { min: '1', max: '1000000', cooldown: 0 }
    },
    polygon: {
      ERC721: { min: 1, max: 100, cooldown: 0 },
      ERC1155: { min: 1, max: 1000, cooldown: 0 },
      ERC20: { min: '1', max: '1000000', cooldown: 0 }
    },
    arbitrum: {
      ERC721: { min: 1, max: 100, cooldown: 0 },
      ERC1155: { min: 1, max: 1000, cooldown: 0 },
      ERC20: { min: '1', max: '1000000', cooldown: 0 }
    }
  };

  return res.status(200).json(limits);
}));

// Get cross-chain bridge fees
router.get('/fees', tryCatch(async (req, res) => {
  const fees = {
    ethereum: {
      toLPolygon: { networkFee: 2.50, platformFee: 0.25, total: 2.75 },
      toArbitrum: { networkFee: 1.80, platformFee: 0.20, total: 2.00 }
    },
    polygon: {
      toEthereum: { networkFee: 3.20, platformFee: 0.30, total: 3.50 },
      toArbitrum: { networkFee: 1.50, platformFee: 0.15, total: 1.65 }
    },
    arbitrum: {
      toEthereum: { networkFee: 2.80, platformFee: 0.25, total: 3.05 },
      toPolygon: { networkFee: 2.10, platformFee: 0.20, total: 2.30 }
    }
  };

  return res.status(200).json(fees);
}));

// Get bridge analytics
router.get('/analytics', tryCatch(async (req, res) => {
  const { sourceChain = 'ethereum', bridgeAddress } = req.query;

  if (!bridgeAddress) {
    return res.status(400).json({ error: 'Bridge address is required' });
  }

  const stats = await bridgeService.getBridgeStats(sourceChain, bridgeAddress);

  return res.status(200).json({
    analytics: {
      totalTransfers: stats.totalTransfers,
      totalVolumeProcessed: stats.totalVolume,
      averageTransferSize: Math.round(stats.totalVolume / (stats.totalTransfers || 1)),
      platformFeesCollected: Math.round((stats.totalVolume * stats.platformFee) / 100),
      operationalStatus: stats.isPaused ? 'paused' : 'active'
    }
  });
}));

export default router;
