import { useState } from "react";
import PropTypes from "prop-types";
import {
  Heart,
  Share2,
  MoreHorizontal,
  Filter,
  Search,
  List,
  Grid,
} from "react-feather";
import ShareModal from "../components/ShareModal";
import FilterSidebar from "../components/FilterSidebar";
import { useFilter } from "../Context/FilterContext";
import Header from "../components/Header";

function App() {
  const [isLiked, setIsLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const { isFilterOpen, toggleFilter } = useFilter();

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const toggleShareModal = () => {
    setShowShareModal(!showShareModal);
  };

  return (
    <div className="min-h-screen bg-[#0e0e16] text-white">
      <Header />
      <div className="p-6 bg-gradient-to-b from-[#1D0E35] to-[#0e0e16]">
        <div className="items-center gap-4">
          <div className="w-16 h-14 bg-gray-700 rounded-md"></div>
          <div>
            <h1 className="text-2xl font-bold">Happy Cows</h1>
            <p className="text-sm text-gray-400">Joseph Okeyo</p>
            <div className="flex items-center mt-1">
              <div className="bg-purple-800 text-purple-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Polygon
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between">
          <div className="flex gap-20 mt-8 text-md">
            <div>
              <p className="text-gray-400">Total Volume</p>
              <p className="font-semibold">3,645 ETH</p>
            </div>
            <div>
              <p className="text-gray-400">Floor Price</p>
              <p className="font-semibold">0.12 ETH</p>
            </div>
            <div>
              <p className="text-gray-400">Items</p>
              <p className="font-semibold">6.2k</p>
            </div>
            <div>
              <p className="text-gray-400">Latest Supply</p>
              <p className="font-semibold">
                24/552 <span className="text-green-500">23%</span>
              </p>
            </div>
            <div>
              <p className="text-gray-400">Created</p>
              <p className="font-semibold">14.12.2024</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={toggleShareModal} className="p-2 rounded-full">
              <Share2 size={20} />
            </button>
            <button onClick={toggleLike} className="p-2 rounded-full">
              <Heart
                size={20}
                fill={isLiked ? "#ef4444" : "none"}
                stroke={isLiked ? "#ef4444" : "currentColor"}
              />
            </button>
            <button className="bg-[#F2ECFE] text-black px-4 rounded-lg font-medium">
              Place Bid for collection
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 text-md text-gray-300 leading-relaxed">
          <p>
            Step into a world where joy meets digital art! The Happy Cows NFT
            Collection is a vibrant series of hand-crafted NFTs featuring
            uniquely designed, cheerful cows brimming with personality. Each
            Happy Cow is a symbol of abundance, freedom, and positivity,
            inspired by the lush pastures and carefree life of real cows.
          </p>
          <p className="mt-4">
            More than just art, this collection celebrates sustainability,
            happiness, and community. Holders gain access to exclusive perks,
            events, and collaborations aimed at supporting eco-friendly
            initiatives and creative ventures in Web3. Join the herd and bring
            happiness to the blockchain.
          </p>
          <p className="mt-4 text-purple-400 cursor-pointer">Learn more.</p>

          <p className="mt-6">
            Tokenize your cards for free on{" "}
            <span className="text-purple-400">Happycows.org</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#312E38]">
        <div className="flex gap-8 px-6">
          <button className="py-4 border-b-2 border-purple-500 font-medium">
            Items
          </button>
          <button className="py-4 text-gray-400">Offers</button>
          <button className="py-4 text-gray-400">Activity</button>
        </div>
      </div>

      {/* Filters and Content Area */}
      <div className="flex">
        {/* Filter Sidebar with slide animation */}
        <div
          className={`fixed left-0 h-full transition-transform duration-300 transform z-20
            ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <FilterSidebar />
        </div>

        {/* Main Content Area with slide animation */}
        <div
          className={`flex-1 transition-all duration-300 
            ${isFilterOpen ? "ml-64" : "ml-0"}`}
        >
          {/* Filters Bar */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleFilter}
                className="flex items-center gap-2 text-sm hover:text-purple-500 transition-colors"
              >
                <Filter size={16} />
                Filters
              </button>
              <div className="flex items-center gap-2 text-sm bg-green-900 bg-opacity-30 text-green-500 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Live
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search for collections, NFTs or Artists"
                  className="w-full bg-transparent border border-[#312E38] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select className="text-sm bg-[#19171C] rounded-lg px-3 py-2 focus:outline-none">
                <option className="text-white">Price: Lowest to highest</option>
                <option className="text-white">Price: Highest to lowest</option>
              </select>

              <div className="flex items-center bg-[#19171C] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-700" : ""}`}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-700" : ""}`}
                >
                  <Grid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* NFT Grid */}
          <div
            className={`p-6 ${
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                : "space-y-4"
            }`}
          >
            {Array(12)
              .fill(0)
              .map((_, index) => (
                <NFTCard key={index} viewMode={viewMode} />
              ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && <ShareModal onClose={toggleShareModal} />}
    </div>
  );
}

function NFTCard({ viewMode }) {
  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden ${
        viewMode === "list" ? "flex items-center" : ""
      }`}
    >
      <div
        className={`${
          viewMode === "list" ? "w-24 h-24" : "aspect-square"
        } bg-gray-700`}
      >
        {/* NFT Image would go here */}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm truncate">Happy cow dance...</h3>
          <button className="text-gray-400">
            <MoreHorizontal size={16} />
          </button>
        </div>
        <p className="text-sm font-medium mt-1">12 ETH</p>
      </div>
    </div>
  );
}

NFTCard.propTypes = {
  viewMode: PropTypes.oneOf(["grid", "list"]).isRequired,
};

export default App;

// import { Link, useNavigate, useParams } from "react-router-dom";
// import { useContext, useEffect, useState } from "react";
// import { Search, User } from "lucide-react";
// import nft from "../assets/nft.png";
// import nftrainbowfur from "../assets/nftrainbowfur.png";
// import nftbeaniemonkey from "../assets/nftbeaniemonkey.png";
// import nftgoldenmonkey from "../assets/nftgoldenmonkey.png";
// import { ICOContent } from "../Context";

// function NftInfo() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [searchQuery, setSearchQuery] = useState("");

//   const contexts = useContext(ICOContent);
//   const {
//     getNFTById_,
//     buyNFT,
//     fetchMetadataFromPinata,
//   } = contexts;

//   const [NFTsItems, setNFTsItems] = useState([]);
//   const [nftDatas, setNftData] = useState(null);
//   const [metadata, setMetadata] = useState(null);
//   const [ComponentLoad, setComponentLoad] = useState(0);

//   const nftData = {
//     totalVolume: "2.41 ETH",
//     floorPrice: "2.41 ETH",
//     bestOffer: "2.41 ETH",
//     bestOfferPrice: "2.41 ETH",
//     minted: "5%",
//   };

//   useEffect(() => {
//     const fetching = async () => {
//       try {
//         const response = await getNFTById_(id.toString());
//         setNftData(response);
//         if (!response) {
//           navigate("/");
//           return null;
//         } else {
//           // Fetch metadata using tokeNURI from the NFT data
//           if (response && response.tokeNURI) {
//             const parsedFile = await fetchMetadataFromPinata(response.tokeNURI);
//             const metadata = JSON.parse(parsedFile.file);
//             console.log("🚀 ~ fetching ~ metadata:", metadata);
//             // const metadataData = await metadataResponse.json();
//             setMetadata(metadata);
//           }
//         }
//         setNFTsItems(response);
//       } catch (error) {
//         console.log(error);
//       }
//     };
//     fetching();
//   }, [id, ComponentLoad]);

//   return (
//     <div className="min-h-screen bg-[#18161D] text-white">
//       {/* Navigation Bar */}
//       <nav className="flex items-center justify-between px-20 py-4">
//         <Link to="/">
//           <div className="text-xl font-bold">DURCHEX LOGO</div>
//         </Link>

//         <div className="flex-1 max-w-2xl mx-6">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search for collections, NFTs or Artists"
//               className="w-full bg-transparent border text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </div>

//         <div className="flex items-center gap-6">
//           <button className="text-gray-300 hover:text-white">Explore</button>
//           <button className="text-gray-300 hover:text-white">Create</button>
//           <button className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-green-500">
//             <User className="w-5 h-5 mx-auto" />
//           </button>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="containe mx-auto px6 py-8">
//         {" "}
//         {/* Release 1 */}
//         {/* Featured NFT */}
//         <div className="relative mb-8">
//           <div className="absolute inset-0 bg-gradient-to-t from-[#19171C] to-transparent z-10"></div>
//           <img
//             src={metadata?.image ?? nft}
//             alt="Featured Dancing Monkey"
//             className="w-full h-[400px] mt-5 object-cover roundedxl"
//           />{" "}
//           {/* Release 3 */}
//         </div>
//         <div className="space-y-6 containe px-20">
//           {" "}
//           {/* Release 2 */}
//           <div className="flex items-center gap-4">
//             <span className="px-3 py-1 text-sm bg-[#2A382C] rounded-full text-[#09FF82]">
//               Bidding
//             </span>
//           </div>
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold">{metadata?.category}</h1>
//               <p className="text-gray-400">{metadata?.name}</p>
//             </div>

//             {/* Stats Grid */}
//             <div className="grid grid-cols-5 gap-8 py-6">
//               <div className="space-y-2">
//                 <p className="text-gray-400 text-sm">Total Volume</p>
//                 <p className="text-xl font-bold">{nftData.totalVolume}</p>
//               </div>
//               <div className="space-y-2">
//                 <p className="text-gray-400 text-sm">Floor Price</p>
//                 <p className="text-xl font-bold">{nftData.floorPrice}</p>
//               </div>
//               <div className="space-y-2">
//                 <p className="text-gray-400 text-sm">Best Offer</p>
//                 <p className="text-xl font-bold">${nftDatas?.price} ETH</p>
//               </div>
//               <div className="space-y-2">
//                 <p className="text-gray-400 text-sm">Best Offer</p>
//                 <p className="text-xl font-bold">{nftData.bestOfferPrice}</p>
//               </div>
//               <div className="space-y-2">
//                 <p className="text-gray-400 text-sm">Minted</p>
//                 <p className="text-xl font-bold">{nftData.minted}</p>
//               </div>
//             </div>
//           </div>
//           {/* Description */}
//           <div className="space-y-4">
//             <p className="text-gray-300">{metadata?.description}</p>

//             <div className="space-y-2">
//               <p className="font-semibold">Key Features:</p>
//               <ul className="list-disc pl-5 space-y-2 text-gray-300">
//                 <li>
//                   High-Resolution Art: Meticulously crafted with stunning
//                   visuals and intricate details.
//                 </li>
//                 <li>
//                   Blockchain Security: Secured on the Ethereum blockchain,
//                   ensuring authenticity and ownership.
//                 </li>
//                 <li>
//                   Limited Edition: A limited supply of NFTs, making each piece
//                   truly exclusive.
//                 </li>
//                 <li>
//                   Community Benefits: Join a vibrant community of collectors and
//                   artists, unlocking exclusive perks and rewards.
//                 </li>
//               </ul>
//             </div>
//             {/* mynft1 */}
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftrainbowfur}
//                   alt="Colorful monkey NFT with rainbow fur"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftbeaniemonkey}
//                   alt="Monkey NFT wearing a beanie hat"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftgoldenmonkey}
//                   alt="Golden monkey NFT holding drink"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftgoldenmonkey}
//                   alt="Golden monkey NFT variation"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               {/* <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftgoldenmonkey}
//                   alt="Golden monkey NFT variation"
//                   className="w-full h-full object-cover"
//                 />
//               </div> */}
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftrainbowfur}
//                   alt="Golden monkey NFT variation"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftbeaniemonkey}
//                   alt="Monkey NFT wearing a beanie hat"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftbeaniemonkey}
//                   alt="Monkey NFT wearing a beanie hat"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>
//           </div>
//           {/* mynft */}
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftrainbowfur}
//                   alt="Colorful monkey NFT with rainbow fur"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftbeaniemonkey}
//                   alt="Monkey NFT wearing a beanie hat"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftgoldenmonkey}
//                   alt="Golden monkey NFT holding drink"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftgoldenmonkey}
//                   alt="Golden monkey NFT variation"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftgoldenmonkey}
//                   alt="Golden monkey NFT variation"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftrainbowfur}
//                   alt="Golden monkey NFT variation"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftbeaniemonkey}
//                   alt="Monkey NFT wearing a beanie hat"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="rounded-xl overflow-hidden">
//                 <img
//                   src={nftbeaniemonkey}
//                   alt="Monkey NFT wearing a beanie hat"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default NftInfo;
