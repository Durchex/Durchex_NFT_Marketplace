import { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { ICOContent } from "../Context";
import { Toaster, toast } from "react-hot-toast";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { nftAPI, lazyMintAPI, batchMintAPI } from "../services/api";
import { uploadToIPFS, uploadMetadataToIPFS } from "../services/ipfs";
import { TiUpload } from "react-icons/ti";
import { FiArrowLeft } from "react-icons/fi";

export default function Create() {
  const contexts = useContext(ICOContent);
  const navigate = useNavigate();
  const { address, selectedChain } = contexts;

  // Tab state: 'lazy', 'batch', or 'collection'
  const [activeTab, setActiveTab] = useState('lazy');
  
  // Collection state
  const [userCollections, setUserCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [showCollectionForm, setShowCollectionForm] = useState(false);

  // Network options
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
  ];

  // ============ LAZY MINT STATE ============
  const [lazyMintStep, setLazyMintStep] = useState(1);
  const [lazyMintForm, setLazyMintForm] = useState({
    name: '',
    description: '',
    royaltyPercentage: 10,
    pieces: 1,
    price: '',
    category: '',
    network: selectedChain || "polygon",
    enableStraightBuy: true,
  });
  const [lazyMintImageFile, setLazyMintImageFile] = useState(null);
  const [lazyMintImagePreview, setLazyMintImagePreview] = useState(null);
  const [lazyMintLoading, setLazyMintLoading] = useState(false);
  const [lazyMintError, setLazyMintError] = useState('');
  const [lazyMintSuccess, setLazyMintSuccess] = useState('');
  const [lazyMintIpfsURI, setLazyMintIpfsURI] = useState('');
  const [lazyMintSignature, setLazyMintSignature] = useState('');
  const [lazyMintMessageHash, setLazyMintMessageHash] = useState('');
  const [lazyMintNonce, setLazyMintNonce] = useState(0);

  // ============ BATCH MINT STATE ============
  const [batchMintUploadMethod, setBatchMintUploadMethod] = useState('manual');
  const [batchMintNFTs, setBatchMintNFTs] = useState([]);
  const [batchMintLoading, setBatchMintLoading] = useState(false);
  const [batchMintError, setBatchMintError] = useState('');
  const [batchMintSuccess, setBatchMintSuccess] = useState('');
  const [batchMintAutoPublish, setBatchMintAutoPublish] = useState(false);
  const [batchMintEnableStraightBuy, setBatchMintEnableStraightBuy] = useState(true);
  const [batchMintCollection, setBatchMintCollection] = useState(null);

  // ============ COLLECTION STATE ============
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    description: "",
    image: null,
    imageURL: "",
    category: "",
    network: selectedChain || "polygon",
  });
  const [collectionDragActive, setCollectionDragActive] = useState(false);

  useEffect(() => {
    if (selectedChain) {
      setLazyMintForm(prev => ({ ...prev, network: selectedChain }));
      setCollectionForm(prev => ({ ...prev, network: selectedChain }));
    }
    fetchUserCollections();
  }, [selectedChain, address]);

  const fetchUserCollections = async () => {
    if (!address) return;
    try {
      const collections = await nftAPI.getUserCollections(address);
      setUserCollections(Array.isArray(collections) ? collections : []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setUserCollections([]);
    }
  };

  // ============ LAZY MINT HANDLERS ============
  const handleLazyMintImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setLazyMintError('Please select a valid image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setLazyMintError('Image size must be less than 10MB');
        return;
      }
      setLazyMintImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLazyMintImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setLazyMintError('');
    }
  };

  const handleLazyMintUploadToIPFS = async () => {
    try {
      setLazyMintLoading(true);
      setLazyMintError('');

      if (!lazyMintImageFile) {
        throw new Error('Please select an image');
      }
      if (!lazyMintForm.name.trim()) {
        throw new Error('Please enter NFT name');
      }

      // Upload image to IPFS
      const imageHash = await uploadToIPFS(lazyMintImageFile);
      const imageURI = `ipfs://${imageHash}`;

      // Create metadata JSON
      const metadata = {
        name: lazyMintForm.name,
        description: lazyMintForm.description,
        image: imageURI,
        attributes: [],
        pieces: lazyMintForm.pieces,
        collection: selectedCollectionId || null,
      };

      // Upload metadata to IPFS
      const metadataHash = await uploadMetadataToIPFS(metadata);
      const finalURI = `ipfs://${metadataHash}`;
      setLazyMintIpfsURI(finalURI);

      setLazyMintSuccess('Image and metadata uploaded to IPFS');
      setLazyMintStep(2);
      setLazyMintLoading(false);
    } catch (err) {
      console.error('Error uploading to IPFS:', err);
      setLazyMintError(err.message);
      setLazyMintLoading(false);
    }
  };

  const handleLazyMintSign = async () => {
    try {
      setLazyMintLoading(true);
      setLazyMintError('');

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const creatorAddress = await signer.getAddress();

      // Get current nonce
      const nonceResponse = await lazyMintAPI.getCreatorNonce(creatorAddress);
      const currentNonce = nonceResponse.nonce || 0;
      setLazyMintNonce(currentNonce);

      // Create message to sign
      const messageHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'uint256'],
        [lazyMintIpfsURI, lazyMintForm.royaltyPercentage, currentNonce]
      );

      // Sign the message
      const sig = await signer.signMessage(ethers.utils.arrayify(messageHash));

      setLazyMintSignature(sig);
      setLazyMintMessageHash(messageHash);

      setLazyMintSuccess('Signature created! Your NFT is ready to sell.');
      setLazyMintStep(3);
      setLazyMintLoading(false);
    } catch (err) {
      console.error('Error signing:', err);
      setLazyMintError(err.message);
      setLazyMintLoading(false);
    }
  };

  const handleLazyMintSubmit = async () => {
    try {
      setLazyMintLoading(true);
      setLazyMintError('');

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const creatorAddress = await signer.getAddress();

      // Submit lazy mint to backend
      const response = await lazyMintAPI.submitLazyMint({
        name: lazyMintForm.name,
        description: lazyMintForm.description,
        ipfsURI: lazyMintIpfsURI,
        royaltyPercentage: lazyMintForm.royaltyPercentage,
        signature: lazyMintSignature,
        messageHash: lazyMintMessageHash,
        nonce: lazyMintNonce,
        pieces: lazyMintForm.pieces,
        price: lazyMintForm.price,
        category: lazyMintForm.category,
        collection: selectedCollectionId,
        enableStraightBuy: lazyMintForm.enableStraightBuy,
      });

      if (response.success) {
        toast.success(`✅ NFT "${lazyMintForm.name}" is now available for sale!`);
        // Reset form
        setTimeout(() => {
          setLazyMintStep(1);
          setLazyMintForm({ name: '', description: '', royaltyPercentage: 10, pieces: 1, price: '', category: '', network: selectedChain || "polygon", enableStraightBuy: true });
          setLazyMintImageFile(null);
          setLazyMintImagePreview(null);
          setLazyMintIpfsURI('');
          setLazyMintSignature('');
          setLazyMintMessageHash('');
        }, 2000);
      }

      setLazyMintLoading(false);
    } catch (err) {
      console.error('Error submitting to marketplace:', err);
      setLazyMintError(err.message);
      setLazyMintLoading(false);
    }
  };

  // ============ BATCH MINT HANDLERS ============
  const handleBatchMintCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const uploadedNFTs = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const nft = {};

          for (let j = 0; j < headers.length; j++) {
            nft[headers[j]] = values[j] || '';
          }

          if (nft.name && nft.description) {
            uploadedNFTs.push({
              name: nft.name,
              description: nft.description,
              image: nft['image url'] || nft.image || '',
              royaltyPercentage: parseInt(nft['royalty %']) || 0,
              pieces: parseInt(nft.pieces) || 1,
              attributes: []
            });
          }
        }

        if (uploadedNFTs.length === 0) {
          throw new Error('No valid NFTs found in CSV');
        }

        if (uploadedNFTs.length > 1000) {
          throw new Error('Maximum 1000 NFTs per batch');
        }

        setBatchMintNFTs(uploadedNFTs);
        setBatchMintError('');
        setBatchMintSuccess(`${uploadedNFTs.length} NFTs loaded from CSV`);
      } catch (err) {
        setBatchMintError(err.message);
      }
    };

    reader.readAsText(file);
  };

  const addBatchMintNFT = () => {
    if (batchMintNFTs.length >= 1000) {
      setBatchMintError('Maximum 1000 NFTs per batch');
      return;
    }

    setBatchMintNFTs([...batchMintNFTs, {
      name: '',
      description: '',
      image: '',
      royaltyPercentage: 0,
      pieces: 1,
      attributes: []
    }]);
  };

  const handleBatchMintNFTChange = (index, field, value) => {
    const updatedNFTs = [...batchMintNFTs];
    updatedNFTs[index][field] = value;
    setBatchMintNFTs(updatedNFTs);
  };

  const removeBatchMintNFT = (index) => {
    setBatchMintNFTs(batchMintNFTs.filter((_, i) => i !== index));
  };

  const handleBatchMintSubmit = async () => {
    if (batchMintNFTs.length === 0) {
      setBatchMintError('Add at least one NFT');
      return;
    }

    for (let i = 0; i < batchMintNFTs.length; i++) {
      if (!batchMintNFTs[i].name || !batchMintNFTs[i].description) {
        setBatchMintError(`NFT ${i + 1}: Name and description required`);
        return;
      }
    }

    setBatchMintLoading(true);
    setBatchMintError('');

    try {
      const result = await batchMintAPI.createBatch({
        nfts: batchMintNFTs,
        autoPublish: batchMintAutoPublish,
        collection: batchMintCollection || selectedCollectionId,
        enableStraightBuy: batchMintEnableStraightBuy,
      });

      toast.success('Batch mint created successfully!');
      setTimeout(() => {
        setBatchMintNFTs([]);
      }, 1500);
    } catch (err) {
      setBatchMintError(err.message || 'Failed to create batch mint');
    } finally {
      setBatchMintLoading(false);
    }
  };

  // ============ COLLECTION HANDLERS ============
  const handleCollectionFilesChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCollectionForm({ ...collectionForm, imageURL: event.target.result, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCollectionDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCollectionDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCollectionForm({ ...collectionForm, imageURL: event.target.result, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first!");
      return;
    }

    try {
      let collectionImageURL = collectionForm.imageURL;

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
        collectionId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const response = await nftAPI.createCollection(collectionData);
      
      toast.success("Collection created successfully!");
      await fetchUserCollections();
      setSelectedCollectionId(response._id);
      setShowCollectionForm(false);
      setCollectionForm({ name: "", description: "", image: null, imageURL: "", category: "", network: selectedChain || "polygon" });
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-white">
      <Header />
      <Toaster position="top-right" />
      
      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">Create NFT</h1>
          <p className="text-gray-400 text-center mb-8">Choose your creation method</p>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('lazy')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'lazy'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Lazy Mint
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'batch'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Batch Mint
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'collection'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Create Collection
            </button>
          </div>

          {/* Collection Selection (shown for lazy and batch tabs) */}
          {(activeTab === 'lazy' || activeTab === 'batch') && (
            <div className="mb-6 p-4 bg-gray-950 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <label className="text-white/70 font-semibold text-sm">Collection (Optional)</label>
                <button
                  type="button"
                  onClick={() => setShowCollectionForm(!showCollectionForm)}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  {showCollectionForm ? 'Cancel' : '+ Create New'}
                </button>
              </div>

              {showCollectionForm ? (
                <div className="space-y-4">
                  <input
                    className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                    type="text"
                    placeholder="Collection name"
                    value={collectionForm.name}
                    onChange={(e) => setCollectionForm({...collectionForm, name: e.target.value})}
                  />
                  <textarea
                    rows={2}
                    className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                    placeholder="Collection description"
                    value={collectionForm.description}
                    onChange={(e) => setCollectionForm({...collectionForm, description: e.target.value})}
                  />
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCollectionForm(false)}
                      className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCollection}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                    >
                      Create Collection
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                  value={selectedCollectionId || ''}
                  onChange={(e) => setSelectedCollectionId(e.target.value || null)}
                >
                  <option value="">No collection</option>
                  {userCollections.map(col => (
                    <option key={col._id} value={col._id}>{col.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* LAZY MINT TAB */}
          {activeTab === 'lazy' && (
            <div className="space-y-6">
              {lazyMintError && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
                  {lazyMintError}
                </div>
              )}
              {lazyMintSuccess && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-green-300">
                  {lazyMintSuccess}
                </div>
              )}

              {/* Step 1: Upload */}
              {lazyMintStep === 1 && (
                <div className="bg-gray-950 rounded-lg border border-gray-800 p-6 space-y-6">
                  <h2 className="text-2xl font-bold">Upload NFT</h2>
                  
                  <div>
                    <label className="text-white/70 font-semibold text-sm mb-2 block">NFT Image *</label>
                    <label
                      htmlFor="lazyMintImage"
                      className="w-full h-[200px] rounded-xl outline-dashed flex flex-col items-center justify-center p-3 gap-3 transition-colors outline-pink-500/30 cursor-pointer hover:outline-pink-500/50"
                    >
                      <TiUpload className="text-purple-500 text-4xl" />
                      <b className="text-white/80">Upload NFT Image</b>
                      <span className="text-white/70 text-sm">Click or drag and drop</span>
                    </label>
                    <input
                      id="lazyMintImage"
                      type="file"
                      accept="image/*"
                      onChange={handleLazyMintImageChange}
                      className="hidden"
                    />
                    {lazyMintImagePreview && (
                      <div className="mt-4">
                        <img src={lazyMintImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-white/70 font-semibold text-sm mb-2 block">NFT Name *</label>
                      <input
                        className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                        type="text"
                        placeholder="NFT name"
                        value={lazyMintForm.name}
                        onChange={(e) => setLazyMintForm({...lazyMintForm, name: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-white/70 font-semibold text-sm mb-2 block">Number of Pieces (Stock) *</label>
                      <input
                        className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={lazyMintForm.pieces}
                        onChange={(e) => setLazyMintForm({...lazyMintForm, pieces: parseInt(e.target.value) || 1})}
                        required
                      />
                      <small className="text-gray-400 text-xs">Total copies available for sale</small>
                    </div>
                  </div>

                  <div>
                    <label className="text-white/70 font-semibold text-sm mb-2 block">Description *</label>
                    <textarea
                      rows={4}
                      className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                      placeholder="Describe your NFT"
                      value={lazyMintForm.description}
                      onChange={(e) => setLazyMintForm({...lazyMintForm, description: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-white/70 font-semibold text-sm mb-2 block">Price (ETH) *</label>
                      <input
                        className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                        type="number"
                        step="0.0001"
                        placeholder="0.1"
                        value={lazyMintForm.price}
                        onChange={(e) => setLazyMintForm({...lazyMintForm, price: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-white/70 font-semibold text-sm mb-2 block">Royalty Percentage (0-50%)</label>
                      <input
                        className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                        type="number"
                        min="0"
                        max="50"
                        value={lazyMintForm.royaltyPercentage}
                        onChange={(e) => setLazyMintForm({...lazyMintForm, royaltyPercentage: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-white/70 font-semibold text-sm mb-2 block">Category *</label>
                      <select
                        className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                        value={lazyMintForm.category}
                        onChange={(e) => setLazyMintForm({...lazyMintForm, category: e.target.value})}
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

                    <div>
                      <label className="text-white/70 font-semibold text-sm mb-2 block">Network *</label>
                      <select
                        className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                        value={lazyMintForm.network}
                        onChange={(e) => setLazyMintForm({...lazyMintForm, network: e.target.value})}
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

                  <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg">
                    <input
                      type="checkbox"
                      id="enableStraightBuy"
                      checked={lazyMintForm.enableStraightBuy}
                      onChange={(e) => setLazyMintForm({...lazyMintForm, enableStraightBuy: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <label htmlFor="enableStraightBuy" className="text-white/70 text-sm">
                      Enable straight buy and mint (Buyers can purchase and mint immediately)
                    </label>
                  </div>

                  <button
                    onClick={handleLazyMintUploadToIPFS}
                    disabled={lazyMintLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                  >
                    {lazyMintLoading ? 'Uploading...' : 'Upload to IPFS'}
                  </button>
                </div>
              )}

              {/* Step 2: Sign */}
              {lazyMintStep === 2 && (
                <div className="bg-gray-950 rounded-lg border border-gray-800 p-6 space-y-6">
                  <h2 className="text-2xl font-bold">Sign with Wallet</h2>
                  <p className="text-gray-400">Sign the NFT metadata with your wallet. This proves you created it.</p>
                  <p className="text-purple-400 text-sm">ℹ️ This is OFF-CHAIN - no blockchain transaction or gas fees!</p>

                  <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                    <p><strong>Name:</strong> {lazyMintForm.name}</p>
                    <p><strong>Pieces:</strong> {lazyMintForm.pieces}</p>
                    <p><strong>Royalty:</strong> {lazyMintForm.royaltyPercentage}%</p>
                    <p><strong>IPFS URI:</strong> <code className="text-xs">{lazyMintIpfsURI.substring(0, 40)}...</code></p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setLazyMintStep(1)}
                      className="flex-1 px-6 py-3 rounded-lg border border-gray-600 hover:bg-gray-900"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleLazyMintSign}
                      disabled={lazyMintLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {lazyMintLoading ? 'Signing...' : 'Sign with MetaMask'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Publish */}
              {lazyMintStep === 3 && (
                <div className="bg-gray-950 rounded-lg border border-gray-800 p-6 space-y-6">
                  <h2 className="text-2xl font-bold">Publish to Marketplace</h2>
                  <p>Your NFT is ready! Publish it to the marketplace now.</p>

                  <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">Summary</h4>
                    <p><strong>NFT Name:</strong> {lazyMintForm.name}</p>
                    <p><strong>Pieces:</strong> {lazyMintForm.pieces}</p>
                    <p><strong>Creator Royalty:</strong> {lazyMintForm.royaltyPercentage}%</p>
                    <p><strong>Straight Buy:</strong> {lazyMintForm.enableStraightBuy ? 'Enabled' : 'Disabled'}</p>
                    <p className="text-purple-400 text-sm mt-2">
                      💡 Once published, buyers can {lazyMintForm.enableStraightBuy ? 'immediately purchase and mint' : 'purchase and hold until minting is enabled'} your NFT!
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setLazyMintStep(2)}
                      className="flex-1 px-6 py-3 rounded-lg border border-gray-600 hover:bg-gray-900"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleLazyMintSubmit}
                      disabled={lazyMintLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {lazyMintLoading ? 'Publishing...' : '🚀 Publish to Marketplace'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BATCH MINT TAB */}
          {activeTab === 'batch' && (
            <div className="space-y-6">
              {batchMintError && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
                  {batchMintError}
                </div>
              )}
              {batchMintSuccess && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-green-300">
                  {batchMintSuccess}
                </div>
              )}

              <div className="bg-gray-950 rounded-lg border border-gray-800 p-6 space-y-6">
                <h2 className="text-2xl font-bold">Batch Mint NFTs</h2>

                {/* Upload Method */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="batchMethod"
                      value="manual"
                      checked={batchMintUploadMethod === 'manual'}
                      onChange={(e) => setBatchMintUploadMethod(e.target.value)}
                    />
                    <span>Manual Entry</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="batchMethod"
                      value="csv"
                      checked={batchMintUploadMethod === 'csv'}
                      onChange={(e) => setBatchMintUploadMethod(e.target.value)}
                    />
                    <span>CSV Upload</span>
                  </label>
                </div>

                {/* CSV Upload */}
                {batchMintUploadMethod === 'csv' && (
                  <div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBatchMintCSVUpload}
                      className="hidden"
                      id="csvUpload"
                    />
                    <label
                      htmlFor="csvUpload"
                      className="w-full h-[150px] rounded-xl outline-dashed flex flex-col items-center justify-center p-3 gap-3 transition-colors outline-pink-500/30 cursor-pointer hover:outline-pink-500/50"
                    >
                      <TiUpload className="text-purple-500 text-4xl" />
                      <b className="text-white/80">Upload CSV File</b>
                      <span className="text-white/70 text-sm">Click to select CSV file</span>
                    </label>
                  </div>
                )}

                {/* Manual Entry */}
                {batchMintUploadMethod === 'manual' && (
                  <button
                    type="button"
                    onClick={addBatchMintNFT}
                    className="w-full bg-gray-900 hover:bg-gray-800 py-3 rounded-lg border border-gray-700"
                  >
                    + Add NFT ({batchMintNFTs.length}/1000)
                  </button>
                )}

                {/* NFT List */}
                {batchMintNFTs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">NFTs to Mint ({batchMintNFTs.length})</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {batchMintNFTs.map((nft, idx) => (
                        <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-purple-400 font-semibold">#{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeBatchMintNFT(idx)}
                              className="text-red-400 hover:text-red-300"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="NFT Name"
                              value={nft.name}
                              onChange={(e) => handleBatchMintNFTChange(idx, 'name', e.target.value)}
                              className="bg-gray-800 text-gray-100 rounded-lg p-2"
                            />
                            <input
                              type="number"
                              min="1"
                              placeholder="Pieces (Stock)"
                              value={nft.pieces}
                              onChange={(e) => handleBatchMintNFTChange(idx, 'pieces', parseInt(e.target.value) || 1)}
                              className="bg-gray-800 text-gray-100 rounded-lg p-2"
                            />
                            <textarea
                              placeholder="Description"
                              value={nft.description}
                              onChange={(e) => handleBatchMintNFTChange(idx, 'description', e.target.value)}
                              rows={2}
                              className="bg-gray-800 text-gray-100 rounded-lg p-2 md:col-span-2"
                            />
                            <input
                              type="url"
                              placeholder="Image URL"
                              value={nft.image}
                              onChange={(e) => handleBatchMintNFTChange(idx, 'image', e.target.value)}
                              className="bg-gray-800 text-gray-100 rounded-lg p-2"
                            />
                            <input
                              type="number"
                              min="0"
                              max="50"
                              placeholder="Royalty %"
                              value={nft.royaltyPercentage}
                              onChange={(e) => handleBatchMintNFTChange(idx, 'royaltyPercentage', parseInt(e.target.value) || 0)}
                              className="bg-gray-800 text-gray-100 rounded-lg p-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                {batchMintNFTs.length > 0 && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchMintAutoPublish}
                        onChange={(e) => setBatchMintAutoPublish(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-white/70 text-sm">Auto-publish NFTs after minting</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchMintEnableStraightBuy}
                        onChange={(e) => setBatchMintEnableStraightBuy(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-white/70 text-sm">Enable straight buy and mint</span>
                    </label>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleBatchMintSubmit}
                  disabled={batchMintLoading || batchMintNFTs.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                >
                  {batchMintLoading ? 'Creating Batch...' : `Create Batch (${batchMintNFTs.length} NFTs)`}
                </button>
              </div>
            </div>
          )}

          {/* COLLECTION TAB */}
          {activeTab === 'collection' && (
            <div className="bg-gray-950 rounded-lg border border-gray-800 p-6 space-y-6">
              <h2 className="text-2xl font-bold">Create Collection</h2>

              <form onSubmit={handleCreateCollection} className="space-y-6">
                <div>
                  <label className="text-white/70 font-semibold text-sm mb-2 block">Collection Image</label>
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setCollectionDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setCollectionDragActive(false);
                    }}
                    onDrop={handleCollectionDrop}
                    htmlFor="collectionImageUpload"
                    className={`w-full h-[200px] rounded-xl outline-dashed flex flex-col items-center justify-center p-3 gap-3 transition-colors cursor-pointer ${
                      collectionDragActive
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
                    onChange={handleCollectionFilesChange}
                    className="hidden"
                  />
                  {collectionForm.imageURL && (
                    <div className="mt-4">
                      <img src={collectionForm.imageURL} alt="Collection" className="w-32 h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-white/70 font-semibold text-sm mb-2 block">Collection Name *</label>
                  <input
                    className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                    type="text"
                    placeholder="Collection name"
                    value={collectionForm.name}
                    onChange={(e) => setCollectionForm({...collectionForm, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="text-white/70 font-semibold text-sm mb-2 block">Description *</label>
                  <textarea
                    rows={4}
                    className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
                    placeholder="Describe your collection"
                    value={collectionForm.description}
                    onChange={(e) => setCollectionForm({...collectionForm, description: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white/70 font-semibold text-sm mb-2 block">Category *</label>
                    <select
                      className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
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

                  <div>
                    <label className="text-white/70 font-semibold text-sm mb-2 block">Network *</label>
                    <select
                      className="bg-gray-900 text-gray-100 rounded-lg p-2.5 w-full"
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

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold text-lg transition-colors"
                >
                  Create Collection
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
