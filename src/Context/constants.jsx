import { ethers } from "ethers";
// import Web3Modal from "web3modal";

// import ERC20Generator from "./ERC20Generator.json";
import NFTMarketplace from "./NFTMarketplace.json";
import VendorNFT from "./VendorNFT.json";
import MargicPearl from "./MargicPearl.json";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";

// export const ERC20Generator_ABI = ERC20Generator.abi;
// export const ERC20Generator_BYTECODE = ERC20Generator.bytecode;

export let NFTMARKETPLACE_CONTRACT_ADDRESS = import.meta.env
  .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;
export let VENDORNFT_CONTRACT_ADDRESS = import.meta.env
  .VITE_APP_VENDORNFT_CONTRACT_ADDRESS;
export const NFTMarketplace_ABI = NFTMarketplace.abi;
export const VendorNFT_ABI = VendorNFT.abi;
export const MargicPearl_ABI = MargicPearl.abi;

//PINATA KEY
export const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
export const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRECT_KEY;

export const shortenAddress = (address) =>
  `${address?.slice(0, 4)}...${address?.slice(-4)}`;

export const getCurrencySymbol = (chain) => {
  const currencyMap = {
    Polygon: 'POL',
    Ethereum: 'ETH',
    Arbitrum: 'ETH',  // Assuming Arbitrum uses ETH
    BSC: 'BNB',  // Assuming BSC uses BNB
    Base: 'ETH'  // Assuming Base uses ETH, adjust as necessary
  };

  return currencyMap[chain] || 'ETH';  // Default to ETH if the chain is not found
};

 export const formatPrice = (priceInWei) => {
  // Convert from Wei to the appropriate token (ETH/MATIC/BNB/etc.)
  const formattedPrice = ethers.utils.formatEther(priceInWei);

  // Format the number with commas and keep 2 decimal places
  return parseFloat(formattedPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

let provider;

if (typeof window !== "undefined" && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
} else {
  console.warn("No Ethereum provider found! Using fallback RPC provider.");
  provider = new ethers.providers.JsonRpcProvider(
    import.meta.env.VITE_APP_WEB3_PROVIDER
  );
}

const signer = provider.getSigner();

export const ContractAddress = import.meta.env
  .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;
export const VendorContractAddress = import.meta.env
  .VITE_APP_VENDORNFT_CONTRACT_ADDRESS;

export const fetchContract = (address, abi, signer) =>
  new ethers.Contract(address, abi, signer);

export const ContractInstance = new ethers.Contract(
  VendorContractAddress,
  VendorNFT_ABI,
  signer
);

export const MarketContractInstance = new ethers.Contract(
  ContractAddress,
  NFTMarketplace_ABI,
  signer
);

export const NFTMarketplaceCONTRACT = async () => {
  // const link ="https://polygon-amoy.g.alchemy.com/v2/BNtFtcdka6PWOAZepdA62HWxAeGnHnCT";
  const link =
    // "https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca";
    // const link =
    "https://eth-sepolia.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT";
  // const link =
  // "https://eth-holesky.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT";
  try {
    const provider = new ethers.providers.JsonRpcProvider(link);
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = fetchContract(
      ContractAddress,
      NFTMarketplace_ABI,
      provider
    );
    return contract;
  } catch (error) {
    console.error(error);
  }
};

export const VendorNFTs_CONTRACT = async () => {
  const link =
    // "https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca";
    // const link =
    "https://eth-sepolia.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT";
  // const link =
  // "https://eth-holesky.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT";
  try {
    const provider = new ethers.providers.JsonRpcProvider(link);

    const contract = fetchContract(
      VendorContractAddress,
      VendorNFT_ABI,
      provider
    );
    return contract;
  } catch (error) {
    console.error(error);
  }
};

export const rpcUrls = {
  polygon: import.meta.env.VITE_RPC_URL_POLYGON,
  arbitrum: import.meta.env.VITE_RPC_URL_ARBITRUM,
  ethereum: import.meta.env.VITE_RPC_URL_ETHEREUM,
  bsc: import.meta.env.VITE_RPC_URL_BSC,
  base: import.meta.env.VITE_RPC_URL_BASE,
};

// export const rpcUrls = {
//   polygon: "https://eth-sepolia.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT",
//   arbitrum:"https://eth-holesky.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT",
//   ethereum: "https://eth-sepolia.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT",
//   bsc: "https://eth-holesky.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT",
//   base: "https://eth-sepolia.g.alchemy.com/v2/chL87jzrfXklYJR_OmMTNKc1Ab1OfQpT",
// };

// export const contractAddresses = {
//   polygon: {
//     marketplace: NFTMARKETPLACE_CONTRACT_ADDRESS,
//     vendorNFT: VENDORNFT_CONTRACT_ADDRESS,
//   },
//   arbitrum: {
//     marketplace: import.meta.env
//     .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HOSKELY,
//     vendorNFT: import.meta.env
//     .VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HOSKELY
//   },
//   ethereum: {
//     marketplace: NFTMARKETPLACE_CONTRACT_ADDRESS,
//     vendorNFT: VENDORNFT_CONTRACT_ADDRESS,
//   },
//   bsc: {
//     marketplace: import.meta.env
//     .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HOSKELY,
//     vendorNFT: import.meta.env
//     .VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HOSKELY
//   },
//   base: {
//     marketplace: NFTMARKETPLACE_CONTRACT_ADDRESS,
//     vendorNFT:  VENDORNFT_CONTRACT_ADDRESS,
//   },
// };

// CONTRACT_ADDRESSES
export const contractAddresses = {
  polygon: {
    marketplace: import.meta.env
      .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON, // 0x6Df8f108B61cb4C0e456BaBBeA82a5E91388b3bd
    vendorNFT: import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON, // 0x577D9b2E9Ce9f390b8D6c9388974Ee04f4Ca5592
  },
  arbitrum: {
    marketplace: import.meta.env
      .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ARBITRUM, // 0x577D9b2E9Ce9f390b8D6c9388974Ee04f4Ca5592
    vendorNFT: import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ARBITRUM, // 0x2033eE90f76496E26bEF4a1A8FF8712Afbd0d39b
  },
  ethereum: {
    marketplace: import.meta.env
      .VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ETHEREUM, // 0x2033eE90f76496E26bEF4a1A8FF8712Afbd0d39b
    vendorNFT: import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ETHEREUM, // 0x1BBE1EC42D897e2f0dd39B6Cc6c1070515f7B307
  },
  bsc: {
    marketplace: import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BSC, // 0x704798eCb33d44E6c66048b15E60991367781C01
    vendorNFT: import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BSC, // 0x4dFCb19D3E4eE0989b51364e3038076ee96808c9
  },
  base: {
    marketplace: import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BASE, // 0x1BBE1EC42D897e2f0dd39B6Cc6c1070515f7B307
    vendorNFT: import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BASE, // 0xb0F0733302967e210B61f50b59511B3F119aE869
  },
};

const updateMarketplace = (networkName) => {
  if (!contractAddresses[networkName]) {
    console.error(`No contract addresses found for ${networkName}`);
    return;
  }

  // Dynamically update contract addresses
  NFTMARKETPLACE_CONTRACT_ADDRESS = contractAddresses[networkName].marketplace;
  VENDORNFT_CONTRACT_ADDRESS = contractAddresses[networkName].vendorNFT;

  console.log(
    `Updated Contracts for ${networkName}:`,
    NFTMARKETPLACE_CONTRACT_ADDRESS,
    VENDORNFT_CONTRACT_ADDRESS
  );
};

export const getNFTMarketplaceContract = async (networkName) => {
  try {
    if (!networkName) {
      console.error("Network name is undefined! Please pass a valid network.");
      return null; // Or throw an error if you prefer
    }

    const rpcUrl = rpcUrls[networkName];
    console.log("🚀 ~ getNFTMarketplaceContract ~ rpcUrl:", rpcUrl);
    const contractAddress = contractAddresses[networkName]?.marketplace;
    console.log(
      "🚀 ~ getNFTMarketplaceContract ~ contractAddress:",
      contractAddress
    );

    if (!rpcUrl || !contractAddress) {
      console.error(`Invalid network or missing contract for ${networkName}`);
      return null;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      NFTMarketplace_ABI,
      provider
    );

    return contract;
  } catch (error) {
    console.error(
      `Error fetching marketplace contract for ${networkName}:`,
      error
    );
  }
};

export const getNFTMarketplaceContracts = async (networkName) => {
  try {
    if (!networkName) {
      console.error("Network name is undefined! Please pass a valid network.");
      return null; // Or throw an error if you prefer
    }

    console.log(
      `Fetching NFT Marketplace contract for network: ${networkName}`
    );

    const rpcUrl = rpcUrls[networkName];
    console.log("🚀 ~ getNFTMarketplaceContract ~ rpcUrl:", rpcUrl);
    const contractAddress = contractAddresses[networkName]?.marketplace;
    console.log(
      "🚀 ~ getNFTMarketplaceContract ~ contractAddress:",
      contractAddress
    );

    if (!rpcUrl || !contractAddress) {
      console.error(`Invalid network or missing contract for ${networkName}`);
      return null;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      NFTMarketplace_ABI,
      signer
    );

    return contract;
  } catch (error) {
    console.error(
      `Error fetching marketplace contract for ${networkName}:`,
      error
    );
  }
};

export const getVendorNFTContracts = async (networkName) => {
  try {
    const rpcUrl = rpcUrls[networkName];
    const contractAddress = contractAddresses[networkName]?.vendorNFT;

    if (!rpcUrl || !contractAddress) {
      console.error(`Invalid network or missing contract for ${networkName}`);
      return null;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      contractAddress,
      VendorNFT_ABI,
      signer
    );

    return contract;
  } catch (error) {
    console.error(
      `Error fetching vendor NFT contract for ${networkName}:`,
      error
    );
  }
};
export const getVendorNFTContract = async (networkName) => {
  try {
    const rpcUrl = rpcUrls[networkName];
    const contractAddress = contractAddresses[networkName]?.vendorNFT;

    if (!rpcUrl || !contractAddress) {
      console.error(`Invalid network or missing contract for ${networkName}`);
      return null;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      VendorNFT_ABI,
      provider
    );

    return contract;
  } catch (error) {
    console.error(
      `Error fetching vendor NFT contract for ${networkName}:`,
      error
    );
  }
};

//?  NETWORK SETTING

export const networks = {
  polygon: {
    // chainId: `0x89`,
    chainId: `0x${Number(137).toString(16)}`,
    chainName: "Polygon Mainnet",
    nativeCurrency: {
      name: "Matic",
      symbol: "POL", // ✅ not POL
      decimals: 18,
    },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  ethereum: {
    chainId: `0x${Number(1).toString(16)}`,
    chainName: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://eth.llamarpc.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  arbitrum: {
    chainId: `0x${Number(42161).toString(16)}`,
    chainName: "Arbitrum One",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io/"],
  },
  zksync: {
    // ✅ Make sure this key exists
    chainId: "0x144", // ✅ Correct hex format for zkSync Era (324)
    chainName: "zkSync Era",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.era.zksync.io"],
    blockExplorerUrls: ["https://explorer.zksync.io"],
  },
  // polygon: {
  //   chainId: `0x${Number(137).toString(16)}`,
  //   chainName: "Polygon Mainnet",
  //   nativeCurrency: {
  //     name: "MATIC",
  //     symbol: "POL",
  //     decimals: 18,
  //   },
  //   rpcUrls: ["https://rpc.ankr.com/polygon"],
  //   blockExplorerUrls: ["https://polygonscan.com/"],
  // },
  bsc: {
    chainId: `0x${Number(56).toString(16)}`,
    chainName: "Binance Mainnet",
    nativeCurrency: {
      name: "BNB Chain LlamaNodes",
      symbol: "BNB",
      decimals: 18,
    },
    // rpcUrls: ["https://binance.llamarpc.com"],
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"],
  },
  base: {
    chainId: `0x${Number(8453).toString(16)}`,
    chainName: "Base Mainnet",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
  },
};

export const changeNetwork = async (networkName) => {
  try {
    if (!window.ethereum) throw new Error("No crypto wallet found");

    const networkData = networks[networkName];

    console.log("Network Key:", networkName);
    console.log("Network Data:", networkData);

    if (!networkData || !networkData.chainId) {
      console.error(
        `Error: Invalid network data for ${networkName}`,
        networkData
      );
      return;
    }

    console.log("Current Ethereum provider:", window.ethereum);
    // Check if the network is already added in MetaMask
    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    console.log("🚀 ~ changeNetwork ~ currentChainId:", currentChainId);

    // If the selected network is not the same as the current network, switch the network
    if (currentChainId !== networkData.chainId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networkData.chainId }],
      });
    } else {
      console.log("Already on the selected network");
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{ ...networks[networkName] }],
    });

    SuccessToast(`Tradingg Now on ${networkName} Network`);
    console.log(`Switched to================= ${networkName}`);
  } catch (error) {
    console.error("Error switching network:", error);
  }
};

