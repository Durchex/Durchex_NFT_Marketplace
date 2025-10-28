const Loading = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity- flex items-center justify-center z-10">
      <div className="text-center">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#8149F4] border-solid mx-auto mb-4"></div>

        {/* Loading Text */}
        <h2 className="text-white text-xl font-semibold mb-2">
          Loading Marketplace
        </h2>
        <p className="text-gray-300 text-sm">
          Fetching the latest collections...
        </p>

        {/* Progress Bar */}
        <div className="mt-6 w-64 bg-gray-700 rounded-full h-2 mx-auto">
          <div className="animate-pulse bg-[#8149F4] h-2 rounded-full w-1/3"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
