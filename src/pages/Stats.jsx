import { useState, useEffect } from "react";

const Stats = () => {
  const [selectedTab, setSelectedTab] = useState("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API call to fetch collection statistics
        // For now, we'll show empty state until real API is implemented
        setCollections([]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading stats:', error);
        setCollections([]);
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedTab, selectedTimeframe]);

  const tabs = ["All", "Trending", "Top", "Watchlist"];
  const timeframes = ["1h", "6h", "24h", "7d", "1m", "6m", "1y"];
  return (
    <div className="min-h-screen bg-[#0C0B0E] text-white">
      <div className=" p-8">
        <h1 className="text-5xl font-bold mb-8">Stats</h1>

        <div className="flex gap-4 mb-8">
          <button className="bg-zinc-900 px-4 py-2 rounded-lg flex items-center gap-2">
            All Categories
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <button className="bg-zinc-900 px-4 py-2 rounded-lg flex items-center gap-2">
            All Chains
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div className="flex justify-between mb-6">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-3 py-2 ${
                  selectedTab === tab ? "text-white" : "text-gray-500"
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-4 bg-[#19171C] rounded">
            {timeframes.map((time) => (
              <button
                key={time}
                className={`px-3 py-1 rounded ${
                  selectedTimeframe === time
                    ? "bg-[#312E38] text-white"
                    : "text-gray-500"
                }`}
                onClick={() => setSelectedTimeframe(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-8 text-sm text-gray-400 pb-4">
            <div className="col-span-2"># Collection</div>
            <div>Volume ↓</div>
            <div>Volume change</div>
            <div>Top Offer</div>
            <div>Floor price</div>
            <div>Floor change</div>
            <div>Sales</div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading collection statistics...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Collection Data Available</h3>
              <p className="text-gray-400 mb-4">Collection statistics will appear here once NFTs are minted and traded</p>
              <p className="text-sm text-gray-500">Real-time data will be fetched from the blockchain and database</p>
            </div>
          ) : (
            collections.map((collection, index) => (
              <div
                key={index}
                className="grid grid-cols-8 py-4 border-t border-zinc-800 items-center"
              >
                <div className="col-span-2 flex items-center gap-3">
                  <span className="text-gray-400">{collection.id}</span>
                  <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
                  <span>{collection.name}</span>
                </div>
                <div>{collection.volume}</div>
                <div className="text-green-500">{collection.volumeChange}</div>
                <div>{collection.topOffer}</div>
                <div>{collection.floorPrice}</div>
                <div className="text-green-500">{collection.floorChange}</div>
                <div>{collection.sales}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;

// import { useState, useEffect } from "react";
// import LOGO from "../assets/LOGO.png";
// // import metamask from "../assets/metamask.png";
// import { HiMenu, HiX } from "react-icons/hi";
// // import { Link } from "react-router-dom";

// const Stats = () => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [selectedTab, setSelectedTab] = useState("All");
//   const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
//   const [collections, setCollections] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const tabs = ["All", "Trending", "Top", "Watchlist"];
//   const timeframes = ["1h", "6h", "24h", "7d", "1m", "6m", "1y"];

//   useEffect(() => {
//     const fetchCollections = async () => {
//       setIsLoading(true);
//       try {
//         // Replace with your API endpoint
//         const response = await fetch(
//           `https://api.example.com/collections?tab=${selectedTab}&timeframe=${selectedTimeframe}`
//         );
//         const data = await response.json();
//         setCollections(data); // Assume the API returns an array of collections
//       } catch (error) {
//         console.error("Error fetching collections:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchCollections();
//   }, [selectedTab, selectedTimeframe]);

//   return (
//     <div className="min-h-screen bg-[#0C0B0E] text-white">
//       <header className="px-6 py-4">
//         {/* Header Code */}
//         <div className="flex items-center justify-between">
//           <div className="flex gap-2 md:hidden bloc">
//             <img src={LOGO} alt="" />
//             <h1 className="text-2xl font-bold">DURCHEX</h1>
//           </div>
//           <button
//             className="lg:hidden text-white"
//             onClick={() => setIsMenuOpen(!isMenuOpen)}
//           >
//             {isMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
//           </button>
//         </div>
//       </header>

//       <div className="p-8">
//         <h1 className="text-5xl font-bold mb-8">Stats</h1>

//         {/* Filters */}
//         <div className="flex justify-between mb-6">
//           <div className="flex gap-6">
//             {tabs.map((tab) => (
//               <button
//                 key={tab}
//                 className={`px-3 py-2 ${
//                   selectedTab === tab ? "text-white" : "text-gray-500"
//                 }`}
//                 onClick={() => setSelectedTab(tab)}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>

//           <div className="flex gap-4">
//             {timeframes.map((time) => (
//               <button
//                 key={time}
//                 className={`px-3 py-1 rounded-lg ${
//                   selectedTimeframe === time
//                     ? "bg-zinc-800 text-white"
//                     : "text-gray-500"
//                 }`}
//                 onClick={() => setSelectedTimeframe(time)}
//               >
//                 {time}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Collections Table */}
//         <div className="w-full">
//           <div className="grid grid-cols-8 text-sm text-gray-400 pb-4">
//             <div className="col-span-2"># Collection</div>
//             <div>Volume ↓</div>
//             <div>Volume change</div>
//             <div>Top Offer</div>
//             <div>Floor price</div>
//             <div>Floor change</div>
//             <div>Sales</div>
//           </div>

//           {isLoading ? (
//             <p>Loading...</p>
//           ) : (
//             collections.map((collection, index) => (
//               <div
//                 key={index}
//                 className="grid grid-cols-8 py-4 border-t border-zinc-800 items-center"
//               >
//                 <div className="col-span-2 flex items-center gap-3">
//                   <span className="text-gray-400">{index + 1}</span>
//                   <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
//                   <span>{collection.name}</span>
//                 </div>
//                 <div>{collection.volume}</div>
//                 <div className="text-green-500">{collection.volumeChange}</div>
//                 <div>{collection.topOffer}</div>
//                 <div>{collection.floorPrice}</div>
//                 <div className="text-green-500">{collection.floorChange}</div>
//                 <div>{collection.sales}</div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Stats;
