const timeFilters = ["1h", "6h", "24h", "7d", "1m", "6m", "1y"];
const categories = ["All", "Trending", "Top", "Watchlist"];

const collections = Array(10).fill({
  name: "Laughing Cows",
  volume: "0.05 ETH",
  floorPrice: "297 ETH",
});

function RealTimeData() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
        Real-Time Data
      </h1>
      {/* Categories */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div className="flex flex-wrap gap-2 md:gap-6 mb-4 md:mb-0">
          {categories.map((category) => (
            <button
              key={category}
              className="text-sm md:text-base text-gray-400 hover:text-white transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Time filters */}
        <div className="flex flex-wrap gap-2 bg-[#19171C] rounded">
          {timeFilters.map((filter) => (
            <button
              key={filter}
              className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm rounded hover:bg-[#312E38] transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      {/* Table */}11
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-4 text-gray-400 text-xs md:text-sm mb-4">
            <div>#</div>
            <div>Collection</div>
            <div>Volume</div>
            <div>Floor Price</div>
          </div>

          <div className="space-y-4">
            {collections.map((collection, index) => (
              <div key={index} className="grid grid-cols-4 items-center">
                <div className="text-gray-400 text-sm">{index + 1}</div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-700 rounded-full"></div>
                  <span className="text-white text-sm md:text-base">
                    {collection.name}
                  </span>
                </div>
                <div className="text-white text-sm md:text-base">
                  {collection.volume}
                </div>
                <div className="text-white text-sm md:text-base">
                  {collection.floorPrice}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealTimeData;

// const timeFilters = ["1h", "6h", "24h", "7d", "1m", "6m", "1y"];
// const categories = ["All", "Trending", "Top", "Watchlist"];

// const collections = Array(10).fill({
//   name: "Laughing Cows",
//   volume: "0.05 ETH",
//   floorPrice: "297 ETH",
// });

// function RealTimeData() {
//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Real-Time Data</h1>

//       {/* Categories */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex gap-6">
//           {categories.map((category) => (
//             <button
//               key={category}
//               className="text-gray-400 hover:text-white transition-colors"
//             >
//               {category}
//             </button>
//           ))}
//         </div>

//         {/* Time filters */}
//         <div className="flex gap-2">
//           {timeFilters.map((filter) => (
//             <button
//               key={filter}
//               className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
//             >
//               {filter}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="w-full">
//         <div className="grid grid-cols-4 text-gray-400 text-sm mb-4">
//           <div>#</div>
//           <div>Collection</div>
//           <div>Volume</div>
//           <div>Floor Price</div>
//         </div>

//         <div className="space-y-4">
//           {collections.map((collection, index) => (
//             <div key={index} className="grid grid-cols-4 items-center">
//               <div className="text-gray-400">{index + 1}</div>
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
//                 <span className="text-white">{collection.name}</span>
//               </div>
//               <div className="text-white">{collection.volume}</div>
//               <div className="text-white">{collection.floorPrice}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default RealTimeData;
