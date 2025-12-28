import axios from "axios";
import { ethers } from "ethers";
import React, { createContext, useEffect, useState } from "react";
import { ErrorToast } from "../app/Toast/Error.jsx";
import VendorNFT from "./VendorNFT.json";
import MarketPlace from "./NFTMarketplace.json";

//INTERNAL IMPORT
import {
  NFTMarketplaceCONTRACT,
  VendorNFTs_CONTRACT,
  PINATA_API_KEY,
  PINATA_SECRET_KEY,
  shortenAddress,
  getNFTMarketplaceContract,
  getNFTMarketplaceContracts,
  getVendorNFTContracts,
  getVendorNFTContract,
  contractAddresses,
} from "./constants";

export const ICOContent = createContext();

export const Index = ({ children }) => {
  //STATE VARIABLES
  const [address, setAddress] = useState("");
  const [accountBalance, setAccountBalance] = useState(null);
  const [loader, setLoader] = useState(false);
  const [currency, setCurrency] = useState("MATIC");
  const [selectedChain, setSelectedChain] = useState("polygon");
  const [cartItems, setCartItems] = useState([]);

  //FUNCTION
  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) return ErrorToast("No account found");
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setAddress(accounts[0]);

        let provider;
        let getbalance;

        if (typeof window !== "undefined" && window.ethereum) {
          provider = new ethers.providers.Web3Provider(window.ethereum);
          getbalance = await provider.getBalance(accounts[0]);
        } else {
          console.error(
            "No Ethereum provider found! Make sure MetaMask or another wallet is installed."
          );
        }

        const bal = ethers.utils.formatEther(getbalance);
        setAccountBalance(bal);
        return accounts[0];
      } else {
        setAddress(null);
        setAccountBalance(null);
        console.log("Wallet disconnected");
        // ErrorToast("Connect you Wallet");
        console.log("error");
      }
    } catch (error) {
      console.log(error);
      // notifyError("Please install Metamask");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setAddress(null);
          setAccountBalance(null);
          ErrorToast("Wallet disconnected");
          console.log("Wallet disconnected");
        } else {
          checkIfWalletConnected(); // Re-check connection when account changes
        }
      });

      window.ethereum.on("disconnect", () => {
        setAddress(null);
        setAccountBalance(null);
        console.log("Wallet disconnected");
      });

      // Cleanup listeners on component unmount
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          checkIfWalletConnected
        );
        window.ethereum.removeListener("disconnect", checkIfWalletConnected);
      };
    }
  }, []);

  useEffect(() => {
    checkIfWalletConnected();
  }, [address]);

  const connectWallet = async () => {
    if (!window.ethereum) return notifyError("No account available");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length) {
        setAddress(accounts[0]);

        let provider;
        let getbalance;

        if (typeof window !== "undefined" && window.ethereum) {
          provider = new ethers.providers.Web3Provider(window.ethereum);
          getbalance = await provider.getBalance(accounts[0]);
        } else {
          console.error(
            "No Ethereum provider found! Make sure MetaMask or another wallet is installed."
          );
        }

        const bal = ethers.utils.formatEther(getbalance);
        setAccountBalance(bal);
        return accounts[0];
      } else {
        ErrorToast("No account found");
      }
    } catch (error) {
      console.log(error);
      setLoader(false);
      ErrorToast("Error connecting wallet");
    }
  };

  //* CART FUNCTIONS

  //FUNCTION: Fetch cart from Local Storage or API
  const fetchCartItems = () => {
    const storedCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
    if (storedCart.length > 0) {
      setCartItems(storedCart);
      return;
    }

    if (!address) return; // Guard: no address yet

    const addressString = address?.toLowerCase?.().toString?.();
    if (!addressString) return;

    fetch(`https://backend-2wkx.onrender.com/api/v1/cart/cart/${addressString}`)
      .then(async (res) => {
        if (!res.ok) {
          // 404 or other non-JSON responses
          throw new Error(`Cart request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setCartItems(Array.isArray(data) ? data : []);
        localStorage.setItem("cartItems", JSON.stringify(Array.isArray(data) ? data : []));
      })
      .catch((err) => console.error("Error fetching cart:", err));
  };


  useEffect(() => {
    if (address) {
      fetchCartItems();
    }
  }, [address]);

  //! MAIN FUNCTION
  const ethereumUsd = async () => {
    try {
      var ETH_USD = await axios.get(
        "https://www.binance.com/bapi/composite/v1/public/promo/cmc/cryptocurrency/quotes/latest?id=1839%2C1%2C1027%2C5426%2C52%2C3890%2C2010%2C5805%2C4206"
      );

      return ETH_USD.data.data.body.data[1027].quote.USD.price;
    } catch (error) {
      console.log(error);
    }
  };

  //* VendorNFT  Functions
  const getAllVendors = async () => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContract(networkName);
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
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContract(networkName);
      const response = await ContractInstance.isAuthorizedVendor(address);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const addVendor = async (VendorAddress) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);

      const response = await ContractInstance.addVendor(VendorAddress);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const removeVendor = async (VendorAddress) => {
    try {

      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
      const tx = await ContractInstance.removeVendor(VendorAddress);
      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const vendorMint = async (uri, nftMarketplaceAddress) => {
    console.log(
      "🚀 ~ vendorMint ~ nftMarketplaceAddress:",
      nftMarketplaceAddress
    );
    if (!nftMarketplaceAddress || nftMarketplaceAddress.length === 0) {
      console.log("Invalid nftMarketplaceAddress:", nftMarketplaceAddress);
      return;
    }
    if (!uri || uri.length === 0) {
      console.log("Invalid URI:", uri);
      return;
    }

    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
      const tx = await ContractInstance.vendorMint(uri, nftMarketplaceAddress);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const vendorBatchMintMint = async (uri) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
      const tx = await ContractInstance.vendorBatchMint(uri);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const publicMint = async (uri, nftMarketplaceAddress) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
      console.log("🚀 ~ publicMint ~ ContractInstance:", ContractInstance);
      
      // Get minting fee from contract (dynamic, not hardcoded 0.01 ETH)
      let mintingFee = ethers.utils.parseEther("0.001"); // Default fallback
      try {
        mintingFee = await ContractInstance.getMintingFee();
        console.log("Retrieved minting fee from contract:", ethers.utils.formatEther(mintingFee), "ETH");
      } catch (feeError) {
        console.warn("Could not fetch minting fee from contract, using default 0.001 ETH");
      }
      
      // Estimate gas to calculate exact required balance
      let gasEstimate = ethers.BigNumber.from(700000);
      try {
        gasEstimate = await ContractInstance.estimateGas.publicMint(uri, nftMarketplaceAddress, { value: mintingFee });
        console.log("Estimated gas for minting:", gasEstimate.toString());
      } catch (gasError) {
        console.warn("Gas estimation failed, using fallback:", gasError.message);
      }
      
      // Get current gas price from network
      const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' });
      const gasCostInWei = gasEstimate.mul(gasPrice);
      const totalCostInWei = mintingFee.add(gasCostInWei);
      
      console.log("Minting fee:", ethers.utils.formatEther(mintingFee), "ETH");
      console.log("Estimated gas cost:", ethers.utils.formatEther(gasCostInWei), "ETH");
      console.log("Total required balance:", ethers.utils.formatEther(totalCostInWei), "ETH");
      
      // Verify user has sufficient balance
      let userBalance = accountBalance;
      if (!userBalance) {
        try {
          const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = ethersProvider.getSigner();
          const userAddress = await signer.getAddress();
          const balance = await ethersProvider.getBalance(userAddress);
          userBalance = ethers.utils.formatEther(balance);
        } catch (balanceError) {
          console.warn("Could not fetch balance, will attempt transaction anyway");
        }
      }
      
      const userBalanceInWei = ethers.utils.parseEther(userBalance || "0");
      if (userBalanceInWei.lt(totalCostInWei)) {
        const shortfallInWei = totalCostInWei.sub(userBalanceInWei);
        throw new Error(`Insufficient balance. Need ${ethers.utils.formatEther(totalCostInWei)} ETH but have ${userBalance} ETH (short by ${ethers.utils.formatEther(shortfallInWei)} ETH)`);
      }
      
      // Execute transaction with only required amount
      const tx = await ContractInstance.publicMint(uri, nftMarketplaceAddress, {
        value: mintingFee,
        gasLimit: gasEstimate.mul(ethers.BigNumber.from(120)).div(ethers.BigNumber.from(100)), // 120% buffer for safety
      });

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      console.log("✅ Minting completed! Only used required amount, not hardcoded 0.01 ETH");
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  async function getNFTOwner(tokenId) {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
      const owner = await ContractInstance.ownerOf(tokenId);
      console.log(`NFT Owner: ${owner}`);
      return owner;
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const withdraw = async (_account) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
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
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
      const response = await ContractInstance.setMintingFee(uint256Value);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const getNFTById_ = async (id) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContract(networkName);
      const response = await ContractInstance.getNFTById(id);
      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in addVendor ( Hook )");
      return error;
    }
  };

  const tokenURI = async (tokenId) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContract(networkName);
      const response = await ContractInstance.tokenURI(tokenId);
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
      // console.log("🚀 ~ listNFT ~ listingFe:", listingFe)

      const listingFeeInEther = ethers.utils.formatEther(listingFe);
      console.log("Listing Fee (in Ether):", listingFeeInEther);

      const price = ethers.utils.parseUnits(prices, "ether");
      const fees = ethers.utils.parseUnits(prices, "ether");
      const uint256Value = ethers.BigNumber.from(price);
      const listingFee = ethers.BigNumber.from(listingFe);
      console.log("🚀 ~ listNFT ~ listingFee:", listingFee);
      const tokenId = ethers.BigNumber.from(tokenIds);

      console.log(
        "🚀 ~ listNFT ~ nftContractAddress,",
        nftContractAddress,
        tokenId,
        uint256Value
      );

      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );

      // 🛡️ 1. Create an instance of the NFT contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(
        nftContractAddress,
        VendorNFT.abi,
        signer
      );

      // 🛡️ 2. Check approval
      const approvedAddress = await nftContract.getApproved(tokenId);

      if (
        approvedAddress.toLowerCase() !==
        MarketContractInstance.address.toLowerCase()
      ) {
        console.log("Marketplace not approved yet. Approving...");

        const approveTx = await nftContract.approve(
          MarketContractInstance.address,
          tokenId
        );
        await approveTx.wait();

        console.log("✅ NFT approved for marketplace.");
      } else {
        console.log("✅ Marketplace already approved for this token.");
      }

      const tx = await MarketContractInstance.listNFT(
        nftContractAddress,
        tokenId,
        uint256Value,
        {
          value: ethers.utils.parseEther(listingFeeInEther.toString()),
          gasLimit: 3600000,
        }
      );

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const editNftPrices = async (itemIds, prices) => {
    console.log("🚀 ~ listNFT ~ prices:", prices);
    try {
      const price = ethers.utils.parseUnits(prices, "ether");
      const values = ethers.BigNumber.from(price);
      const itemId = ethers.BigNumber.from(itemIds);
      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );
      const tx = await MarketContractInstance.editNftPrice(itemId, values, {
        // value: ethers.utils.parseEther(listingFeeInEther.toString()),
        gasLimit: 360000,
      });

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };
  const delistNFTs = async (itemIds) => {
    try {
      console.log("🚀 ~ delistNFTs ~ itemId:", itemIds);
      const itemId = ethers.BigNumber.from(itemIds);
      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );
      const tx = await MarketContractInstance.delistNFT(itemId.toString());

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const buyNFT = async (nftContractAddress, itemIds, prices, nftNetwork = null) => {
    console.log("🚀 ~ buyNFT ~ price:", prices);
    console.log("🚀 ~ buyNFT ~ itemIds:", itemIds);
    console.log("🚀 ~ buyNFT ~ nftNetwork:", nftNetwork);
    
    if (!window.ethereum) {
      throw new Error("No crypto wallet found. Please install MetaMask or another Web3 wallet.");
    }

    try {
      // Determine the network to use - prioritize NFT's listing network
      const targetNetwork = (nftNetwork || selectedChain).toLowerCase();
      console.log("🚀 ~ buyNFT ~ targetNetwork:", targetNetwork);

      // Import changeNetwork function
      const { changeNetwork } = await import("./constants");
      
      // Switch wallet to the NFT's network before purchase
      try {
        await changeNetwork(targetNetwork);
        // Wait a moment for network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (networkError) {
        console.error("Network switch error:", networkError);
        throw new Error(`Failed to switch to ${targetNetwork} network. Please switch manually in your wallet.`);
      }

      const itemId = ethers.BigNumber.from(itemIds);
      const price = ethers.utils.formatEther(prices);

      // Get marketplace contract for the NFT's network
      const MarketContractInstance = await getNFTMarketplaceContracts(
        targetNetwork
      );

      if (!MarketContractInstance) {
        throw new Error(`No marketplace contract found for network: ${targetNetwork}`);
      }

      console.log("🚀 ~ buyNFT ~ Calling smart contract on network:", targetNetwork);
      console.log("🚀 ~ buyNFT ~ Contract address:", MarketContractInstance.address);
      console.log("🚀 ~ buyNFT ~ Purchase amount:", price, "ETH");

      // Get buyer address from the signer (current user making the purchase)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const buyerAddress = await signer.getAddress();

      console.log("🚀 ~ buyNFT ~ Buyer address:", buyerAddress);

      // Execute the purchase transaction on the NFT's network
      const tx = await MarketContractInstance.buyNFT(
        nftContractAddress,
        itemId,
        {
          value: ethers.utils.parseEther(price.toString()), // Amount to send in ETH
          gasLimit: 360000,
        }
      );

      console.log("🚀 ~ buyNFT ~ Transaction sent:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      console.log("🚀 ~ buyNFT ~ Transaction confirmed:", receipt);
      console.log("🚀 ~ buyNFT ~ Gas used:", receipt.gasUsed.toString());

      // Store purchase record with buyer address for seller verification
      try {
        // Import API to store purchase
        const { nftAPI } = await import("../services/api");
        await nftAPI.createPendingTransfer({
          network: targetNetwork,
          itemId: itemId.toString(),
          nftContract: nftContractAddress,
          buyerAddress: buyerAddress.toLowerCase(),
          sellerAddress: receipt.from?.toLowerCase() || null, // From transaction if available
          transactionHash: receipt.transactionHash,
        });
        console.log("🚀 ~ buyNFT ~ Purchase record stored for seller verification");
      } catch (apiError) {
        console.error("Failed to store purchase record:", apiError);
        // Don't fail the purchase if API call fails
      }
      
      return receipt;
    } catch (error) {
      console.error("Buy NFT error:", error);
      
      // Provide user-friendly error messages
      if (error.code === 4001) {
        throw new Error("Transaction was rejected by user");
      } else if (error.code === -32603) {
        throw new Error("Transaction failed. Please check you have enough balance for the purchase and gas fees.");
      } else if (error.message?.includes("network")) {
        throw error;
      } else {
        throw new Error(`Failed to purchase NFT: ${error.message || error}`);
      }
    }
  };

  const placeOffers = async (nftContractAddress, price) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );
      const tx = await MarketContractInstance.placeOffer(nftContractAddress, {
        value: ethers.utils.parseEther(price.toString()), // Amount of ETH to send
        // gasPrice: ethers.utils.parseUnits("20", "gwei")
        gasLimit: 360000,
      });

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  // Transfer NFT from current owner to a new owner (seller verification step)
  const transferNFT = async (
    nftContractAddress,
    tokenId,
    newOwnerAddress
  ) => {
    try {
      if (!address) throw new Error("Connect your wallet to proceed");
      if (!ethers.utils.isAddress(newOwnerAddress)) {
        throw new Error("Invalid recipient address");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Minimal ERC721 ABI for transfer
      const erc721Abi = [
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function isApprovedForAll(address owner, address operator) view returns (bool)",
        "function getApproved(uint256 tokenId) view returns (address)",
        "function setApprovalForAll(address operator, bool approved)",
        "function approve(address to, uint256 tokenId)",
        "function safeTransferFrom(address from, address to, uint256 tokenId)"
      ];

      const nftContract = new ethers.Contract(
        nftContractAddress,
        erc721Abi,
        signer
      );

      // Ensure caller is current owner
      const currentOwner = await nftContract.ownerOf(tokenId);
      if (currentOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Only the current owner can transfer this NFT");
      }

      // Perform transfer
      const tx = await nftContract.safeTransferFrom(
        address,
        newOwnerAddress,
        tokenId
      );
      const receipt = await tx.wait();

      return receipt;
    } catch (error) {
      console.error("transferNFT error:", error);
      throw error;
    }
  };

  const editOffers = async (nftContractAddress, itemIds, price) => {
    try {
      console.log("🚀 ~ publicMint ~ ContractInstance:", nftContractAddress);

      const offerId = ethers.BigNumber.from(itemIds);

      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );

      const tx = await MarketContractInstance.editOffer(
        nftContractAddress,
        offerId,
        {
          value: ethers.utils.parseEther(price.toString()), // Amount of ETH to send
          // gasPrice: ethers.utils.parseUnits("20", "gwei")
          gasLimit: 360000,
        }
      );

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const cancelOffers = async (nftContractAddress, itemIds) => {
    try {
      console.log("🚀 ~ publicMint ~ ContractInstance:", nftContractAddress);
      const offerId = ethers.BigNumber.from(itemIds);

      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );

      const tx = await MarketContractInstance.cancelOffer(
        nftContractAddress,
        offerId
      );

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const acceptOffers = async (nftContractAddress, itemIds, tokenIds) => {
    try {
      console.log("🚀 ~ publicMint ~ ContractInstance:", nftContractAddress);
      const itemId = ethers.BigNumber.from(itemIds);
      console.log("🚀 ~ acceptOffers ~ itemId:", itemId);
      const tokenId = ethers.BigNumber.from(tokenIds);
      console.log("🚀 ~ acceptOffers ~ tokenId:", tokenId);

      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );

      const tx = await MarketContractInstance.acceptOffer(
        nftContractAddress,
        itemId,
        tokenId
      );

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const getOffer = async (nftContractAddress) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContract(
        networkName
      );

      const receipt = await MarketContractInstance.getOffers(nftContractAddress);

      console.log("Transaction confirmed:", receipt);
      return receipt;
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

      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );

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

      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );

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
      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );
      const response = await MarketContractInstance.isEligibleForAirdrop(address.toString());

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
  const getUserStatu = async (address) => {
    try {
      console.log("🚀 ~ number:", address.toString());
      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContract(
        networkName
      );
      const response = await MarketContractInstance.getUserStatus(address);

      console.log("🚀 ~ number:", response);

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const updateListingFee = async (newListingFee) => {
    try {
      console.log("🚀 ~ number:", newListingFee);

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const newFee = ethers.utils.parseUnits(newListingFee, "ether");
      const uint256Value = ethers.BigNumber.from(newFee);
      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );
      console.log(
        "🚀 ~ updateListingFee ~ MarketContractInstance:",
        MarketContractInstance
      );

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

  function formatPOLPrice(weiPrice) {
    const polValue = Number(weiPrice) / 1e18;
    return polValue.toFixed(6) + " POL"; // Format to 6 decimal places
  }

  //?  READ FUNCTIONS
  const getListingFee = async () => {
    try {
      const networkName = selectedChain.toLowerCase();
      const contract = await getNFTMarketplaceContract(networkName);
      const response = await contract.getListingFee();

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const getActiveListings = async () => {
    try {
      const networkName = selectedChain.toLowerCase();
      const contract = await getNFTMarketplaceContract(networkName);
      const response = await contract.getActiveListings();

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const getAllListings = async () => {
    try {
      const networkName = selectedChain.toLowerCase();

      const contract = await getNFTMarketplaceContract(networkName);
      const response = await contract.getAllListings();

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const getMyNFTs = async () => {
    try {
      const networkName = selectedChain.toLowerCase();

      const contract = await getNFTMarketplaceContracts(networkName);
      console.log("🚀 ~ getMyNFTs ~ contract:", contract);
      const response = await contract.getMyNFTs();

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  const getNFTById = async (itemIds) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const contract = await getNFTMarketplaceContract(networkName);

      let itemId = itemIds.toNumber();
      const response = await contract.getNFTById(itemId);

      return response;
    } catch (error) {
      console.log(error + " in useMintNFT in VendorNFT ( Hook )");
      return error;
    }
  };

  // Helper function to fetch metadata from Pinata using the tokenURI
  // async function fetchMetadataFromPinata(tokenUrl) {
  //   console.log("🚀 ~ fetchMetadataFromPinata ~ tokenUrl:", tokenUrl)
  //   try {
  //     const response = await fetch(tokenUrl); // tokenURI points to metadata hosted on IPFS
  //     const metadata = await response.json();
  //     return metadata;
  //   } catch (error) {
  //     console.error("Error fetching metadata from Pinata:", error);
  //     return {}; // return an empty object if there's an error
  //   }
  // }
  const networkName = selectedChain.toLowerCase();
  const contractAddressMarketplace = contractAddresses[networkName]?.vendorNFT;

  async function fetchMetadataFromPinata(tokenUrl) {
    try {
      const response = await fetch(tokenUrl);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error("Expected JSON, got: " + text);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching metadata from Pinata:", error);
      return {};
    }
  }

  const fetchMetadata = async (tokenId) => {
    try {
      const url = await tokenURI(tokenId);
      const parsedFile = await fetchMetadataFromPinata(url);

      return {
        name: parsedFile.name,
        description: parsedFile.description,
        image: parsedFile.image,
        category: parsedFile.category,
        properties: parsedFile.properties,
        royalties: parsedFile.royalties,
      };
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null; // Return null if metadata fetching fails
    }
  };

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
        getActiveListings,
        getListingFee,
        updatePointThreshold,
        updatePointsPerTransaction,
        vendorBatchMintMint,
        connectWallet,
        setMintingFee,
        vendorMint,
        publicMint,
        getNFTOwner,
        fetchCartItems,
        contractAddressMarketplace,
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
        delistNFTs,
        editNftPrices,
        placeOffers,
        editOffers,
        cancelOffers,
        acceptOffers,
        formatPOLPrice,
        getOffer,
        getUserStatu,
        selectedChain,
        setCartItems,
        cartItems,
        setSelectedChain,
        fetchMetadata,
      }}
    >
      {children}
    </ICOContent.Provider>
  );
};
