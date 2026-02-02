/**
 * Auxiliary contract getters (Auction, Offer, Rental, Financing).
 * Uses env: VITE_APP_AUCTION_CONTRACT_ADDRESS, VITE_APP_OFFER_CONTRACT_ADDRESS,
 * VITE_APP_RENTAL_CONTRACT_ADDRESS, VITE_APP_FINANCING_CONTRACT_ADDRESS
 * or per-network: VITE_APP_AUCTION_CONTRACT_ADDRESS_POLYGON, etc.
 */
import { ethers } from 'ethers';
import { rpcUrls } from './constants';

const getEnvAddress = (prefix, network) => {
  const net = String(network || '').toLowerCase();
  const suffix = net ? `_${net.toUpperCase().replace(/-/g, '_')}` : '';
  const key = `VITE_APP_${prefix}${suffix}`;
  return import.meta.env[key] || import.meta.env[`VITE_APP_${prefix}`] || null;
};

const AUCTION_ABI = [
  'function placeBid(uint256 _auctionId, uint256 _bidAmount) external payable',
  'function settleAuction(uint256 _auctionId) external',
  'function auctions(uint256) view returns (address nftContract, uint256 tokenId, address seller, address currentBidder, uint256 currentBid, uint256 reservePrice, uint256 startTime, uint256 endTime, uint8 status, bool settled)',
];
const OFFER_ABI = [
  'function createOffer(address _nftContract, uint256 _tokenId, address _seller, uint256 _offerAmount, address _paymentToken, uint256 _durationDays) external payable',
  'function acceptOffer(uint256 _offerId) external',
  'function rejectOffer(uint256 _offerId) external',
  'function cancelOffer(uint256 _offerId) external',
  'function getOffer(uint256 _offerId) view returns (uint256 offerId, address nftContract, uint256 tokenId, address buyer, address seller, uint256 offerAmount, address paymentToken, uint256 expiresAt, uint8 status, uint256 createdAt, uint256 respondedAt, bool isCounterOffer, uint256 parentOfferId)',
  'function isOfferActive(uint256 _offerId) view returns (bool)',
  'function offerCounter() view returns (uint256)',
  'event OfferCreated(uint256 indexed offerId, address indexed nftContract, uint256 indexed tokenId, address buyer, address seller, uint256 amount, address paymentToken, uint256 expiresAt)',
  'event OfferAccepted(uint256 indexed offerId, address indexed seller, address indexed buyer, uint256 amount, uint256 timestamp)',
  'event OfferCancelled(uint256 indexed offerId, address indexed cancelledBy, uint256 timestamp)',
];
const RENTAL_ABI = [
  'function createBid(uint256 _listingId, uint256 _rentalDays, address paymentToken) external payable returns (uint256)',
  'function acceptBid(uint256 _bidId) external returns (uint256)',
  'function returnNFT(uint256 _rentalId) external',
];
const FINANCING_ABI = [
  'function createLoan(address nftContract, uint256 nftTokenId, uint256 amount, uint256 duration) external',
  'function repayFullLoan(uint256 loanId) external',
];

const STAKING_ABI = [
  'function stakeTokens(uint256[] calldata _tokenIds) external',
  'function unstakeTokens(uint256[] calldata _tokenIds) external',
  'function claimRewards() external',
  'function getStakerInfo(address _staker) view returns (uint256[] stakedTokens, uint256 totalRewards, uint256 claimedRewards, uint256 pendingRewards)',
  'function calculatePendingRewards(address _staker) view returns (uint256)',
  'function getStats() view returns (uint256 totalStaked, uint256 activeStakers, uint256 distributed, uint256 poolBalance)',
];

export async function getAuctionContract(networkName) {
  try {
    if (!networkName || !window.ethereum) return null;
    const net = String(networkName).toLowerCase();
    const address = getEnvAddress('AUCTION_CONTRACT_ADDRESS', net);
    if (!address || address === '0x0') return null;
    const rpcUrl = rpcUrls[net];
    if (!rpcUrl) return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(address, AUCTION_ABI, signer);
  } catch (e) {
    console.warn('getAuctionContract', e);
    return null;
  }
}

export async function getOfferContract(networkName) {
  try {
    if (!networkName || !window.ethereum) return null;
    const net = String(networkName).toLowerCase();
    const address = getEnvAddress('OFFER_CONTRACT_ADDRESS', net);
    if (!address || address === '0x0') return null;
    const rpcUrl = rpcUrls[net];
    if (!rpcUrl) return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(address, OFFER_ABI, signer);
  } catch (e) {
    console.warn('getOfferContract', e);
    return null;
  }
}

export async function getRentalContract(networkName) {
  try {
    if (!networkName || !window.ethereum) return null;
    const net = String(networkName).toLowerCase();
    const address = getEnvAddress('RENTAL_CONTRACT_ADDRESS', net);
    if (!address || address === '0x0') return null;
    const rpcUrl = rpcUrls[net];
    if (!rpcUrl) return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(address, RENTAL_ABI, signer);
  } catch (e) {
    console.warn('getRentalContract', e);
    return null;
  }
}

export async function getFinancingContract(networkName) {
  try {
    if (!networkName || !window.ethereum) return null;
    const net = String(networkName).toLowerCase();
    const address = getEnvAddress('FINANCING_CONTRACT_ADDRESS', net);
    if (!address || address === '0x0') return null;
    const rpcUrl = rpcUrls[net];
    if (!rpcUrl) return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(address, FINANCING_ABI, signer);
  } catch (e) {
    console.warn('getFinancingContract', e);
    return null;
  }
}

export function hasAuctionContract(networkName) {
  const net = String(networkName || '').toLowerCase();
  const address = getEnvAddress('AUCTION_CONTRACT_ADDRESS', net);
  return !!(address && address !== '0x0');
}

export function hasOfferContract(networkName) {
  const net = String(networkName || '').toLowerCase();
  const address = getEnvAddress('OFFER_CONTRACT_ADDRESS', net);
  return !!(address && address !== '0x0');
}

export function hasRentalContract(networkName) {
  const net = String(networkName || '').toLowerCase();
  const address = getEnvAddress('RENTAL_CONTRACT_ADDRESS', net);
  return !!(address && address !== '0x0');
}

export function hasFinancingContract(networkName) {
  const net = String(networkName || '').toLowerCase();
  const address = getEnvAddress('FINANCING_CONTRACT_ADDRESS', net);
  return !!(address && address !== '0x0');
}

export async function getStakingContract(networkName) {
  try {
    if (!networkName || !window.ethereum) return null;
    const net = String(networkName).toLowerCase();
    const address = getEnvAddress('STAKING_CONTRACT_ADDRESS', net);
    if (!address || address === '0x0') return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(address, STAKING_ABI, signer);
  } catch (e) {
    console.warn('getStakingContract', e);
    return null;
  }
}

export function hasStakingContract(networkName) {
  const net = String(networkName || '').toLowerCase();
  const address = getEnvAddress('STAKING_CONTRACT_ADDRESS', net);
  return !!(address && address !== '0x0');
}
