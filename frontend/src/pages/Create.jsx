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

export default function Create() {
  const contexts = useContext(ICOContent);
  const navigate = useNavigate();
  const { address, selectedChain } = contexts;

  // Network options for NFT creation
  const networkOptions = [
    { value: "polygon", label: "Polygon", symbol: "POL" },
    { value: "ethereum", label: "Ethereum", symbol: "ETH" },
    { value: "arbitrum", label: "Arbitrum", symbol: "ETH" },
    { value: "bsc", label: "BSC", symbol: "BNB" },
    { value: "base", label: "Base", symbol: "ETH" },
    { value: "zksync", label: "zkSync", symbol: "ETH" },
  ];

  const [files, setFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [fileTypes, setFileTypes] = useState([]); // Track file types for each upload
  const [dragActive, setDragActive] = useState(false);
  const [formNftData, setFormNftData] = useState({
    price: "",
    name: "",
    creator: "",
    description: "",
    properties: "",
    category: "",
    network: selectedChain || "polygon", // Use current network or default to polygon
    mediaType: "image", // Track if NFT is image or video
  });

  // Supported media types for NFT creation
  const SUPPORTED_IMAGE_TYPES = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff'];
  const SUPPORTED_VIDEO_TYPES = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

  const isVideoFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return SUPPORTED_VIDEO_TYPES.includes(ext);
  };

  const isImageFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return SUPPORTED_IMAGE_TYPES.includes(ext);
  };

  // Update network in form when selectedChain changes
  useEffect(() => {
    if (selectedChain) {
      setFormNftData(prev => ({
        ...prev,
        network: selectedChain
      }));
    }
  }, [selectedChain]);

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    uploadToIPFS(selectedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const selectedFiles = Array.from(e.dataTransfer.files);
    setFiles(selectedFiles);
    uploadToIPFS(selectedFiles);
  };

  const uploadToIPFS = async (files) => {
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: PINATA_JWT
              ? {
                  Authorization: `Bearer ${PINATA_JWT}`,
                  "Content-Type": "multipart/form-data",
                }
              : {
                  pinata_api_key: PINATA_API_KEY,
                  pinata_secret_api_key: PINATA_SECRET_KEY,
                  "Content-Type": "multipart/form-data",
                },
          });
          return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
        })
      );
      setImageURLs(urls);
      SuccessToast("Images uploaded successfully!");
    } catch (error) {
      console.error("Error uploading files to IPFS", error);
      ErrorToast("Failed to upload images to IPFS");
    }
  };

  const handleCreateNFTs = async (event) => {
    event.preventDefault();
    if (imageURLs.length === 0) {
      return ErrorToast("Upload NFT images!");
    }
    if (!address) {
      return ErrorToast("Please connect your wallet first!");
    }

    try {
      const metadataArray = await Promise.all(
        imageURLs.map(async (mediaURL, index) => {
          const isVideo = isVideoFile(files[index]);
          const metadata = {
            ...formNftData,
            name: formNftData.name || `NFT #${index + 1}`,
            image: !isVideo ? mediaURL : undefined,
            animation_url: isVideo ? mediaURL : undefined,
            mediaType: isVideo ? "video" : "image",
            videoFormat: isVideo ? files[index].name.split('.').pop().toUpperCase() : undefined,
          };
          return uploadJSONToIPFS(metadata);
        })
      );

      // Create NFT records in database
      const timestamp = Date.now();

      for (let i = 0; i < imageURLs.length; i++) {
        const isVideo = isVideoFile(files[i]);
        const nftData = {
          itemId: `${timestamp}_${i}`,
          network: formNftData.network, // Use selected network instead of hardcoded 'polygon'
          nftContract: null, // Will be set after minting
          tokenId: null, // Will be set after minting
          owner: address,
          seller: address,
          price: formNftData.price || '0',
          currentlyListed: true, // ✅ Set to true so it appears on Explore
          name: formNftData.name || `NFT #${i + 1}`,
          description: formNftData.description,
          image: imageURLs[i],
          media: imageURLs[i], // For both image and video
          mediaType: isVideo ? "video" : "image",
          videoFormat: isVideo ? files[i].name.split('.').pop().toUpperCase() : undefined,
          category: formNftData.category,
          properties: formNftData.properties || {},
          isMinted: false,
          mintedAt: null,
          mintTxHash: null,
          metadataURI: metadataArray[i] // Store the IPFS metadata URI
        };

        try {
          await nftAPI.createNft(nftData);
          console.log(`Created NFT ${i + 1} in database:`, nftData);
        } catch (dbError) {
          console.error(`Failed to create NFT ${i + 1}:`, dbError);
          ErrorToast(`Failed to create NFT ${i + 1}. Please try again.`);
          return;
        }
      }

      SuccessToast("NFTs created successfully! You can now mint them from your profile.");
      setTimeout(() => navigate("/profile"), 3000);
    } catch (error) {
      console.error(error);
      ErrorToast("An error occurred while creating NFTs");
    }
  };

  const uploadJSONToIPFS = async (metadata) => {
    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: PINATA_JWT
          ? {
              Authorization: `Bearer ${PINATA_JWT}`,
              "Content-Type": "application/json",
            }
          : {
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key: PINATA_SECRET_KEY,
              "Content-Type": "application/json",
            },
      });
      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading JSON to IPFS", error);
      ErrorToast("Failed to upload metadata to IPFS");
    }
  };

  const handleInputChange = (e) => {
    setFormNftData({
      ...formNftData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePropertiesChange = (e) => {
    const arrayOfProperties = e.target.value.split(" ");
    const FilterArray = arrayOfProperties.filter((item) => item !== "");
    setFormNftData({ ...formNftData, properties: FilterArray });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-white">
      <Header />
      <Toaster position="left" />
      <div className="p-4 sm:p-5">
        <h1 className="text-center text-xl font-semibold mb-6">Create NFT Collection</h1>
        <p className="text-center text-gray-400 mb-8">
          Create your NFTs first, then mint them later from your profile page
        </p>

        <form onSubmit={handleCreateNFTs} className="flex flex-col gap-6 px-2 max-w-2xl mx-auto">
          {/* Image Upload Section */}
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
                <b className="text-white/80 text-sm sm:text-base">
                  Upload NFT Media
                </b>
                <span className="text-white/70 text-sm sm:text-base text-center">
                  Drag or choose your files to upload
                </span>
                <p className="text-white/50 text-sm sm:text-base w-full text-center">
                  Images: PNG, GIF, JPEG, SVG | Videos: MP4, WebM, MOV, AVI, MKV. Max 50MB each.
                </p>
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

            {/* Media Preview Grid */}
            {imageURLs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {imageURLs.map((url, index) => (
                  <div key={index} className="relative">
                    {isVideoFile(files[index]) ? (
                      <video
                        src={url}
                        className="w-full h-24 object-cover rounded-lg bg-black"
                        controls={false}
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`NFT ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                    <span className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      {isVideoFile(files[index]) && <span>🎥</span>}
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <label className="text-white/70 font-semibold text-sm sm:text-base">
                Collection Name *
              </label>
              <input
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                type="text"
                placeholder="Enter collection name"
                name="name"
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-white/70 font-semibold text-sm sm:text-base">
                Creator *
              </label>
              <input
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                type="text"
                placeholder="Name of NFT creator"
                name="creator"
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-white/70 font-semibold text-sm sm:text-base">
              Description *
            </label>
            <textarea
              rows={4}
              className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
              required
              name="description"
              onChange={handleInputChange}
              placeholder="Describe your NFT collection"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <label className="text-white/70 font-semibold text-sm sm:text-base">
                Price (Optional)
              </label>
              <input
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                type="number"
                placeholder={`Price in ${networkOptions.find(n => n.value === formNftData.network)?.symbol || 'POL'}`}
                name="price"
                step="0.0001"
                min="0"
                onChange={handleInputChange}
              />
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-white/70 font-semibold text-sm sm:text-base">
                Network *
              </label>
              <select
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                name="network"
                value={formNftData.network}
                onChange={handleInputChange}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <label className="text-white/70 font-semibold text-sm sm:text-base">
                Category *
              </label>
              <select
                className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
                name="category"
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                <option value="gaming">Gaming</option>
                <option value="sports">Sports</option>
                <option value="music">Music</option>
                <option value="art">Art</option>
                <option value="photography">Photography</option>
                <option value="utility">Utility</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-white/70 font-semibold text-sm sm:text-base">
              Properties (Optional)
            </label>
            <input
              className="bg-gray-950 text-gray-100 rounded-lg p-2.5 w-full"
              type="text"
              placeholder="Properties ex. red, blue, sky"
              onChange={handlePropertiesChange}
            />
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Create NFT Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}