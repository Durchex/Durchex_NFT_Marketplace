// import { useContext, useState } from "react";
// import axios from "axios";
// import { ICOContent } from "../Context";
// import { Toaster } from "react-hot-toast";
// import { SuccessToast, ErrorToast } from "../app/Toast";
// import Header from "../components/Header";
// import { useNavigate, Link } from "react-router-dom";

// export default function Create() {
//   const contexts = useContext(ICOContent);
//   const navigate = useNavigate();
//   const { isAuthorizedVendor, address, vendorMint, publicMint } = contexts;

//   const [files, setFiles] = useState([]);
//   const [imageURLs, setImageURLs] = useState([]);
//   const [formNftData, setFormNftData] = useState({
//     price: "",
//     name: "",
//     creator: "",
//     description: "",
//     properties: "",
//     category: "",
//   });

//   const handleFilesChange = (e) => {
//     const selectedFiles = Array.from(e.target.files);
//     setFiles(selectedFiles);
//     uploadToIPFS(selectedFiles);
//   };

//   const uploadToIPFS = async (files) => {
//     try {
//       const urls = await Promise.all(
//         files.map(async (file) => {
//           const formData = new FormData();
//           formData.append("file", file);
//           const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
//             headers: {
//               pinata_api_key: import.meta.env.VITE_APP_PINATA_API_KEY,
//               pinata_secret_api_key: import.meta.env.VITE_APP_PINATA_SECRET_KEY,
//               "Content-Type": "multipart/form-data",
//             },
//           });
//           return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
//         })
//       );
//       setImageURLs(urls);
//     } catch (error) {
//       console.error("Error uploading files to IPFS", error);
//       ErrorToast("Failed to upload images to IPFS");
//     }
//   };

//   const handleMintNFTs = async (event) => {
//     event.preventDefault();
//     if (imageURLs.length === 0) {
//       return ErrorToast("Upload NFT images!");
//     }
//     try {
//       const metadataArray = await Promise.all(
//         imageURLs.map(async (imageURL) => {
//           const metadata = {
//             ...formNftData,
//             image: imageURL,
//           };
//           return uploadJSONToIPFS(metadata);
//         })
//       );

//       const nftmarketplace = import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS;
//       const isVendor = await isAuthorizedVendor(address);

//       const mintFunction = isVendor ? vendorMint : publicMint;
//       await mintFunction(metadataArray, nftmarketplace).then((response) => {
//         if (response.status === 1) {
//           SuccessToast("NFTs Minted successfully!");
//           setTimeout(() => navigate("/"), 3000);
//         } else {
//           ErrorToast("Something went wrong, try again");
//         }
//       });
//     } catch (error) {
//       console.error(error);
//       ErrorToast("An error occurred while minting NFTs");
//     }
//   };

//   const uploadJSONToIPFS = async (metadata) => {
//     try {
//       const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
//         headers: {
//           pinata_api_key: import.meta.env.VITE_APP_PINATA_API_KEY,
//           pinata_secret_api_key: import.meta.env.VITE_APP_PINATA_SECRET_KEY,
//           "Content-Type": "application/json",
//         },
//       });
//       return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
//     } catch (error) {
//       console.error("Error uploading JSON to IPFS", error);
//       ErrorToast("Failed to upload metadata to IPFS");
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex flex-col bg-black text-white">
//       <Header />
//       <Toaster position="left" />
//       <div className="p-4 sm:p-5">
//         <h1 className="text-center text-xl font-semibold">Mint single NFT</h1>
      
//         <form onSubmit={handleMintNFTs} className="flex flex-col gap-6 px-2">
//           <input type="file" multiple accept="image/*" onChange={handleFilesChange} />
//           <input type="text" name="name" placeholder="NFT Name" onChange={(e) => setFormNftData({ ...formNftData, name: e.target.value })} required />
//           <textarea name="description" placeholder="Description" onChange={(e) => setFormNftData({ ...formNftData, description: e.target.value })} required />
//           <input type="text" name="creator" placeholder="Creator" onChange={(e) => setFormNftData({ ...formNftData, creator: e.target.value })} required />
//           <input type="number" name="price" placeholder="Price" onChange={(e) => setFormNftData({ ...formNftData, price: e.target.value })} required />
//           <button type="submit" className="bg-blue-600 p-2 rounded-lg">Mint Collection</button>
//         </form>
//       </div>
//     </div>
//   );
// }
