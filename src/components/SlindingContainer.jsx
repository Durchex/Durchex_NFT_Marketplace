import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import icons
import NFTCard2 from "./NFTCard2";

const SlidingContainer = ({ TradingNFTs }) => {
  const containerRef = useRef(null);

  // Scroll to the left
  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -250, // Scroll by 250px to the left
        behavior: "smooth", // Optional: Adds smooth scrolling
      });
    }
  };

  // Scroll to the right
  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 250, // Scroll by 250px to the right
        behavior: "smooth", // Optional: Adds smooth scrolling
      });
    }
  };

  const allNfts = TradingNFTs.flatMap(collection => collection.nfts);

  return (
    <div className="relative">
      {/* Left Arrow Button */}
      <button
        onClick={scrollLeft}
        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 z-10"
      >
        <ChevronLeft size={32} />
      </button>

      <div
        ref={containerRef}
        className="sliding-container overflow-x-auto flex gap-4 px-5 py-5"
        style={{ scrollBehavior: "smooth" }} // Optional: Smooth scrolling style
      >
        {/* Items */}
        {TradingNFTs.map((nft, index) => (
          <div key={index} className="slide-item sm:w-[200px] md:w-[250px]">
            {/* NFTCard inside a container */}
            <div className="relative">
              <NFTCard2 {...nft.nft} />
            </div>
          </div>
        ))}
      </div>

      {/* Right Arrow Button */}
      <button
        onClick={scrollRight}
        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 z-10"
      >
        <ChevronRight size={32} />
      </button>
    </div>
  );
};

export default SlidingContainer;
