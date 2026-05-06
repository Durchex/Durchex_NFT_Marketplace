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

  // Create EIP-712 signature for listing
  const createListingSignature = useCallback(async (listingData) => {
    if (!signer || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const network = selectedChain || 'ethereum';
      const contractAddress = await resolveMarketplaceContractAddress(network);

      const domain = {
        ...MARKETPLACE_DOMAIN,
        chainId: getChainId(network),
        verifyingContract: contractAddress,
      };

      const message = {
        nftContract: listingData.nftContract,
        tokenId: listingData.tokenId,
        price: ethers.utils.parseEther(listingData.price.toString()),
        listingType: listingData.listingType || 0, // 0 = fixed price
        startTime: listingData.startTime || Math.floor(Date.now() / 1000),
        endTime: listingData.endTime || 0, // 0 for fixed price
        nonce: listingData.nonce || Math.floor(Math.random() * 1000000),
      };

      const signature = await signer._signTypedData(domain, LISTING_TYPES, message);
      return { signature, message, domain };
    } catch (error) {
      console.error('Failed to create listing signature:', error);
      throw error;
    }
  }, [signer, address, selectedChain, resolveMarketplaceContractAddress]);

  // Create EIP-712 signature for offer
  const createOfferSignature = useCallback(async (offerData) => {
    if (!signer || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const network = selectedChain || 'ethereum';
      const contractAddress = await resolveMarketplaceContractAddress(network);

      const domain = {
        ...MARKETPLACE_DOMAIN,
        chainId: getChainId(network),
        verifyingContract: contractAddress,
      };

      const message = {
        listingId: offerData.listingId,
        price: ethers.utils.parseEther(offerData.price.toString()),
        expiry: offerData.expiry || Math.floor(Date.now() / 1000) + 86400, // 24 hours
        nonce: offerData.nonce || Math.floor(Math.random() * 1000000),
      };

      const signature = await signer._signTypedData(domain, OFFER_TYPES, message);
      return { signature, message, domain };
    } catch (error) {
      console.error('Failed to create offer signature:', error);
      throw error;
    }
  }, [signer, address, selectedChain, resolveMarketplaceContractAddress]);

  // Create a marketplace listing
  const createListing = useCallback(async (listingData) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      // Create signature
      const { signature, message } = await createListingSignature(listingData);

      // Prepare listing data for API
      const apiData = {
        nftContract: listingData.nftContract,
        tokenId: listingData.tokenId,
        price: listingData.price,
        listingType: listingData.listingType || 'fixed',
        network: selectedChain || 'ethereum',
        signature,
        message,
        seller: address,
      };

      // Add auction-specific fields if it's an auction
      if (listingData.listingType === 'auction') {
        apiData.startTime = listingData.startTime;
        apiData.endTime = listingData.endTime;
        apiData.minimumBid = listingData.minimumBid;
      }

      const result = await marketplaceAPI.createListing(apiData);
      toast.success('Listing created successfully!');
      return result;
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast.error(error.message || 'Failed to create listing');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, selectedChain, createListingSignature]);

  // Execute a sale (purchase)
  const executeSale = useCallback(async (listingId, price) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      const saleData = {
        listingId,
        buyer: address,
        price,
        network: selectedChain || 'ethereum',
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

  // Create an offer
  const createOffer = useCallback(async (offerData) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      // Create signature
      const { signature, message } = await createOfferSignature(offerData);

      // Prepare offer data for API
      const apiData = {
        listingId: offerData.listingId,
        price: offerData.price,
        expiry: offerData.expiry,
        signature,
        message,
        buyer: address,
        network: selectedChain || 'ethereum',
      };

      const result = await marketplaceAPI.createOffer(apiData);
      toast.success('Offer submitted successfully!');
      return result;
    } catch (error) {
      console.error('Failed to create offer:', error);
      toast.error(error.message || 'Failed to submit offer');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, selectedChain, createOfferSignature]);

  // Cancel a listing
  const cancelListing = useCallback(async (listingId) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      const result = await marketplaceAPI.cancelListing(listingId);
      toast.success('Listing cancelled successfully!');
      return result;
    } catch (error) {
      console.error('Failed to cancel listing:', error);
      toast.error(error.message || 'Failed to cancel listing');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    isLoading,
    createListing,
    executeSale,
    createOffer,
    cancelListing,
    createListingSignature,
    createOfferSignature,
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