import { HiMenu, HiX } from "react-icons/hi";
import { useContext, useEffect, useState } from "react";
// import { Link } from "react-router-dom";
import RealTimeData from "../components/RealTimeData";
import NFTCard from "../components/NFTCard";
import LOGO from "../assets/LOGO.png";
import metamask from "../assets/metamask.png";  
import { ICOContent } from "../Context/index";

function MyNfts() {
  const contexts = useContext(ICOContent);
  const {
    getNFTById_,
    shortenAddress,
    accountBalance,
    tokenURI,
    fetchMetadataFromPinata,
    getNFTById,
    getMyNFTs,
    setAccountBalance,
    address,
    connectWallet,
  } = contexts;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [MyNFTs, setMyNFTs] = useState([]);
  const nftData = Array(8).fill({
    collectionName: "Happy cow collection",
    nftName: "Happy cow dance #1242",
  });


  useEffect(() => {
    const fetching = async (functions) => {
        try {
          const response = await functions();
          console.log("🚀 ~ .then ~ response:", response);
      
          // Create an empty array to store formatted items
          const formattedListings = [];
      
          // Iterate over each item in the response
          for (const item of response) {
            const formattedItem = {
              itemId: item.itemId.toString(),
              nftContract: item.nftContract,
              tokenId: item.tokenId.toString(),
              owner: item.owner,
              seller: item.seller,
              price: item.price.toString(),
              currentlyListed: item.currentlyListed,
            };
      
            // Fetch the tokenURI and metadata using the tokenId
            // const tokenURI = await nftContract.methods.tokenURI(formattedItem.tokenId).call();
            const url = await tokenURI(formattedItem.tokenId)
            
            // Fetch metadata from the tokenURI
            const parsedFile = await fetchMetadataFromPinata(url);
            const metadata = JSON.parse(parsedFile.file);
            
      
            // Add each field of metadata to the formatted item
            formattedItem.name = metadata.name;
            formattedItem.description = metadata.description;
            formattedItem.image = metadata.image; // assuming the metadata has an `image` field
            formattedItem.category = metadata.catogory; // add other fields as needed
            formattedItem.properties = metadata.properties; // add other fields as needed
            formattedItem.royalties = metadata.royalties; // add other fields as needed
            // formattedItem.creator = metadata.creator; // add other fields as needed
      
            // Push the formatted item into the array
            formattedListings.push(formattedItem);
          }
      
          // Now set the state with the entire array of listings
           setMyNFTs(formattedListings) 
        } catch (error) {
          console.error("Error fetching active listings or metadata:", error);
        }
      }
                
    fetching(getMyNFTs);
  }, []);



 

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto mt-8 px-4">
        <h2 className="text-3xl font-bold mb-6">My NFTs collections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {MyNFTs?.map((nft, index) => (
            <NFTCard key={index} {...nft} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default MyNfts;



// import React from 'react'
// import { FaWallet } from "react-icons/fa";
// import RealTimeData from "../components/RealTimeData";
// import NFTCard from "../components/NFTCard";

// function App() {
//   const nftData = Array(8).fill({
//     collectionName: "Happy cow collection",
//     nftName: "Happy cow dance #1242",
//   });

//   return (
//     <div className="min-h-screen bg-black text-white">
//       <header className="flex items-center justify-between px-6 py-4">
//         <div className="flex items-center space-x-4">
//           <h1 className="text-2xl font-bold">DURCHEX</h1>
//           <div className="relative">
//             <input
//               type="text"
//               placeholder="Search for collections, NFTs or Artists"
//               className="w-96 bg-gray-800 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
//             />
//             <svg
//               className="w-4 h-4 absolute right-3 top-2.5 text-gray-400"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//               ></path>
//             </svg>
//           </div>
//         </div>
//         <nav className="flex items-center space-x-6">
//           <a href="#" className="hover:text-purple-500 transition-colors">
//             Explore
//           </a>
//           <a href="#" className="hover:text-purple-500 transition-colors">
//             Create
//           </a>
//           <a href="#" className="hover:text-purple-500 transition-colors">
//             Stats
//           </a>
//           <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full flex items-center">
//             <FaWallet className="mr-2" />
//             Connect Wallet
//           </button>
//         </nav>
//       </header>
//       <main className="mx-auto mt-8 px-4">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           {[1, 2, 3, 4, 5].map((item) => (
//             <div
//               key={item}
//               className="bg-gray-800 rounded-lg aspect-square flex items-end p-4"
//             >
//               <span className="text-lg font-semibold">Art</span>
//             </div>
//           ))}
//         </div>
//       </main>

//       <RealTimeData />

//       <h2 className="text-3xl font-bold mb-6">Trending collections</h2>
//       <div className=" fle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//         {nftData.slice(0, 7).map((nft, index) => (
//           <NFTCard key={index} {...nft} />
//         ))}
//       </div>

//       <h2 className="text-3xl font-bold mb-6">Minting now</h2>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb12">
//         {nftData.slice(0, 7).map((nft, index) => (
//           <NFTCard key={index} {...nft} />
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;