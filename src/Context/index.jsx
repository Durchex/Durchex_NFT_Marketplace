import axios from "axios";
import { ethers } from "ethers";
import React, { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { nftService, formatNFTForCache } from "../services/nftService";

//INTERNAL IMPORT
import {
  ContractInstance,
  MarketContractInstance,
  NFTMarketplaceCONTRACT,
  VendorNFTs_CONTRACT,
  PINATA_API_KEY,
  PINATA_SECRET_KEY,
  shortenAddress,
} from "./constants";

export const ICOContent = createContext();

export const Index = ({ children }) => {
  //STATE VARIABLES
  const [address, setAddress] = useState("");
  const [accountBalance, setAccountBalance] = useState(null);
  const [loader, setLoader] = useState(false);
  const [currency, setCurrency] = useState("MATIC");
  const [selectedNetwork, setSelectedNetwork] = useState({
    name: "Ethereum",
    symbol: "ETH",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
    chainId: 1
  });

  // Helper function for error notifications
  const notifyError = (message) => {
    toast.error(message);
  };

  //FUNCTION
  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) return;
      
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setAddress(accounts[0]);

        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const getbalance = await provider.getBalance(accounts[0]);
          const bal = ethers.utils.formatEther(getbalance);
          setAccountBalance(bal);
        } catch (networkError) {
          console.warn("Network detection failed, using fallback:", networkError.message);
          setAccountBalance("0");
        }
        
        return accounts[0];
      }
    } catch (error) {
      console.warn("Wallet connection check failed:", error.message);
      // Silently handle errors in automatic check
    }
  };

  useEffect(() => {
    // Only check wallet connection on initial load
    if (!address) {
      checkIfWalletConnected();
    }

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setAddress("");
          setAccountBalance("0");
        } else {
          // User switched accounts
          setAddress(accounts[0]);
          checkIfWalletConnected();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []); // Empty dependency array - only run on mount

  const connectWallet = async () => {
    if (!window.ethereum) {
      notifyError("No account available");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length) {
        setAddress(accounts[0]);

        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const getbalance = await provider.getBalance(accounts[0]);
          const bal = ethers.utils.formatEther(getbalance);
          setAccountBalance(bal);
        } catch (networkError) {
          console.warn("Network detection failed, using fallback:", networkError.message);
          setAccountBalance("0");
        }
        
        // Only show success message when connection is successful
        toast.success("Wallet connected successfully!");
        return accounts[0];
      } else {
        notifyError("No account found");
      }
    } catch (error) {
      console.log(error);
      setLoader(false);
      if (error.code === 4001) {
        notifyError("User rejected the connection request");
      } else {
        notifyError("Error connecting wallet");
      }
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setAccountBalance("0");
    toast.success("Wallet disconnected successfully!");
  };

  //! MAIN FUNCTION
  const ethereumUsd = async () => {
    try {
      var ETH_USD = await axios.get(
        "https://www.binance.com/bapi/composite/v1/public/promo/cmc/cryptocurrency/quotes/latest?id=1839%2C1%2C1027%2C5426%2C52%2C3890%2C2010%2C5805%2C4206",
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      return ETH_USD.data.data.body.data[1027].quote.USD.price;
    } catch (error) {
      console.log("Error fetching ETH price:", error);
      // Return a default price if API fails
      return 2000; // Default ETH price
    }
  };

  //* VendorNFT  Functions
  const getAllVendors = async () => {
    try {
      if (!ContractInstance) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      const response = await ContractInstance.getAllVendors();
      console.log("🚀 ~ getAllVendors ~ response:", response);
      // WarringToast("Waiting for transaction ....");
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const isAuthorizedVendor = async (address) => {
    try {
      if (!ContractInstance) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      const response = await ContractInstance.isAuthorizedVendor(address);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const addVendor = async (VendorAddress) => {
    try {
      if (!ContractInstance) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      const response = await ContractInstance.addVendor(VendorAddress);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const removeVendor = async (VendorAddress) => {
    try {
      if (!ContractInstance) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      const response = await ContractInstance.removeVendor(VendorAddress);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const vendorMint = async (uri, nftMarketplaceAddress) => {
    try {
      if (!ContractInstance) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      const response = await ContractInstance.vendorMint(
        uri,
        nftMarketplaceAddress
      );

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const publicMint = async (uri, nftMarketplaceAddress) => {
    try {
      if (!ContractInstance) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      const response = await ContractInstance.publicMint(
        uri,
        nftMarketplaceAddress,
        {
          // value: ethers.utils.parseEther(price.toString())
          value: ethers.utils.parseEther("0.00001"),
          gasLimit: 360000,
        }
      );

      // WarringToast("Waiting for transaction ....");
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const withdraw = async (_account) => {
    try {
      if (!ContractInstance) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      const response = await ContractInstance.withdraw();
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const setMintingFee = async (newFee) => {
    try {
      const newFees = ethers.utils.parseUnits(newFee, "ether");
      const uint256Value = ethers.BigNumber.from(newFees);
      const response = await ContractInstance.setMintingFee(uint256Value);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const getNFTById_ = async (id) => {
    try {
      const contract = await VendorNFTs_CONTRACT();
      const response = await contract.getNFTById(id);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const tokenURI = async (tokenId) => {
    try {
      const contract = await VendorNFTs_CONTRACT();
      const response = await contract.tokenURI(tokenId);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  //*  WRITE FUNCTIONS for MarketPlace
  const listNFT = async (nftContractAddress, tokenIds, prices) => {
    console.log("🚀 ~ listNFT ~ prices:", prices);
    try {
      const listingFe = await getListingFee();

      const listingFeeInEther = ethers.utils.formatEther(listingFe);
      console.log("Listing Fee (in Ether):", listingFeeInEther);

      const price = ethers.utils.parseUnits(prices, "ether");
      const fees = ethers.utils.parseUnits(prices, "ether");
      const uint256Value = ethers.BigNumber.from(price);
      const listingFee = ethers.BigNumber.from(listingFe);
      console.log("🚀 ~ listNFT ~ listingFee:", listingFee);
      const tokenId = ethers.BigNumber.from(tokenIds);

      const response = await MarketContractInstance.listNFT(
        nftContractAddress,
        tokenId,
        uint256Value,
        {
          value: ethers.utils.parseEther(listingFeeInEther.toString()),
        }
      );

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const buyNFT = async (nftContractAddress, itemIds, prices) => {
    console.log("🚀 ~ buyNFT ~ price:", prices);
    console.log("🚀 ~ buyNFT ~ itemIds:", itemIds);
    try {
      console.log("🚀 ~ publicMint ~ ContractInstance:", nftContractAddress);

      const itemId = ethers.BigNumber.from(itemIds);
      const price = ethers.utils.formatEther(prices);

      const response = await MarketContractInstance.buyNFT(
        nftContractAddress,
        itemId,
        {
          value: ethers.utils.parseEther(price.toString()), // Amount of ETH to send
          // gasPrice: ethers.utils.parseUnits("20", "gwei")
          gasLimit: 360000,
        }
      );

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const updatePointThreshold = async (Threshold) => {
    try {
      console.log("🚀 ~ number:", Threshold);

      const newFee = ethers.utils.parseUnits(Threshold, "ether");
      const uint256Value = ethers.BigNumber.from(newFee);

      const response = await MarketContractInstance.setPointThreshold(
        uint256Value
      );

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const updatePointsPerTransaction = async (newpoint) => {
    try {
      console.log("🚀 ~ number:", newpoint);

      const newFee = ethers.utils.parseUnits(newpoint, "ether");
      const uint256Value = ethers.BigNumber.from(newFee);

      const response = await MarketContractInstance.setPointsPerTransaction(
        uint256Value
      );

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const checkEligibleForAirdrop = async (address) => {
    try {
      console.log("🚀 ~ number:", address.toString());
      const response = await MarketContractInstance.isEligibleForAirdrop(
        "0x6b9ebd1dd653c48daa4b167491373bcbf8d7712c"
      );
      const responses = await MarketContractInstance.isEligibleForAirdrop(
        "0x6b9ebd1dd653c48daa4b167491373bcbf8d7712c"
      );

      console.log("🚀 ~ number:", address);

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const updateListingFee = async (newListingFee) => {
    try {
      console.log("🚀 ~ number:", newListingFee);

      const newFee = ethers.utils.parseUnits(newListingFee, "ether");
      const uint256Value = ethers.BigNumber.from(newFee);

      const response = await MarketContractInstance.updateListingFee(
        uint256Value
      );

      console.log("Waiting for transaction ....");
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  //?  READ FUNCTIONS
  const getListingFee = async () => {
    try {
      const response = await MarketContractInstance.getListingFee();

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const getActiveListings = async () => {
    try {
      const contract = await NFTMarketplaceCONTRACT();
      if (!contract) {
        console.log("Contract is null, returning empty array");
        return [];
      }
      const response = await contract.getActiveListings();
      console.log("🚀 ~ getActiveListings ~ response:", response);

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return [];
    }
  };

  const getAllListings = async () => {
    try {
      const contract = await NFTMarketplaceCONTRACT();
      if (!contract) {
        console.log("Contract is null, returning empty array");
        return [];
      }
      const response = await contract.getAllListings();

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return [];
    }
  };

  const getMyNFTs = async () => {
    try {
      const response = await MarketContractInstance.getMyNFTs();

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const getNFTById = async (itemIds) => {
    try {
      console.log("🚀 ~ itemID:", itemId);

      let itemId = itemIds.toNumber();
      const response = await MarketContractInstance.getNFTById(itemId);

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  // Helper function to fetch metadata from Pinata using the tokenURI
  async function fetchMetadataFromPinata(tokenUrl) {
    try {
      const response = await fetch(tokenUrl); // tokenURI points to metadata hosted on IPFS
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error("Error fetching metadata from Pinata:", error);
      return {}; // return an empty object if there's an error
    }
  }

  // Enhanced function to fetch and cache NFT metadata
  async function fetchAndCacheNFTMetadata(blockchainData) {
    try {
      // First try to get from cache
      const cachedNFT = await nftService.getNFT(
        'ethereum-sepolia',
        blockchainData.itemId?.toString(),
        blockchainData.tokenId?.toString()
      );

      if (cachedNFT) {
        return cachedNFT;
      }

      // If not in cache, fetch from blockchain and IPFS
      const tokenUrl = await tokenURI(blockchainData.tokenId);
      const metadata = await fetchMetadataFromPinata(tokenUrl);

      // Format and cache the NFT data
      const formattedNFT = formatNFTForCache(blockchainData, metadata);
      await nftService.cacheNFTMetadata(formattedNFT);

      return formattedNFT;
    } catch (error) {
      console.error("Error fetching and caching NFT metadata:", error);
      // Return basic blockchain data if caching fails
      return formatNFTForCache(blockchainData, {});
    }
  }

  return (
    <ICOContent.Provider
      value={{
        isAuthorizedVendor,
        getAllVendors,
        checkEligibleForAirdrop,
        updateListingFee,
        getNFTById_,
        getNFTById,
        getMyNFTs,
        buyNFT,
        getAllListings,
        addVendor,
        removeVendor,
        withdraw,
        tokenURI,
        fetchMetadataFromPinata,
        fetchAndCacheNFTMetadata,
        getActiveListings,
        getListingFee,
        updatePointThreshold,
        updatePointsPerTransaction,
        connectWallet,
        disconnectWallet,
        setMintingFee,
        vendorMint,
        publicMint,
        PINATA_API_KEY,
        PINATA_SECRET_KEY,
        address,
        setAddress,
        listNFT,
        accountBalance,
        setAccountBalance,
        setLoader,
        currency,
        shortenAddress,
        nftService,
        selectedNetwork,
        setSelectedNetwork,
      }}
    >
      {children}
    </ICOContent.Provider>
  );
};
