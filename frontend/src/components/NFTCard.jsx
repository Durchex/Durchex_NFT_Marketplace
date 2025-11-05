import PropTypes from "prop-types";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { ICOContent } from "../Context";
import { useCart } from "../Context/CartContext";
import { ethers } from "ethers";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";

const NFTCard = ({ collectionName, currentlyListed,
  itemId,
  nftContract,
  image,
  metadata,
  owner,
  price,
  seller,
  tokenId, 
  name,
  network }) => {

     const contexts = useContext(ICOContent);
     const { addToCart, isInCart, removeFromCart } = useCart();
      const {
        getNFTById_,
        buyNFT,
        tokenURI,
        fetchMetadataFromPinata,
        getActiveListings,
        setAccountBalance,
        address,
      } = contexts;

      const prices =  ethers.utils.formatEther(price);

    // Check if NFT is in cart
    const inCart = isInCart(itemId, nftContract);

    // Handle add to cart
    const handleAddToCart = async () => {
      if (!address) {
        ErrorToast("Please connect your wallet first");
        return;
      }

      const nftData = {
        itemId,
        tokenId,
        nftContract,
        price,
        name,
        image,
        network: network || metadata?.network, // Include network property
        metadata: { collectionName, currentlyListed, owner, seller }
      };

      await addToCart(nftData, address);
    };

    // Handle remove from cart
    const handleRemoveFromCart = async () => {
      await removeFromCart(address, itemId, nftContract);
    };

    const handleBuy = async () => {
      if(!address) {
        ErrorToast("Please connect your wallet first");
        return;
      }

      if(!currentlyListed) {
        ErrorToast("This NFT is not listed for sale");
        return;
      }

      // Get the NFT's listing network (priority: explicit network > metadata.network > fallback)
      const nftListingNetwork = network || metadata?.network;
      
      if(!nftListingNetwork) {
        ErrorToast("Network information is missing for this NFT");
        return;
      }

      console.log("🚀 ~ handleBuy ~ nftListingNetwork:", nftListingNetwork);
      console.log("🚀 ~ handleBuy ~ itemId:", itemId);
      console.log("🚀 ~ handleBuy ~ price:", price);
    
      try {
        // Pass the NFT's network to ensure purchase happens on the correct network
        await buyNFT(nftContract || itemId, itemId, price, nftListingNetwork)
          .then((response) => {
            SuccessToast(
              <div>
                NFT Purchased successfully 🎉 ! <br />
                Transaction: {response.transactionHash?.slice(0, 10)}...
              </div>
            );
            // Refresh page or navigate after purchase
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          })
          .catch((error) => {
            console.error("Buy NFT error:", error);
            ErrorToast(<div>{error.message || "Failed to purchase NFT. Please try again 💔!"}</div>);
          });
      } catch (error) {
        console.error("Buy NFT error:", error);
        ErrorToast(<div>{error.message || "Something went wrong 💔!"}</div>);
      }
    };



  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden relative border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 group">
      {/* NFT Image */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          src={image} 
          alt={name}
          onError={(e) => {
            e.target.src = '/placeholder-nft.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentlyListed 
              ? 'bg-green-500/90 text-white' 
              : 'bg-gray-500/90 text-gray-200'
          }`}>
            {currentlyListed ? 'Listed' : 'Not Listed'}
          </span>
        </div>

        {/* Cart Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {inCart ? (
            <button
              onClick={handleRemoveFromCart}
              className="p-2 bg-red-500/90 hover:bg-red-600/90 text-white rounded-full transition-colors"
              title="Remove from cart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="p-2 bg-blue-500/90 hover:bg-blue-600/90 text-white rounded-full transition-colors"
              title="Add to cart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* NFT Details */}
      <div className="p-4">
        <Link to={`nft/${tokenId}`} className="block">
          <div className="mb-3">
            <h3 className="text-white font-display font-semibold text-lg mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
              {name}
            </h3>
            <p className="text-gray-400 text-sm font-body">{collectionName}</p>
          </div>
        </Link>

        {/* Price and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-green-400 font-display font-bold text-lg">{prices} ETH</p>
            <p className="text-gray-500 text-xs">Current Price</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button 
            onClick={handleBuy}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Buy Now
          </button>
          
          <Link to={`nft/${tokenId}`} className="block">
            <button className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50">
              View Details
            </button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="text-gray-400">Token ID:</span>
              <p className="font-mono">{tokenId}</p>
            </div>
            <div>
              <span className="text-gray-400">Item ID:</span>
              <p className="font-mono">{itemId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


NFTCard.propTypes = {
  // collectionName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

export default NFTCard;