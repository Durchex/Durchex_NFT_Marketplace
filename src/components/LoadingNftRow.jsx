const LoadingNFTRow = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {Array(4).fill(0).map((_, index) => (
          <div
            key={index}
            className="bg-black rounded-lg flex items-end relative animate-pulse overflow-hidden border border-gray-800"
            style={{ height: "300px" }} // Matches actual NFT card size
          >
            {/* Placeholder for NFT Name */}
            <div className="absolute left-5 bottom-2 w-32 h-5 bg-gray-900 rounded-md"></div>
  
            {/* Placeholder for NFT Image */}
            <div className="w-full h-full bg-gray-950"></div>
          </div>
        ))}
      </div>
    );
  };
  
  export default LoadingNFTRow;
  