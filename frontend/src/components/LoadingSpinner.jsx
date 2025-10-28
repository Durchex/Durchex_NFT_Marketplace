import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="w-4 h-4 border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
