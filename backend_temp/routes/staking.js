/**
 * Staking API Routes (ESM)
 * When STAKING_CONTRACT_ADDRESS + RPC_URL are set: reads my-stakes and rewards from chain.
 * Stake/unstake/claim-rewards are done on-chain by the frontend; these endpoints sync or fallback to in-memory.
 */
import express from 'express';
import { ethers } from 'ethers';
import auth from '../middleware/auth.js';

const router = express.Router();

const stakesByUser = new Map();
const rewardsByUser = new Map();

const STAKING_ABI = [
  'function getStakerInfo(address _staker) view returns (uint256[] stakedTokens, uint256 totalRewards, uint256 claimedRewards, uint256 pendingRewards)',
  'function nftCollection() view returns (address)',
];

function getStakingProvider() {
  const rpc = process.env.STAKING_RPC_URL || process.env.POLYGON_RPC_URL || process.env.RPC_URL;
  const addr = process.env.STAKING_CONTRACT_ADDRESS;
  if (!rpc || !addr || addr === '0x0') return { provider: null, address: null };
  try {
    return { provider: new ethers.JsonRpcProvider(rpc), address: addr };
  } catch (e) {
    return { provider: null, address: null };
  }
}

router.post('/stake', auth, async (req, res) => {
  try {
    const { nftContract, tokenId, lockDays } = req.body || {};
    const user = req.user?.address;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!nftContract || !tokenId) return res.status(400).json({ error: 'nftContract and tokenId required' });
    const { address: contractAddr } = getStakingProvider();
    if (contractAddr) {
      return res.status(200).json({
        success: true,
        message: 'Staking is on-chain. Complete the transaction in the app (Staking page).',
        onChain: true,
      });
    }
    const id = `${nftContract}-${tokenId}`;
    const list = stakesByUser.get(user.toLowerCase()) || [];
    if (list.some((s) => s.id === id)) return res.status(400).json({ error: 'Already staked' });
    const stake = { id, nftContract, tokenId, lockDays: lockDays || 30, stakedAt: new Date().toISOString() };
    list.push(stake);
    stakesByUser.set(user.toLowerCase(), list);
    res.status(201).json({ success: true, data: stake, message: 'Stake recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Stake failed' });
  }
});

router.post('/unstake', auth, async (req, res) => {
  try {
    const { nftContract, tokenId } = req.body || {};
    const user = req.user?.address;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { address: contractAddr } = getStakingProvider();
    if (contractAddr) {
      return res.status(200).json({
        success: true,
        message: 'Unstaking is on-chain. Complete the transaction in the app.',
        onChain: true,
      });
    }
    const list = stakesByUser.get(user.toLowerCase()) || [];
    const id = `${nftContract}-${tokenId}`;
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Stake not found' });
    list.splice(idx, 1);
    stakesByUser.set(user.toLowerCase(), list);
    res.json({ success: true, message: 'Unstaked' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unstake failed' });
  }
});

router.get('/my-stakes', auth, async (req, res) => {
  try {
    const user = req.user?.address;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { provider, address: contractAddr } = getStakingProvider();
    if (provider && contractAddr) {
      const contract = new ethers.Contract(contractAddr, STAKING_ABI, provider);
      const [stakedTokens, , ,] = await contract.getStakerInfo(user);
      const nftCollectionAddr = await contract.nftCollection().catch(() => null);
      const list = (stakedTokens || []).map((id, i) => ({
        id: `${nftCollectionAddr || contractAddr}-${id.toString()}`,
        nftContract: nftCollectionAddr || '',
        tokenId: id.toString(),
        stakedAt: new Date().toISOString(),
      }));
      return res.json({ success: true, data: list, total: list.length, fromChain: true });
    }
    const list = stakesByUser.get(user.toLowerCase()) || [];
    res.json({ success: true, data: list, total: list.length });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch stakes' });
  }
});

router.get('/rewards', auth, async (req, res) => {
  try {
    const user = req.user?.address;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { provider, address: contractAddr } = getStakingProvider();
    if (provider && contractAddr) {
      const contract = new ethers.Contract(contractAddr, STAKING_ABI, provider);
      const [, totalRewards, claimedRewards, pendingRewards] = await contract.getStakerInfo(user);
      const pending = pendingRewards != null ? ethers.formatEther(pendingRewards) : '0';
      const claimed = claimedRewards != null ? ethers.formatEther(claimedRewards) : '0';
      return res.json({ success: true, data: { pending, claimed }, fromChain: true });
    }
    const rewards = rewardsByUser.get(user.toLowerCase()) || { pending: '0', claimed: '0' };
    res.json({ success: true, data: rewards });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch rewards' });
  }
});

router.post('/claim-rewards', auth, async (req, res) => {
  try {
    const user = req.user?.address;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { address: contractAddr } = getStakingProvider();
    if (contractAddr) {
      return res.status(200).json({
        success: true,
        message: 'Claiming is on-chain. Complete the transaction in the app (Staking page).',
        onChain: true,
      });
    }
    const r = rewardsByUser.get(user.toLowerCase()) || { pending: '0', claimed: '0' };
    const pending = parseFloat(r.pending) || 0;
    rewardsByUser.set(user.toLowerCase(), { pending: '0', claimed: String(parseFloat(r.claimed) + pending) });
    res.json({ success: true, data: { claimed: pending }, message: 'Rewards claimed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Claim failed' });
  }
});

export default router;
