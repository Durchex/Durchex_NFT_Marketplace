import { useState, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import { ICOContent } from '../Context';
import { marketplaceAPI } from '../services/api';
import { getMarketplaceContractAddress } from '../Context/constants';
import toast from 'react-hot-toast';

// EIP-712 domain and types for marketplace signatures
const MARKETPLACE_DOMAIN = {
  name: 'DurchexNFTMarketplace',
  version: '2.0',
  chainId: 1, // Will be updated based on network
  verifyingContract: '', // Will be set to marketplace contract address
};

const LISTING_TYPES = {
  Listing: [
    { name: 'nftContract', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'listingType', type: 'uint8' }, // 0 = fixed price, 1 = auction
    { name: 'startTime', type: 'uint256' },
    { name: 'endTime', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ]
};

const OFFER_TYPES = {
  Offer: [
    { name: 'listingId', type: 'string' },
    { name: 'price', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ]
};

export const useMarketplace = () => {
  const { address, signer, selectedChain } = useContext(ICOContent);
  const [isLoading, setIsLoading] = useState(false);

  // Get marketplace contract address for the current network
  const resolveMarketplaceContractAddress = useCallback(async (network) => {
    try {
      const contractAddress = getMarketplaceContractAddress(network || selectedChain || 'ethereum');
      if (!contractAddress) {
        throw new Error('Marketplace contract address is not configured for ' + network);
      }
      return contractAddress;
    } catch (error) {
      console.error('Failed to resolve marketplace contract address:', error);
      throw error;
    }
  }, [selectedChain]);

  // Execute a sale (purchase). Caller can pass either a listingId+price (legacy)
  // or a full listing-shaped object so we can forward all fields the backend needs.
  const executeSale = useCallback(async (listingOrId, priceArg, options = {}) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      const isListingObject = listingOrId && typeof listingOrId === 'object';
      const listing = isListingObject ? listingOrId : null;
      const listingId = listing ? (listing.listingId ?? listing._id) : listingOrId;
      const price = listing ? listing.price : priceArg;

      const saleData = {
        listingId,
        buyer: address,
        seller: listing?.seller || options.seller,
        price,
        quantity: listing?.quantity || options.quantity || 1,
        transactionHash: options.transactionHash || null,
        network: listing?.network || options.network || selectedChain || 'ethereum',
      };

      const result = await marketplaceAPI.executeSale(saleData);
      toast.success('Purchase completed successfully!');
      return result;
    } catch (error) {
      console.error('Failed to execute sale:', error);
      toast.error(error.message || 'Failed to complete purchase');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, selectedChain]);

  // Create a marketplace listing — signs EIP-712 typed data with the user's
  // wallet so the backend can verify the listing was authorized by the seller.
  const createListing = useCallback(async (listingData) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      const network = (listingData.network || selectedChain || 'ethereum').toLowerCase();
      const verifyingContract = await resolveMarketplaceContractAddress(network);
      const chainId = getChainId(network);

      // Wallet-derived signer (the context doesn't expose one).
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Ethereum provider found. Please connect a wallet first.');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Build the EIP-712 message. Price is in wei to match Solidity uint256 expectations.
      const priceWei = ethers.utils.parseEther(String(listingData.price)).toString();
      const startTime = Number(listingData.startTime || Math.floor(Date.now() / 1000));
      const endTime = Number(listingData.endTime || 0);
      const nonce = Date.now();

      const message = {
        nftContract: listingData.nftContract,
        tokenId: String(listingData.tokenId),
        price: priceWei,
        listingType: listingData.listingType === 'auction' ? 1 : 0,
        startTime,
        endTime,
        nonce,
      };
      const domain = { ...MARKETPLACE_DOMAIN, chainId, verifyingContract };

      let signature;
      try {
        signature = await signer._signTypedData(domain, LISTING_TYPES, message);
      } catch (signError) {
        if (signError?.code === 4001 || /reject/i.test(signError?.message || '')) {
          toast.error('Listing cancelled — signature rejected.');
        } else {
          toast.error('Could not sign listing message. Try a different wallet or method.');
        }
        throw signError;
      }

      const apiData = {
        nftContract: listingData.nftContract,
        tokenId: listingData.tokenId,
        price: priceWei,
        listingType: listingData.listingType || 'fixed',
        network,
        seller: address,
        signature,
        nonce,
        startTime,
        parentNftId: listingData.parentNftId,
      };
      if (endTime) apiData.endTime = endTime;
      if (listingData.listingType === 'auction') {
        apiData.minimumBid = listingData.minimumBid;
      }

      const result = await marketplaceAPI.createListing(apiData);
      toast.success('Listing created successfully!');
      return result;
    } catch (error) {
      console.error('Failed to create listing:', error);
      // Avoid double-toasting if we already showed a signing-specific message.
      if (!error?._toastShown) {
        toast.error(error.message || 'Failed to create listing');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, selectedChain, resolveMarketplaceContractAddress]);

  return {
    isLoading,
    createListing,
    executeSale,
  };
};

// Helper function to get chain ID from network name
function getChainId(network) {
  const chainIds = {
    ethereum: 1,
    polygon: 137,
    bsc: 56,
    arbitrum: 42161,
    base: 8453,
  };
  return chainIds[network?.toLowerCase()] || 1;
}