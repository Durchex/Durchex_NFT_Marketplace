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

  const handleMintNFTs = async (event) => {
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

      const nftmarketplace = import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;
      const isVendor = await isAuthorizedVendor(address);

      // Create NFT records in database first
      const nftRecords = [];
      const timestamp = Date.now();
      
      for (let i = 0; i < imageURLs.length; i++) {
        const nftData = {
          itemId: `${timestamp}_${i}`, // Temporary itemId
          network: 'polygon', // Assuming polygon, adjust as needed
          nftContract: import.meta.env.VITE_APP_VENDOR_NFT_CONTRACT_ADDRESS,
          tokenId: `${timestamp}_${i}`, // Will be updated after minting
          owner: address,
          seller: address,
          price: formNftData.price || '0',
          currentlyListed: false,
          name: formNftData.name,
          description: formNftData.description,
          image: imageURLs[i],
          category: formNftData.category,
          properties: formNftData.properties || {},
          isMinted: false, // Will be updated after minting
          mintedAt: null,
          mintTxHash: null
        };

        try {
          const createdNft = await nftAPI.createNft(nftData);
          nftRecords.push({ ...nftData, _id: createdNft._id });
          console.log(`Created NFT record ${i + 1} in database:`, createdNft);
        } catch (dbError) {
          console.error(`Failed to create NFT record ${i + 1}:`, dbError);
          ErrorToast(`Failed to create NFT record ${i + 1}. Please try again.`);
          return;
        }
      }

      // Now mint the NFTs on blockchain with itemId and network
      const mintFunction = isVendor ? vendorMint : publicMint;
      
      try {
        const mintResult = await mintFunction(metadataArray, nftmarketplace, nftRecords[0].itemId, nftRecords[0].network);
        
        if (mintResult && mintResult.transactionHash) {
          // Update all NFT records with minting information
          for (let i = 0; i < nftRecords.length; i++) {
            try {
              // For now, using the same transaction hash for all NFTs
              // In a real implementation, you'd need to track individual tokenIds
              await adminAPI.updateNFTStatus(nftRecords[i].network, nftRecords[i].itemId, {
                isMinted: true,
                mintedAt: new Date(),
                mintTxHash: mintResult.transactionHash,
                tokenId: `${timestamp}_${i}` // This should be updated with actual tokenId from contract
              });
              console.log(`Updated NFT ${i + 1} status in database:`, nftRecords[i].itemId);
            } catch (updateError) {
              console.error(`Failed to update NFT ${i + 1} status:`, updateError);
            }
          }
          
          SuccessToast("NFTs Minted and saved successfully!");
          setTimeout(() => navigate("/"), 3000);
        } else {
          ErrorToast("Something went wrong with minting");
        }
      } catch (mintError) {
        console.error("Minting failed:", mintError);
        ErrorToast("Minting failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      ErrorToast("An error occurred while processing NFTs");
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
        <h1 className="text-center text-xl font-semibold">Mint single NFT</h1>
      
        <form onSubmit={handleMintNFTs} className="flex flex-col gap-6 px-2">
          <input type="file" multiple accept="image/*" onChange={handleFilesChange} />
          <input type="text" name="name" placeholder="NFT Name" onChange={(e) => setFormNftData({ ...formNftData, name: e.target.value })} required />
          <textarea name="description" placeholder="Description" onChange={(e) => setFormNftData({ ...formNftData, description: e.target.value })} required />
          <input type="text" name="creator" placeholder="Creator" onChange={(e) => setFormNftData({ ...formNftData, creator: e.target.value })} required />
          <input type="number" name="price" placeholder="Price" onChange={(e) => setFormNftData({ ...formNftData, price: e.target.value })} required />
          <button type="submit" className="bg-blue-600 p-2 rounded-lg">Mint Collection</button>
        </form>
      </div>
    </div>
  );
}