// Listen for network change and update the marketplace
const handleNetworkChange = async () => {
  if (!window.ethereum) return;

  window.ethereum.on("chainChanged", async (chainId) => {
    console.log("Network changed to:", chainId);

    // Get the network name based on chainId
    const selectedNetwork = Object.keys(networks).find(
      (key) => networks[key].chainId === chainId
    );

    if (selectedNetwork) {
      console.log(`Using marketplace of: ${selectedNetwork}`);

      // Update marketplace contract addresses for this network
      updateMarketplace(selectedNetwork);

      // Fetch updated contract instances
      const marketplaceContract = await getNFTMarketplaceContract(
        selectedNetwork
      );
      const vendorNFTContract = await getVendorNFTContract(selectedNetwork);

      console.log("Updated Marketplace Contract:", marketplaceContract);
      console.log("Updated Vendor NFT Contract:", vendorNFTContract);
    }
  });
};

// Call this function at app start to listen for changes
handleNetworkChange();

export const handleNetworkSwitch = async () => {
  const networkName = "polygon_amoy"; // Change this as needed
  await changeNetwork({ networkName });
};

//  const fetchMetadata = async (tokenId) => {
//     try {
//       const url = await tokenURI(tokenId);
//       const parsedFile = await fetchMetadataFromPinata(url);

