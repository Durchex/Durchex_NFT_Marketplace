const LoadingNFTGrid = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, index) => (
          <div
            key={index}
            className="bg-gray-700 rounded-lg flex items-end relative animate-pulse overflow-hidden"
            style={{ height: "300px" }} // Ensures same height as the actual image cards
          >
            {/* Fake text bar */}
            <div className="absolute left-5 bottom-2 w-32 h-5 bg-gray-500 rounded-md"></div>
  
            {/* Fake image box */}
            <div className="w-full h-full bg-gray-600"></div>
          </div>
        ))}
      </div>
    );
  };
  
  export default LoadingNFTGrid;
  