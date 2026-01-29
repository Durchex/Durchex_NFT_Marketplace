import React from 'react';
import { useCart } from '../Context/CartContext';
import { ICOContent } from '../Context';
import { priceInEthForBuy } from '../Context/constants';
import { useContext } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { calculateFees, formatPrice } from '../services/feeService';

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

    const lazyItems = cartItems.filter((item) => item.metadata?.isLazyMint);
    const buyableItems = cartItems.filter((item) => !item.metadata?.isLazyMint);
    if (lazyItems.length > 0) {
      toast(
        `${lazyItems.length} lazy-minted item(s) must be purchased from their NFT pages (Buy Now / Make Offer). Proceeding with ${buyableItems.length} marketplace item(s) only.`,
        { duration: 5000 }
      );
    }
    if (buyableItems.length === 0) {
      toast.error('No marketplace items to buy here. Remove lazy-minted items and buy them from their NFT pages.');
      return;
    }

    try {
      for (const item of buyableItems) {
        try {
          const nftNetwork = item.network || item.metadata?.network;
          if (!nftNetwork) {
            toast.error(`${item.name} is missing network information`);
            continue;
          }
          // buyNFT expects price in ETH; normalize in case cart stored wei (avoids impossible figure in wallet)
          const priceEth = priceInEthForBuy(item.price);
          await buyNFT(item.contractAddress || item.nftContract, item.nftId, priceEth, nftNetwork);
          toast.success(`Successfully purchased ${item.name}!`);
        } catch (error) {
          console.error(`Failed to buy ${item.name}:`, error);
          toast.error(`Failed to buy ${item.name}: ${error.message || 'Unknown error'}`);
        }
      }
      await clearCart(address);
      toast.success('Purchases completed!');
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
                
                {/* ✅ ISSUE #6: Fee Breakdown Display */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Items ({cartItems.length})</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span className="text-white">{cartTotal.toFixed(8)} ETH</span>
                  </div>
                  
                  {/* Fees Display */}
                  {(() => {
                    const fees = calculateFees(cartTotal);
                    return (
                      <>
                        <div className="border-t border-gray-600 pt-3 mt-3">
                          <p className="text-gray-400 text-sm font-semibold mb-2">📊 Fee Breakdown</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Creator Fee (2.5%)</span>
                              <span className="text-yellow-400">{formatPrice(fees.creatorFee)} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Platform Fee (1.5%)</span>
                              <span className="text-red-400">{formatPrice(fees.buyerFee)} ETH</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Total Fees (4%)</span>
                              <span className="text-orange-400 font-semibold">{formatPrice(fees.totalFees)} ETH</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-600 pt-3">
                          <div className="flex justify-between text-lg font-semibold text-green-400">
                            <span>Total You Pay</span>
                            <span>{formatPrice(fees.totalPrice)} ETH</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-2">
                            Includes all fees • Creators receive {formatPrice(fees.creatorReceives)} ETH
                          </p>
                        </div>
                      </>
                    );
                  })()}
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
