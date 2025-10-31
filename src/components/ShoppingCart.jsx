import React from 'react';
import { useCart } from '../Context/CartContext';
import { ICOContent } from '../Context';
import { useContext } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const ShoppingCart = () => {
  const { cartItems, cartTotal, removeFromCart, clearCart, isLoading } = useCart();
  const { address, buyNFT } = useContext(ICOContent);

  const handleRemoveItem = async (nftId, contractAddress) => {
    await removeFromCart(address, nftId, contractAddress);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart(address);
    }
  };

  const handleBuyAll = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      // Process each item in the cart
      for (const item of cartItems) {
        try {
          // Get the NFT's listing network from cart item
          const nftNetwork = item.network || item.metadata?.network;
          
          if (!nftNetwork) {
            toast.error(`${item.name} is missing network information`);
            continue;
          }

          // Purchase NFT on its listing network
          await buyNFT(item.contractAddress || item.nftContract, item.nftId, item.price, nftNetwork);
          toast.success(`Successfully purchased ${item.name}!`);
        } catch (error) {
          console.error(`Failed to buy ${item.name}:`, error);
          toast.error(`Failed to buy ${item.name}: ${error.message || 'Unknown error'}`);
        }
      }

      // Clear cart after successful purchases
      await clearCart(address);
      toast.success('All items purchased successfully!');
    } catch (error) {
      console.error('Error during bulk purchase:', error);
      toast.error('Some items failed to purchase');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 text-white">Shopping Cart</h1>
          <p className="font-body text-gray-400 text-lg">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">
              Start exploring NFTs and add them to your cart to purchase them together.
            </p>
            <a
              href="/"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors inline-block"
            >
              Browse NFTs
            </a>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div key={`${item.nftId}-${item.contractAddress}`} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center space-x-4">
                    {/* NFT Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image || '/placeholder-nft.png'}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-nft.png';
                        }}
                      />
                    </div>

                    {/* NFT Details */}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Token ID: {item.tokenId}
                      </p>
                      <p className="text-blue-400 font-mono text-sm">
                        Contract: {item.contractAddress?.slice(0, 6)}...{item.contractAddress?.slice(-4)}
                      </p>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xl font-bold text-green-400 mb-2">
                        {ethers.utils.formatEther(item.price)} ETH
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.nftId, item.contractAddress)}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 sticky top-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Items ({cartItems.length})</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{cartTotal.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gas Fees</span>
                    <span>~0.001 ETH</span>
                  </div>
                  <hr className="border-gray-600" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-green-400">{(cartTotal + 0.001).toFixed(4)} ETH</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleBuyAll}
                    disabled={!address}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors font-semibold"
                  >
                    {!address ? 'Connect Wallet' : 'Buy All Items'}
                  </button>
                  
                  <button
                    onClick={handleClearCart}
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition-colors font-semibold"
                  >
                    Clear Cart
                  </button>
                </div>

                {!address && (
                  <p className="text-yellow-400 text-sm mt-3 text-center">
                    Please connect your wallet to purchase items
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