//       return {
//         name: parsedFile.name,
//         description: parsedFile.description,
//         image: parsedFile.image,
//         category: parsedFile.category,
//         collection: parsedFile.collection,
//         properties: parsedFile.properties,
//         royalties: parsedFile.royalties,
//       };
//     } catch (error) {
//       console.error("Error fetching metadata:", error);
//       return null; // Return null if metadata fetching fails
//     }
//   };

//   const fetchNFTSpeed = async () => {
//     try {
//       setIsLoading(true);

//       // Fetch the active listings (or all listings if you prefer)
//       const response = await getActiveListings();

//       // Step 1: Fetch metadata for each NFT concurrently
//       const groupedByCollection = {};

//       // Create an array of promises to fetch metadata for all NFTs
//       const metadataPromises = response.map(async (nft) => {
//         const formattedItem = {
//           itemId: nft.itemId.toString(),
//           nftContract: nft.nftContract,
//           tokenId: nft.tokenId.toString(),
//           owner: nft.owner,
//           seller: nft.seller,
//           price: nft.price.toString(),
//           currentlyListed: nft.currentlyListed,
//         };

//         try {
//           // Fetch the metadata for this NFT
//           const metadata = await fetchMetadata(nft.tokenId); // Use your existing fetchMetadata function

//           // Add metadata to the formatted item
//           formattedItem.name = metadata.name;
//           formattedItem.description = metadata.description;
//           formattedItem.image = metadata.image;
//           formattedItem.collection = metadata.collection; // Assuming collection info is in category
//           formattedItem.properties = metadata.properties;
//           formattedItem.royalties = metadata.royalties;

//           // Group NFTs by collection
//           if (!groupedByCollection[formattedItem.collection]) {
//             groupedByCollection[formattedItem.collection] = [];
//           }
//           groupedByCollection[formattedItem.collection].push(formattedItem);
//         } catch (err) {
//           console.error("Error processing NFT metadata:", err);
//         }
//       });

//       // Wait for all metadata fetches to complete
//       await Promise.all(metadataPromises);

//       const selectedNFTs = Object.keys(groupedByCollection).map(
//         (collectionName) => {
//           return groupedByCollection[collectionName][0]; // Select the first NFT from each collection group
//         }
//       );

//       // Step 3: Set the selected NFTs to state
//       setTradingNFTs(selectedNFTs);
//       setIsLoading(false);
//     } catch (error) {
//       console.error("Error fetching NFTs:", error);
//       setIsLoading(false);
//     }
//   };