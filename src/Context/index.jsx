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
    // Get cart from localStorage if it exists
    const storedCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
    if (storedCart.length > 0) {
      setCartItems(storedCart);
    } else {
      const addressString = address.toLowerCase().toString();
      fetch(`https://backend-2wkx.onrender.com/api/v1/cart/cart/${addressString}`)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          setCartItems(data);
          localStorage.setItem("cartItems", JSON.stringify(data));
        })
        .catch((err) => console.error("Error fetching cart:", err));
    }
  };


  useEffect(() => {
    if (address) {
      fetchCartItems();
    }
  }, [address]);
  useEffect(() => {
    fetchCartItems();
  }, []);

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
      const tx = await ContractInstance.publicMint(uri, nftMarketplaceAddress, {
        // value: ethers.utils.parseEther(price.toString())
        value: ethers.utils.parseEther("0.01"),
        gasLimit: 700000,
      });

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
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

  const buyNFT = async (nftContractAddress, itemIds, prices) => {
    console.log("🚀 ~ buyNFT ~ price:", prices);
    console.log("🚀 ~ buyNFT ~ itemIds:", itemIds);
    try {
      console.log("🚀 ~ publicMint ~ ContractInstance:", nftContractAddress);

      const itemId = ethers.BigNumber.from(itemIds);
      const price = ethers.utils.formatEther(prices);

      const networkName = selectedChain.toLowerCase();
      const MarketContractInstance = await getNFTMarketplaceContracts(
        networkName
      );
      const tx = await MarketContractInstance.buyNFT(
        nftContractAddress,
        itemId,
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
