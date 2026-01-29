import axios from "axios";
import { ethers } from "ethers";
import { createContext, useEffect, useState } from "react";
import { ErrorToast } from "../app/Toast/Error.jsx";
import EthereumProvider from '@walletconnect/ethereum-provider';
import VendorNFT from "./VendorNFT.json";
import MarketPlace from "./NFTMarketplace.json";
import gasService from "../services/gasService";
import { cartAPI } from "../services/api";
import { adminAPI } from "../services/adminAPI";

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
  const [wcProvider, setWcProvider] = useState(null);

  //FUNCTION
  const checkIfWalletConnected = async () => {
    try {
      // Get the wallet provider - check for multiple providers
      let provider = null;
      
      if (typeof window !== "undefined") {
        if (window.ethereum) {
          provider = window.ethereum;
        } else if (window.BinanceChain) {
          provider = window.BinanceChain;
        } else if (window.okxwallet) {
          provider = window.okxwallet;
        } else if (window.tokenpocket) {
          provider = window.tokenpocket;
        } else if (window.safepal) {
          provider = window.safepal;
        }
      }

      if (!provider) {
        setAddress(null);
        setAccountBalance(null);
        return null;
      }

      let accounts;
      try {
        if (provider.request) {
          accounts = await provider.request({
            method: "eth_accounts",
          });
        } else if (provider.accounts) {
          // Legacy wallet support
          accounts = provider.accounts;
        } else {
          return null;
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        return null;
      }

      if (accounts && accounts.length > 0) {
        const walletAddress = accounts[0];
        setAddress(walletAddress);
        // Store in localStorage for API authentication
        try {
          localStorage.setItem('walletAddress', walletAddress);
        } catch (e) {
          console.warn('Could not store wallet address in localStorage:', e);
        }

        let ethersProvider;
        let getbalance;

        try {
          if (typeof window !== "undefined" && provider) {
            ethersProvider = new ethers.providers.Web3Provider(provider);
            getbalance = await ethersProvider.getBalance(walletAddress);
            const bal = ethers.utils.formatEther(getbalance);
            setAccountBalance(bal);
          } else {
            console.error(
              "No Ethereum provider found! Make sure MetaMask or another wallet is installed."
            );
            setAccountBalance("0");
          }
        } catch (balanceError) {
          console.error("Error fetching balance:", balanceError);
          setAccountBalance("0");
        }

        return walletAddress;
      } else {
        setAddress(null);
        setAccountBalance(null);
        console.log("Wallet disconnected");
        return null;
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      setAddress(null);
      setAccountBalance(null);
      return null;
    }
  };

  useEffect(() => {
    // Get the wallet provider
    let provider = null;
    if (typeof window !== "undefined") {
      if (window.ethereum) {
        provider = window.ethereum;
      } else if (window.BinanceChain) {
        provider = window.BinanceChain;
      } else if (window.okxwallet) {
        provider = window.okxwallet;
      } else if (window.tokenpocket) {
        provider = window.tokenpocket;
      } else if (window.safepal) {
        provider = window.safepal;
      }
    }

    if (provider) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAddress(null);
          setAccountBalance(null);
          ErrorToast("Wallet disconnected");
          console.log("Wallet disconnected");
        } else {
          checkIfWalletConnected(); // Re-check connection when account changes
        }
      };

      const handleDisconnect = () => {
        setAddress(null);
        setAccountBalance(null);
        console.log("Wallet disconnected");
      };

      const handleChainChanged = (chainId) => {
        // Update state when chain changes
        // Reload only if necessary to ensure state is synced
        // Some wallets require this for proper state management
        console.log("Chain changed to:", chainId);
        // Re-check wallet connection to sync with new chain
        checkIfWalletConnected();
      };

      // Add event listeners
      if (provider.on) {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("disconnect", handleDisconnect);
        provider.on("chainChanged", handleChainChanged);
      } else if (provider.addListener) {
        provider.addListener("accountsChanged", handleAccountsChanged);
        provider.addListener("disconnect", handleDisconnect);
        provider.addListener("chainChanged", handleChainChanged);
      }

      // Cleanup listeners on component unmount
      return () => {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged);
          provider.removeListener("disconnect", handleDisconnect);
          provider.removeListener("chainChanged", handleChainChanged);
        } else if (provider.off) {
          provider.off("accountsChanged", handleAccountsChanged);
          provider.off("disconnect", handleDisconnect);
          provider.off("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    checkIfWalletConnected();
  }, [address]);

  const connectWallet = async (walletId = null) => {
    // Support calling with a specific wallet id (e.g. 'metamask', 'coinbase', 'walletconnect')
    // If a wallet id is passed, the caller can rely on UI detection to ensure the right provider is available.
    // Get the wallet provider - check for multiple providers
    let provider = null;
    console.log('[Context] connectWallet called with walletId:', walletId);
    if (typeof window !== "undefined") {
      // If a specific wallet is requested, try to find that specific provider
      if (walletId === 'metamask' && window.ethereum) {
        // First check if window.ethereum itself is MetaMask (might have been set by WalletConnect component)
        if (window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
          provider = window.ethereum;
          console.log('[Context] Using window.ethereum as MetaMask provider (already set)');
        } else if (Array.isArray(window.ethereum.providers)) {
          // Look for MetaMask in providers array
          provider = window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
          if (provider) {
            console.log('[Context] Found MetaMask in providers array');
            // Make it the primary provider
            const providerIndex = window.ethereum.providers.findIndex(p => p === provider);
            if (providerIndex > 0) {
              [window.ethereum.providers[0], window.ethereum.providers[providerIndex]] = 
                [window.ethereum.providers[providerIndex], window.ethereum.providers[0]];
            }
            window.ethereum = window.ethereum.providers[0];
            provider = window.ethereum;
          }
        }
        // If still no provider, check if window.ethereum was set directly (from WalletConnect component)
        if (!provider && window.ethereum.isMetaMask) {
          provider = window.ethereum;
          console.log('[Context] Using window.ethereum as MetaMask provider (fallback)');
        }
        console.log('[Context] MetaMask provider selected:', provider);
      } else if (walletId === 'coinbase' && window.ethereum) {
        if (window.ethereum.isCoinbaseWallet) {
          provider = window.ethereum;
          console.log('[Context] Using window.ethereum as Coinbase Wallet provider (already set)');
        } else if (Array.isArray(window.ethereum.providers)) {
          provider = window.ethereum.providers.find(p => p.isCoinbaseWallet);
          // If found, set it as primary provider
          if (provider) {
            console.log('[Context] Found Coinbase Wallet in providers array');
            const providerIndex = window.ethereum.providers.findIndex(p => p === provider);
            if (providerIndex > 0) {
              [window.ethereum.providers[0], window.ethereum.providers[providerIndex]] = 
                [window.ethereum.providers[providerIndex], window.ethereum.providers[0]];
            }
            window.ethereum = window.ethereum.providers[0];
            provider = window.ethereum;
          }
        }
        // If still no provider, check if window.ethereum was set directly
        if (!provider && window.ethereum.isCoinbaseWallet) {
          provider = window.ethereum;
          console.log('[Context] Using window.ethereum as Coinbase Wallet provider (fallback)');
        }
        console.log('[Context] Coinbase Wallet provider selected:', provider);
      } else if (walletId === 'trust' && window.ethereum) {
        if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
          provider = window.ethereum;
          console.log('[Context] Using window.ethereum as Trust Wallet provider (already set)');
        } else if (Array.isArray(window.ethereum.providers)) {
          provider = window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
          // If found, set it as primary provider
          if (provider) {
            console.log('[Context] Found Trust Wallet in providers array');
            const providerIndex = window.ethereum.providers.findIndex(p => p === provider);
            if (providerIndex > 0) {
              [window.ethereum.providers[0], window.ethereum.providers[providerIndex]] = 
                [window.ethereum.providers[providerIndex], window.ethereum.providers[0]];
            }
            window.ethereum = window.ethereum.providers[0];
            provider = window.ethereum;
          }
        }
        // If still no provider, check if window.ethereum was set directly
        if (!provider && (window.ethereum.isTrust || window.ethereum.isTrustWallet)) {
          provider = window.ethereum;
          console.log('[Context] Using window.ethereum as Trust Wallet provider (fallback)');
        }
        console.log('[Context] Trust Wallet provider selected:', provider);
      } else if (window.ethereum) {
        // Fallback to default ethereum provider
        console.log('[Context] window.ethereum detected:', window.ethereum);
        // If providers array exists, use the first one (usually the most recently used)
        if (Array.isArray(window.ethereum.providers)) {
          provider = window.ethereum.providers[0];
        } else {
          provider = window.ethereum;
        }
      } else if (window.BinanceChain) {
        console.log('[Context] window.BinanceChain detected:', window.BinanceChain);
        provider = window.BinanceChain;
      } else if (window.okxwallet) {
        console.log('[Context] window.okxwallet detected:', window.okxwallet);
        provider = window.okxwallet;
      } else if (window.tokenpocket) {
        console.log('[Context] window.tokenpocket detected:', window.tokenpocket);
        provider = window.tokenpocket;
      } else if (window.safepal) {
        console.log('[Context] window.safepal detected:', window.safepal);
        provider = window.safepal;
      } else {
        console.warn('[Context] No known wallet provider found on window');
      }
    } else {
      console.warn('[Context] window is undefined');
    }

    // If caller explicitly requested WalletConnect, initialize WalletConnect provider
    if (walletId === 'walletconnect') {
      try {
        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
        if (!projectId) {
          ErrorToast('WalletConnect project ID not configured. Set VITE_WALLETCONNECT_PROJECT_ID in your .env');
          return null;
        }

        let wprovider = wcProvider;
        if (!wprovider) {
          wprovider = await EthereumProvider.init({
            projectId,
            chains: [1, 137, 56, 42161, 43114],
            showQrModal: true,
          });
          setWcProvider(wprovider);

          // wire events
          if (wprovider.on) {
            wprovider.on('accountsChanged', (accounts) => {
              if (!accounts || accounts.length === 0) {
                setAddress(null);
                setAccountBalance(null);
                try {
                  localStorage.removeItem('walletAddress');
                } catch (e) {
                  console.warn('Could not remove wallet address from localStorage:', e);
                }
              } else {
                const walletAddress = accounts[0];
                setAddress(walletAddress);
                try {
                  localStorage.setItem('walletAddress', walletAddress);
                } catch (e) {
                  console.warn('Could not store wallet address in localStorage:', e);
                }
              }
            });
            wprovider.on('chainChanged', () => {
              checkIfWalletConnected();
            });
            wprovider.on('disconnect', () => {
              setAddress(null);
              setAccountBalance(null);
              try {
                localStorage.removeItem('walletAddress');
              } catch (e) {
                console.warn('Could not remove wallet address from localStorage:', e);
              }
            });
          }
        }

        provider = wprovider;
      } catch (err) {
        console.error('Error initializing WalletConnect provider:', err);
        ErrorToast('Failed to initialize WalletConnect. Check console for details.');
        return null;
      }
    }

    if (!provider) {
      // If a specific wallet was requested, give a tailored message
      console.error('[Context] No provider found for walletId:', walletId);
      if (walletId) {
        ErrorToast(`No ${walletId} provider found. Please install ${walletId} or use another wallet.`);
      } else {
        ErrorToast("No wallet provider found. Please install MetaMask or another wallet extension.");
      }
      return null;
    }

    try {
      let accounts;
      console.log('[Context] Attempting to request accounts from provider:', provider);
      
      // Special handling for WalletConnect
      if (walletId === 'walletconnect' && provider) {
        console.log('[Context] WalletConnect provider detected');
        try {
          // WalletConnect requires explicit connect call
          if (typeof provider.connect === 'function') {
            console.log('[Context] Calling connect() for WalletConnect provider');
            await provider.connect();
          }
          
          // After connecting, get accounts
          if (provider.request) {
            accounts = await provider.request({
              method: "eth_accounts",
            });
            // If no accounts, request them
            if (!accounts || accounts.length === 0) {
              accounts = await provider.request({
                method: "eth_requestAccounts",
              });
            }
          }
        } catch (wcError) {
          console.error('[Context] WalletConnect connection error:', wcError);
          if (wcError.code === 4001) {
            ErrorToast("WalletConnect connection rejected by user");
            return null;
          }
          throw wcError;
        }
      } else {
        // Request account access with proper error handling for other wallets
        try {
          // Ensure we're using the correct provider - if window.ethereum was set, use it
          if (typeof window !== 'undefined' && window.ethereum && provider !== window.ethereum) {
            // If we set window.ethereum to a specific provider, use that instead
            if (walletId && (walletId === 'metamask' || walletId === 'coinbase' || walletId === 'trust')) {
              provider = window.ethereum;
              console.log('[Context] Using window.ethereum as the provider for wallet:', walletId);
            }
          }
          
          console.log('[Context] Requesting accounts from provider:', provider);
          console.log('[Context] Provider has request method:', typeof provider.request === 'function');
          console.log('[Context] Provider has enable method:', typeof provider.enable === 'function');
          
          if (provider.request) {
            console.log('[Context] Calling provider.request({ method: "eth_requestAccounts" })');
            accounts = await provider.request({
              method: "eth_requestAccounts",
            });
            console.log('[Context] Accounts received from request:', accounts);
          } else if (provider.enable) {
            // Legacy wallet support
            console.log('[Context] Calling provider.enable()');
            accounts = await provider.enable();
            console.log('[Context] Accounts received from enable:', accounts);
          } else {
            throw new Error("Wallet does not support connection");
          }
        } catch (requestError) {
          console.error('[Context] Error requesting accounts:', requestError);
          console.error('[Context] Error details:', {
            code: requestError.code,
            message: requestError.message,
            stack: requestError.stack
          });
          if (requestError.code === 4001) {
            ErrorToast("Connection rejected by user");
            return null;
          } else if (requestError.code === -32002) {
            ErrorToast("Connection request already pending. Please check your wallet.");
            return null;
          }
          throw requestError;
        }
      }

      if (accounts && accounts.length > 0) {
        console.log('[Context] Accounts received:', accounts);
        setAddress(accounts[0]);

        let ethersProvider;
        let getbalance;

        try {
          if (typeof window !== "undefined" && provider) {
            ethersProvider = new ethers.providers.Web3Provider(provider);
            getbalance = await ethersProvider.getBalance(accounts[0]);
            const bal = ethers.utils.formatEther(getbalance);
            setAccountBalance(bal);
          } else {
            console.error(
              "No Ethereum provider found! Make sure MetaMask or another wallet is installed."
            );
            setAccountBalance("0");
          }
        } catch (balanceError) {
          console.error("Error fetching balance:", balanceError);
          setAccountBalance("0");
        }

        return accounts[0];
      } else {
        ErrorToast("No account found. Please unlock your wallet.");
        return null;
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      setLoader(false);
      
      let errorMessage = "Error connecting wallet";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Connection error: ${error.code}`;
      }
      
      ErrorToast(errorMessage);
      return null;
    }
  };

  // Disconnect wallet helper exported to components
  const disconnectWallet = async () => {
    console.log('[Context] disconnectWallet called');
    try {
      // Clear local state FIRST to prevent re-connection loops
      setAddress(null);
      setAccountBalance(null);
      // Clear localStorage
      try {
        localStorage.removeItem('walletAddress');
      } catch (e) {
        console.warn('Could not remove wallet address from localStorage:', e);
      }

      // Remove any persisted wallet session
      try {
        localStorage.removeItem('wallet_session');
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('lastConnectedWallet');
        sessionStorage.clear();
      } catch (e) {
        console.warn('[Context] Error clearing storage:', e);
      }

      // Attempt to gracefully disconnect WalletConnect style providers
      try {
        // First try WalletConnect provider instance
        if (wcProvider && typeof wcProvider.disconnect === 'function') {
          try { 
            await wcProvider.disconnect(); 
            console.log('[Context] wcProvider.disconnect succeeded');
          } catch (e) { 
            console.warn('[Context] wcProvider.disconnect failed:', e); 
          }
        }

        // Also attempt to call generic provider disconnect/close
        const provider = typeof window !== 'undefined' && (window.ethereum || window.wallet?.provider || window.__walletconnect__);
        if (provider && typeof provider.disconnect === 'function') {
          try { 
            await provider.disconnect();
            console.log('[Context] provider.disconnect succeeded');
          } catch(e) {
            console.warn('[Context] provider.disconnect failed:', e);
          }
        }
        if (provider && typeof provider.close === 'function') {
          try { 
            await provider.close();
            console.log('[Context] provider.close succeeded');
          } catch(e) {
            console.warn('[Context] provider.close failed:', e);
          }
        }
        
        // Remove event listeners to prevent auto-reconnection
        if (provider) {
          try {
            provider.removeAllListeners?.();
            provider.off?.('accountsChanged');
            provider.off?.('chainChanged');
            provider.off?.('connect');
            provider.off?.('disconnect');
            console.log('[Context] Event listeners removed');
          } catch (e) {
            console.warn('[Context] Error removing listeners:', e);
          }
        }
      } catch (e) {
        console.warn('[Context] Error during provider disconnect:', e);
      }

      console.log('[Context] Wallet disconnected successfully');
    } catch (err) {
      console.error('[Context] Error during disconnectWallet:', err);
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

    cartAPI.getUserCart(addressString)
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

  const vendorMint = async (uri, nftMarketplaceAddress, itemId = null, network = null) => {
      console.log("🚀 ~ vendorMint ~ nftMarketplaceAddress:",
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
      console.log("Receipt events:", receipt.events);
      console.log("Receipt logs:", receipt.logs);

      // Try to extract tokenId from events
      let tokenId = null;
      if (receipt.events && receipt.events.length > 0) {
        console.log("Processing receipt.events...");
        for (const event of receipt.events) {
          console.log("Event:", event);
          if (event.event === 'Transfer' && event.args && event.args.tokenId) {
            tokenId = event.args.tokenId.toString();
            console.log("Found tokenId from events:", tokenId);
            break;
          }
        }
      }
      
      // If no tokenId found from events, try other methods
      if (!tokenId) {
        console.log("No tokenId found from receipt.events, trying other methods...");
        
        // Try to parse logs manually
        if (receipt.logs && receipt.logs.length > 0) {
          console.log("Trying to parse receipt.logs...");
          const contractInterface = ContractInstance.interface;
          for (const log of receipt.logs) {
            try {
              const parsedLog = contractInterface.parseLog(log);
              console.log("Parsed log:", parsedLog);
              if (parsedLog.name === 'Transfer' && parsedLog.args.tokenId) {
                tokenId = parsedLog.args.tokenId.toString();
                console.log("Found tokenId from parsed logs:", tokenId);
                break;
              }
            } catch (e) {
              // Not a log from this contract
            }
          }
        }
        
        // If still no tokenId, try to query blockchain for Transfer events
        if (!tokenId && receipt.transactionHash) {
          console.log("VENDOR_MINT: About to query blockchain...");
          try {
            const provider = ContractInstance.provider;
            const txReceipt = await provider.getTransactionReceipt(receipt.transactionHash);
            console.log("VENDOR_MINT: Blockchain query completed");
            console.log("Full transaction receipt:", txReceipt);
            
            console.log("VENDOR_MINT: Checking txReceipt conditions:");
            console.log("- txReceipt exists:", !!txReceipt);
            console.log("- txReceipt.logs exists:", !!(txReceipt && txReceipt.logs));
            console.log("- txReceipt.logs.length > 0:", !!(txReceipt && txReceipt.logs && txReceipt.logs.length > 0));
            
            if (txReceipt && txReceipt.logs && txReceipt.logs.length > 0) {
              console.log("Found", txReceipt.logs.length, "logs in transaction receipt");
              // Try to parse logs with VendorNFT interface first
              const contractInterface = ContractInstance.interface;
              for (const log of txReceipt.logs) {
                console.log("Processing log:", log);
                try {
                  const parsedLog = contractInterface.parseLog(log);
                  console.log("Parsed blockchain log with VendorNFT interface:", parsedLog);
                  if (parsedLog.name === 'Transfer' && parsedLog.args.tokenId) {
                    tokenId = parsedLog.args.tokenId.toString();
                    console.log("Found tokenId from blockchain query (VendorNFT):", tokenId);
                    break;
                  }
                } catch (e) {
                  console.log("Log not parseable with VendorNFT interface, checking for Transfer signature...");
                  // Try to decode as raw Transfer event
                  if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
                    console.log("Found Transfer event signature in log:", log);
                    // For ERC-721 Transfer: topics[0] = signature, topics[1] = from, topics[2] = to, topics[3] = tokenId
                    if (log.topics.length >= 4) {
                      const tokenIdHex = log.topics[3];
                      tokenId = parseInt(tokenIdHex, 16).toString();
                      console.log("Extracted tokenId from raw Transfer event:", tokenId);
                      break;
                    }
                  } else {
                    console.log("Log topics[0]:", log.topics ? log.topics[0] : 'no topics');
                  }
                }
              }
            } else {
              console.log("VENDOR_MINT: No logs found in transaction receipt, or txReceipt is null");
              console.log("txReceipt exists:", !!txReceipt);
              if (txReceipt) {
                console.log("txReceipt.logs exists:", !!txReceipt.logs);
                console.log("txReceipt.logs length:", txReceipt.logs ? txReceipt.logs.length : 'N/A');
                console.log("txReceipt.status:", txReceipt.status);
                console.log("txReceipt gasUsed:", txReceipt.gasUsed ? txReceipt.gasUsed.toString() : 'N/A');
                console.log("Full txReceipt object keys:", Object.keys(txReceipt));
              }
            }
          } catch (error) {
            console.error("Error querying blockchain for events:", error);
          }
        }
      }

      console.log("VENDOR_MINT_FINAL: tokenId =", tokenId);

      // Update NFT status in database if itemId and network are provided
      if (itemId && network && receipt.transactionHash) {
        try {
          console.log("Updating NFT status in database after minting...");
          const updateData = {
            isMinted: true,
            mintedAt: new Date(),
            mintTxHash: receipt.transactionHash
          };
          if (tokenId) {
            updateData.tokenId = tokenId;
          }
          await adminAPI.updateNFTStatus(network, itemId, updateData);
          console.log("NFT status updated successfully in database");
        } catch (dbError) {
          console.error("Failed to update NFT status in database:", dbError);
          // Don't fail the minting if database update fails
        }
      }

      return { ...receipt, tokenId };
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

  const publicMint = async (uri, nftMarketplaceAddress, itemId = null, network = null) => {
    try {
      const networkName = selectedChain.toLowerCase();
      const ContractInstance = await getVendorNFTContracts(networkName);
      console.log("🚀 ~ publicMint ~ ContractInstance:", ContractInstance);

      // Determine network-specific parameters for cheap networks (accessible for $1 wallets)
      const isCheapNetwork = ['polygon', 'mumbai', 'base', 'avalanche'].includes(networkName);
      const fallbackMintingFee = isCheapNetwork ? "0.00001" : "0.0001"; // Even lower for cheap networks
      const fallbackGasLimit = isCheapNetwork ? 300000 : 500000; // Much lower for cheap networks
      const bufferPercent = isCheapNetwork ? 110 : 120; // 10% buffer on cheap, 20% on expensive

      // Check account balance before attempting transaction
      let userBalance = accountBalance;
      if (!userBalance) {
        try {
          const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = ethersProvider.getSigner();
          const userAddress = await signer.getAddress();
          const balance = await ethersProvider.getBalance(userAddress);
          userBalance = ethers.utils.formatEther(balance);
        } catch (balanceCheckError) {
          console.warn("Could not fetch balance, attempting transaction anyway:", balanceCheckError);
        }
      }

      // Attempt transaction with estimated gas
      let gasEstimate;
      try {
        gasEstimate = await ContractInstance.estimateGas.publicMint(uri, nftMarketplaceAddress);
        console.log("Estimated gas:", gasEstimate.toString());
      } catch (gasError) {
        console.error("Gas estimation failed:", gasError);
        gasEstimate = ethers.BigNumber.from(fallbackGasLimit); // Network-specific fallback
      }

      // Get minting fee from contract for accurate requirement check
      let mintingFee = ethers.utils.parseEther(fallbackMintingFee);
      try {
        mintingFee = await ContractInstance.getMintingFee();
        console.log("Retrieved minting fee from contract:", ethers.utils.formatEther(mintingFee), "ETH");
      } catch (e) {
        console.warn(`Could not fetch minting fee, using default ${fallbackMintingFee} ETH for ${networkName}`);
      }
      
      const txOptions = await gasService.getTransactionOptions(networkName, {
        gasLimit: gasEstimate.mul(ethers.BigNumber.from(bufferPercent)).div(ethers.BigNumber.from(100)), // Network-specific buffer
      });

      // Verify sufficient balance before sending transaction
      const userBalanceInWei = ethers.utils.parseEther(userBalance || "0");
      const estimatedTotalCost = mintingFee.add(gasEstimate.mul(ethers.BigNumber.from("1000000000"))); // More accurate gas estimate
      
      console.log("Network:", networkName, "| Cheap network:", isCheapNetwork);
      console.log("Minting fee:", ethers.utils.formatEther(mintingFee), "ETH");
      console.log("Estimated total cost:", ethers.utils.formatEther(estimatedTotalCost), "ETH");
      console.log("User balance:", userBalance, "ETH");
      
      if (userBalanceInWei.lt(estimatedTotalCost)) {
        const shortfallInWei = estimatedTotalCost.sub(userBalanceInWei);
        throw new Error(`Insufficient balance. Need ${ethers.utils.formatEther(estimatedTotalCost)} ETH but have ${userBalance} ETH (short by ${ethers.utils.formatEther(shortfallInWei)} ETH)`);
      }
      
      const tx = await ContractInstance.publicMint(uri, nftMarketplaceAddress, txOptions);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt);
      console.log("✅ NFT minted with flexible payment - only charged what was needed!");
      console.log("Receipt events:", receipt.events);
      console.log("Receipt logs:", receipt.logs);

      // Try to extract tokenId from events
      let tokenId = null;
      if (receipt.events && receipt.events.length > 0) {
        console.log("Processing receipt.events...");
        for (const event of receipt.events) {
          console.log("Event:", event);
          if (event.event === 'Transfer' && event.args && event.args.tokenId) {
            tokenId = event.args.tokenId.toString();
            console.log("Found tokenId from events:", tokenId);
            break;
          }
        }
      }

      // If no tokenId found from events, try other methods
      if (!tokenId) {
        console.log("No tokenId found from receipt.events, trying other methods...");

        // Try to parse logs manually
        if (receipt.logs && receipt.logs.length > 0) {
          console.log("Trying to parse receipt.logs...");
          const contractInterface = ContractInstance.interface;
          for (const log of receipt.logs) {
            try {
              const parsedLog = contractInterface.parseLog(log);
              console.log("Parsed log:", parsedLog);
              if (parsedLog.name === 'Transfer' && parsedLog.args.tokenId) {
                tokenId = parsedLog.args.tokenId.toString();
                console.log("Found tokenId from parsed logs:", tokenId);
                break;
              }
            } catch (e) {
              // Not a log from this contract
            }
          }
        }

        // If still no tokenId, try to query blockchain for Transfer events
        if (!tokenId && receipt.transactionHash) {
          console.log("Trying to query blockchain for Transfer events...");
          try {
            const provider = ContractInstance.provider;
            const txReceipt = await provider.getTransactionReceipt(receipt.transactionHash);
            console.log("Full transaction receipt:", txReceipt);

            if (txReceipt && txReceipt.logs && txReceipt.logs.length > 0) {
              // Try to parse logs with VendorNFT interface first
              const contractInterface = ContractInstance.interface;
              for (const log of txReceipt.logs) {
                try {
                  const parsedLog = contractInterface.parseLog(log);
                  console.log("Parsed blockchain log with VendorNFT interface:", parsedLog);
                  if (parsedLog.name === 'Transfer' && parsedLog.args.tokenId) {
                    tokenId = parsedLog.args.tokenId.toString();
                    console.log("Found tokenId from blockchain query (VendorNFT):", tokenId);
                    break;
                  }
                } catch (e) {
                  // Try to decode as raw Transfer event
                  if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
                    // Transfer event signature
                    console.log("Found Transfer event signature in log:", log);
                    // For ERC-721 Transfer: topics[0] = signature, topics[1] = from, topics[2] = to, topics[3] = tokenId
                    if (log.topics.length >= 4) {
                      const tokenIdHex = log.topics[3];
                      tokenId = parseInt(tokenIdHex, 16).toString();
                      console.log("Extracted tokenId from raw Transfer event:", tokenId);
                      break;
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error querying blockchain for events:", error);
          }
        }
      }

      // Update NFT status in database if itemId and network are provided
      if (itemId && network && receipt.transactionHash) {
        try {
          console.log("Updating NFT status in database after minting...");
          const updateData = {
            isMinted: true,
            mintedAt: new Date(),
            mintTxHash: receipt.transactionHash
          };
          if (tokenId) {
            updateData.tokenId = tokenId;
          }
          await adminAPI.updateNFTStatus(network, itemId, updateData);
          console.log("NFT status updated successfully in database");
        } catch (dbError) {
          console.error("Failed to update NFT status in database:", dbError);
          // Don't fail the minting if database update fails
        }
      }

      return { ...receipt, tokenId };
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

      // Get transaction options with gas fee regulations applied
      const txOptions = await gasService.getTransactionOptions(networkName, {
        value: ethers.utils.parseEther(listingFeeInEther.toString()),
        gasLimit: 3600000,
      });

      const tx = await MarketContractInstance.listNFT(
        nftContractAddress,
        tokenId,
        uint256Value,
        txOptions
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
      // Get transaction options with gas fee regulations applied
      const txOptions = await gasService.getTransactionOptions(networkName, {
        gasLimit: 360000,
      });

      const tx = await MarketContractInstance.editNftPrice(itemId, values, txOptions);

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

    // Lazy-minted NFTs use MongoDB _id (24-char hex); the marketplace contract expects a numeric listing id.
    const itemIdStr = String(itemIds ?? '');
    if (/^[a-fA-F0-9]{24}$/.test(itemIdStr)) {
      throw new Error(
        "This item is a lazy-minted NFT and cannot be purchased through the marketplace contract. Please use the NFT page to Buy Now or Make an Offer."
      );
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

      // Get transaction options with gas fee regulations applied
      const txOptions = await gasService.getTransactionOptions(targetNetwork, {
        value: ethers.utils.parseEther(price.toString()), // Amount to send in ETH
        gasLimit: 360000,
      });

      // Execute the purchase transaction on the NFT's network
      const tx = await MarketContractInstance.buyNFT(
        nftContractAddress,
        itemId,
        txOptions
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
      // Get transaction options with gas fee regulations applied
      const txOptions = await gasService.getTransactionOptions(networkName, {
        value: ethers.utils.parseEther(price.toString()), // Amount of ETH to send
        gasLimit: 360000,
      });
      const tx = await MarketContractInstance.placeOffer(nftContractAddress, txOptions);

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

      // Get transaction options with gas fee regulations applied
      const networkName = selectedChain.toLowerCase();
      const txOptions = await gasService.getTransactionOptions(networkName, {
        gasLimit: 100000,
      });

      // Perform transfer
      const tx = await nftContract.safeTransferFrom(
        address,
        newOwnerAddress,
        tokenId,
        txOptions
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

      // Get transaction options with gas fee regulations applied
      const txOptions = await gasService.getTransactionOptions(networkName, {
        value: ethers.utils.parseEther(price.toString()), // Amount of ETH to send
        gasLimit: 360000,
      });

      const tx = await MarketContractInstance.editOffer(
        nftContractAddress,
        offerId,
        txOptions
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
          disconnectWallet,
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
