import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { ICOContent } from "../Context";
import { Toaster } from "react-hot-toast";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { nftAPI } from "../services/api";
import { PINATA_API_KEY, PINATA_SECRET_KEY, PINATA_JWT } from "../Context/constants";
import { TiUpload } from "react-icons/ti";
import { FiArrowLeft } from "react-icons/fi";

export default function Create() {
  const contexts = useContext(ICOContent);
  const navigate = useNavigate();
  const { address, selectedChain } = contexts;

  // Workflow state: 'choice', 'singleNFT', or 'collection'
  const [workflow, setWorkflow] = useState('choice');
  
  // For single NFT creation
  const [userCollections, setUserCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);

  // Network options for NFT creation with official icons
  const networkOptions = [
    { 
      value: "polygon", 
      label: "Polygon", 
      symbol: "POL",
      icon: "https://wallet-asset.matic.network/img/tokens/pol.svg"
    },
    { 
      value: "ethereum", 
      label: "Ethereum", 
      symbol: "ETH",
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"
    },
    { 
      value: "arbitrum", 
      label: "Arbitrum", 
      symbol: "ETH",
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png"
    },
    { 
      value: "bsc", 
      label: "BSC", 
      symbol: "BNB",
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png"
    },
    { 
      value: "base", 
      label: "Base", 
      symbol: "ETH",
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png"
    },
    { 
      value: "solana", 
      label: "Solana", 
      symbol: "SOL",
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png"
    },
  ];

  const [files, setFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  
  // Single NFT form
  const [singleNFTForm, setSingleNFTForm] = useState({
    price: "",
    floorPrice: "",
    name: "",
    description: "",
    properties: "",
    category: "",
    network: selectedChain || "polygon",
    pieces: "1",
  });

  // Collection form
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    description: "",
    image: null,
    imageURL: "",
    category: "",
    network: selectedChain || "polygon",
  });

  const SUPPORTED_IMAGE_TYPES = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff'];
  const SUPPORTED_VIDEO_TYPES = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

  const isVideoFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return SUPPORTED_VIDEO_TYPES.includes(ext);
  };

  useEffect(() => {
    if (selectedChain) {
      setSingleNFTForm(prev => ({
        ...prev,
        network: selectedChain
      }));
      setCollectionForm(prev => ({
        ...prev,
        network: selectedChain
      }));
    }
    fetchUserCollections();
  }, [selectedChain, address]);

  const fetchUserCollections = async () => {
    if (!address) return;
    try {
      // Fetch collections created by current user
      const collections = await nftAPI.getUserCollections(address);
      setUserCollections(Array.isArray(collections) ? collections : []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setUserCollections([]);
    }
  };

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    // Convert files to Base64 data URLs (persist across sessions)
    const urls = selectedFiles.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result); // Base64 data URL
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(urls).then(setImageURLs);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const selectedFiles = Array.from(e.dataTransfer.files);
    setFiles(selectedFiles);
    // Convert files to Base64 data URLs (persist across sessions)
    const urls = selectedFiles.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result); // Base64 data URL
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(urls).then(setImageURLs);
  };





  // ============ SINGLE NFT CREATION ============
  const handleCreateSingleNFT = async (event) => {
    event.preventDefault();
    if (imageURLs.length === 0) {
      return ErrorToast("Upload NFT image!");
    }
    if (!address) {
      return ErrorToast("Please connect your wallet first!");
    }

    try {
      const timestamp = Date.now();

      for (let i = 0; i < imageURLs.length; i++) {
        const isVideo = isVideoFile(files[i]);
        
        const nftData = {
          itemId: `${timestamp}_${i}`,
          network: singleNFTForm.network,
          owner: address,
          seller: address,
          price: singleNFTForm.price || '0',
          floorPrice: singleNFTForm.floorPrice || singleNFTForm.price || '0',
          name: singleNFTForm.name || `NFT #${i + 1}`,
          description: singleNFTForm.description,
          image: imageURLs[i] || 'https://via.placeholder.com/400x400?text=NFT+Image', // Use placeholder if no image
          category: singleNFTForm.category,
          properties: singleNFTForm.properties || {},
          collection: selectedCollectionId || null,
          isMinted: false,
          currentlyListed: false,
          pieces: parseInt(singleNFTForm.pieces) || 1,
          remainingPieces: parseInt(singleNFTForm.pieces) || 1
        };

        await nftAPI.createNft(nftData);
      }

      SuccessToast("NFT(s) created successfully!");
      setTimeout(() => navigate("/profile"), 2000);
    } catch (error) {
      console.error("Error creating NFT:", error);
      ErrorToast("Failed to create NFT. Please try again.");
    }
  };

  // ============ COLLECTION CREATION ============
  const handleCreateCollection = async (event) => {
    event.preventDefault();
    if (!address) {
      return ErrorToast("Please connect your wallet first!");
    }

    try {
      let collectionImageURL = collectionForm.imageURL;

      // For now, skip IPFS upload and use placeholder or existing URL
      if (!collectionImageURL) {
        collectionImageURL = 'https://via.placeholder.com/400x400?text=Collection+Image';
      }

      const collectionData = {
        name: collectionForm.name,
        description: collectionForm.description,
        image: collectionImageURL,
        category: collectionForm.category,
        network: collectionForm.network,
        creatorWallet: address,
        creatorName: address.substring(0, 10) + '...',
        collectionId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary fix
      };

      // Create collection in database
      const response = await nftAPI.createCollection(collectionData);
      
      SuccessToast("Collection created successfully!");
      setTimeout(() => navigate(`/collection/${response._id}`), 2000);
    } catch (error) {
      console.error("Error creating collection:", error);
      ErrorToast("Failed to create collection. Please try again.");
    }
  };

  // ============ CHOICE SCREEN ============
  if (workflow === 'choice') {
    return (
      <div className="min-h-screen w-full flex flex-col bg-black text-white">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Create NFT</h1>
            <p className="text-gray-400 text-lg">Choose how you want to create</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
            {/* Single NFT Option */}
            <button
              onClick={() => {
                setWorkflow('singleNFT');
                setImageURLs([]);
                setFiles([]);
              }}
              className="bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border border-purple-500/30"
            >
              <div className="text-4xl mb-4">🎨</div>
              <h2 className="text-2xl font-bold mb-2">Create Single NFT</h2>
              <p className="text-purple-200 text-sm mb-6">Create an individual NFT and optionally add it to a collection</p>
              <div className="bg-purple-900/50 rounded-lg p-3 text-sm text-purple-100 text-left">
                <ul className="space-y-1">
                  <li>✓ Upload NFT image/video</li>
                  <li>✓ Set price and floor price</li>
                  <li>✓ Add to existing collection</li>
                </ul>
              </div>
            </button>

            {/* Collection Option */}
            <button
              onClick={() => {
                setWorkflow('collection');
                setImageURLs([]);
                setFiles([]);
              }}
              className="bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border border-blue-500/30"
            >
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-2xl font-bold mb-2">Create Collection</h2>
              <p className="text-blue-200 text-sm mb-6">Create a collection first, then add NFTs to it</p>
              <div className="bg-blue-900/50 rounded-lg p-3 text-sm text-blue-100 text-left">
                <ul className="space-y-1">
                  <li>✓ Collection details</li>
                  <li>✓ Collection image</li>
                  <li>✓ Add NFTs later</li>
                </ul>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ SINGLE NFT CREATION FORM ============
  if (workflow === 'singleNFT') {
    return (
      <div className="min-h-screen w-full flex flex-col bg-black text-white">
        <Header />
        <Toaster position="left" />
        <div className="p-4 sm:p-8">
          <button
            onClick={() => setWorkflow('choice')}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <FiArrowLeft /> Back
          </button>

          <h1 className="text-center text-3xl font-bold mb-2">Create Single NFT</h1>
          <p className="text-center text-gray-400 mb-8">Create an individual NFT with price and floor price</p>

          <form onSubmit={handleCreateSingleNFT} className="flex flex-col gap-6 px-2 max-w-2xl mx-auto">
            {/* Image Upload */}
            <div className="w-full">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                htmlFor="imageUpload"
                className={`w-full h-[200px] sm:h-[250px] rounded-xl outline-dashed flex flex-col items-center justify-center p-3 gap-3 transition-colors ${
                  dragActive
                    ? "outline-blue-500 bg-blue-500/10"
                    : "outline-pink-500/30 dark:bg-darkBlue-500"
                }`}
              >
                <div className="gap-3 flex flex-col items-center">
                  <TiUpload className="text-purple-500 text-4xl" />
                  <b className="text-white/80 text-sm sm:text-base">Upload NFT Media</b>
                  <span className="text-white/70 text-sm sm:text-base text-center">Drag or choose your files</span>
                </div>
              </label>
              <input
                id="imageUpload"
                type="file"
                accept=".svg, .png, .jpg, .jpeg, .gif, .mp4, .webm, .mov, .avi, .mkv"
                multiple
                onChange={handleFilesChange}
                hidden
              />

              {imageURLs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {imageURLs.map((url, index) => (
                    <div key={index} className="relative">
                      {isVideoFile(files[index]) ? (
                        <video src={url} className="w-full h-24 object-cover rounded-lg bg-black" />
                      ) : (
                        <img src={url} alt={`NFT ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">NFT Name *</label>
                <input
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  type="text"
                  placeholder="NFT name"
                  value={singleNFTForm.name}
                  onChange={(e) => setSingleNFTForm({...singleNFTForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">Collection (Optional)</label>
                <select
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  value={selectedCollectionId || ''}
                  onChange={(e) => setSelectedCollectionId(e.target.value || null)}
                >
                  <option value="">No collection</option>
                  {userCollections.map(col => (
                    <option key={col._id} value={col._id}>{col.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-white/70 font-semibold text-sm">Description *</label>
              <textarea
                rows={4}
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                placeholder="Describe your NFT"
                value={singleNFTForm.description}
                onChange={(e) => setSingleNFTForm({...singleNFTForm, description: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">Price *</label>
                <input
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  type="number"
                  placeholder="Price"
                  step="0.0001"
                  value={singleNFTForm.price}
                  onChange={(e) => setSingleNFTForm({...singleNFTForm, price: e.target.value})}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">Floor Price *</label>
                <input
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  type="number"
                  placeholder="Floor price"
                  step="0.0001"
                  value={singleNFTForm.floorPrice}
                  onChange={(e) => setSingleNFTForm({...singleNFTForm, floorPrice: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">Category *</label>
                <select
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  value={singleNFTForm.category}
                  onChange={(e) => setSingleNFTForm({...singleNFTForm, category: e.target.value})}
                  required
                >
                  <option value="">Select category</option>
                  <option value="gaming">Gaming</option>
                  <option value="sports">Sports</option>
                  <option value="music">Music</option>
                  <option value="art">Art</option>
                  <option value="photography">Photography</option>
                  <option value="utility">Utility</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">Network *</label>
                <select
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  value={singleNFTForm.network}
                  onChange={(e) => setSingleNFTForm({...singleNFTForm, network: e.target.value})}
                  required
                >
                  {networkOptions.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.label} ({network.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center mt-6 gap-4">
              <button
                type="button"
                onClick={() => setWorkflow('choice')}
                className="px-8 py-3 rounded-lg font-semibold border border-gray-600 hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
              >
                Create NFT
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============ COLLECTION CREATION FORM ============
  if (workflow === 'collection') {
    return (
      <div className="min-h-screen w-full flex flex-col bg-black text-white">
        <Header />
        <Toaster position="left" />
        <div className="p-4 sm:p-8">
          <button
            onClick={() => setWorkflow('choice')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
          >
            <FiArrowLeft /> Back
          </button>

          <h1 className="text-center text-3xl font-bold mb-2">Create Collection</h1>
          <p className="text-center text-gray-400 mb-8">Create a collection for your NFTs</p>

          <form onSubmit={handleCreateCollection} className="flex flex-col gap-6 px-2 max-w-2xl mx-auto">
            {/* Collection Image Upload */}
            <div className="w-full">
              <label className="text-white/70 font-semibold text-sm mb-2 block">Collection Image</label>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                htmlFor="collectionImageUpload"
                className={`w-full h-[200px] rounded-xl outline-dashed flex flex-col items-center justify-center p-3 gap-3 transition-colors ${
                  dragActive
                    ? "outline-blue-500 bg-blue-500/10"
                    : "outline-pink-500/30"
                }`}
              >
                <TiUpload className="text-blue-500 text-4xl" />
                <div className="text-center">
                  <b className="text-white/80">Upload Collection Image</b>
                  <p className="text-white/70 text-sm">Drag or choose image</p>
                </div>
              </label>
              <input
                id="collectionImageUpload"
                type="file"
                accept=".svg, .png, .jpg, .jpeg, .gif, .webp"
                onChange={handleFilesChange}
                hidden
              />

              {imageURLs.length > 0 && (
                <div className="mt-4">
                  <img src={imageURLs[0]} alt="Collection" className="w-32 h-32 object-cover rounded-lg" />
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-2">
              <label className="text-white/70 font-semibold text-sm">Collection Name *</label>
              <input
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                type="text"
                placeholder="Collection name"
                value={collectionForm.name}
                onChange={(e) => setCollectionForm({...collectionForm, name: e.target.value})}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-white/70 font-semibold text-sm">Description *</label>
              <textarea
                rows={4}
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                placeholder="Describe your collection"
                value={collectionForm.description}
                onChange={(e) => setCollectionForm({...collectionForm, description: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">Category *</label>
                <select
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  value={collectionForm.category}
                  onChange={(e) => setCollectionForm({...collectionForm, category: e.target.value})}
                  required
                >
                  <option value="">Select category</option>
                  <option value="gaming">Gaming</option>
                  <option value="sports">Sports</option>
                  <option value="music">Music</option>
                  <option value="art">Art</option>
                  <option value="photography">Photography</option>
                  <option value="utility">Utility</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/70 font-semibold text-sm">Network *</label>
                <select
                  className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                  value={collectionForm.network}
                  onChange={(e) => setCollectionForm({...collectionForm, network: e.target.value})}
                  required
                >
                  {networkOptions.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.label} ({network.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center mt-6 gap-4">
              <button
                type="button"
                onClick={() => setWorkflow('choice')}
                className="px-8 py-3 rounded-lg font-semibold border border-gray-600 hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
              >
                Create Collection
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}