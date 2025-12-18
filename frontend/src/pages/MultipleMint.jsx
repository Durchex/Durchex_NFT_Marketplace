import { useContext, useState } from "react";
import axios from "axios";
import { ICOContent } from "../Context";
import { Toaster } from "react-hot-toast";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import Header from "../components/Header";
import { useNavigate, Link } from "react-router-dom";
import { nftAPI } from "../services/api";
import { adminAPI } from "../services/adminAPI";

export default function MultipleMint() {
  const contexts = useContext(ICOContent);
  const navigate = useNavigate();
  const { isAuthorizedVendor, address, vendorMint, publicMint } = contexts;

  const [files, setFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [formNftData, setFormNftData] = useState({
    price: "",
    name: "",
    creator: "",
    description: "",
    properties: "",
    category: "",
  });

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
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
            headers: {
              pinata_api_key: import.meta.env.VITE_APP_PINATA_API_KEY,
              pinata_secret_api_key: import.meta.env.VITE_APP_PINATA_SECRET_KEY,
              "Content-Type": "multipart/form-data",
            },
          });
          return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
        })
      );
      setImageURLs(urls);
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
    try {
      const metadataArray = await Promise.all(
        imageURLs.map(async (imageURL) => {
          const metadata = {
            ...formNftData,
            image: imageURL,
          };
          return uploadJSONToIPFS(metadata);
        })
      );

      // Create NFT records in database
      const timestamp = Date.now();
      
      for (let i = 0; i < imageURLs.length; i++) {
        const nftData = {
          itemId: `${timestamp}_${i}`,
          network: 'polygon', // Assuming polygon, adjust as needed
          nftContract: import.meta.env.VITE_APP_VENDOR_NFT_CONTRACT_ADDRESS,
          tokenId: null, // Will be set after minting
          owner: address,
          seller: address,
          price: formNftData.price || '0',
          currentlyListed: false,
          name: formNftData.name,
          description: formNftData.description,
          image: imageURLs[i],
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
      setTimeout(() => navigate("/my-minted-nfts"), 3000);
    } catch (error) {
      console.error(error);
      ErrorToast("An error occurred while creating NFTs");
    }
  };

  const uploadJSONToIPFS = async (metadata) => {
    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          pinata_api_key: import.meta.env.VITE_APP_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_APP_PINATA_SECRET_KEY,
          "Content-Type": "application/json",
        },
      });
      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading JSON to IPFS", error);
      ErrorToast("Failed to upload metadata to IPFS");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-white">
      <Header />
      <Toaster position="left" />
      <div className="p-4 sm:p-5">
        <h1 className="text-center text-xl font-semibold">Create NFT Collection</h1>
      
        <form onSubmit={handleCreateNFTs} className="flex flex-col gap-6 px-2">
          <input type="file" multiple accept="image/*" onChange={handleFilesChange} />
          <input type="text" name="name" placeholder="NFT Name" onChange={(e) => setFormNftData({ ...formNftData, name: e.target.value })} required />
          <textarea name="description" placeholder="Description" onChange={(e) => setFormNftData({ ...formNftData, description: e.target.value })} required />
          <input type="text" name="creator" placeholder="Creator" onChange={(e) => setFormNftData({ ...formNftData, creator: e.target.value })} required />
          <input type="number" name="price" placeholder="Price" onChange={(e) => setFormNftData({ ...formNftData, price: e.target.value })} required />
          <button type="submit" className="bg-blue-600 p-2 rounded-lg">Create Collection</button>
        </form>
      </div>
    </div>
  );
}
