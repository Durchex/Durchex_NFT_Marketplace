import React, { useContext } from 'react';
import { useCart } from '../Context/CartContext';
import { ICOContent } from '../Context';
import { FiX, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cartItems, cartTotal, removeFromCart, clearCart, isLoading } = useCart();
  const { address, buyNFT } = useContext(ICOContent);

  const handleRemoveItem = async (nftId, contractAddress) => {
    await removeFromCart(address, nftId, contractAddress);
    toast.success('Item removed from cart');
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart(address);
      toast.success('Cart cleared');
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
      onClose();
    } catch (error) {
      console.error('Error during bulk purchase:', error);
      toast.error('Some items failed to purchase');
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-gray-900 border-l border-gray-800 shadow-xl z-50 transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FiShoppingCart className="text-purple-500 text-2xl" />
            <div>
              <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
              <p className="text-sm text-gray-400">{cartItems.length} items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Close cart"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-400 mb-4">
                Start exploring NFTs and add them to your cart
              </p>
              <button
                onClick={onClose}
                className="text-purple-500 hover:text-purple-400 text-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {cartItems.map((item, index) => (
                <div
                  key={`${item.itemId || item.nftId}-${index}`}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex gap-3">
                    {/* Image */}
                    <img
                      src={item.image || 'https://via.placeholder.com/64?text=NFT'}
                      alt={item.name}
                      className="w-16 h-16 rounded object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64?text=NFT';
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <p className="text-xs text-gray-400 truncate mb-2">
                        {item.metadata?.collectionName || 'Collection'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-400">
                          {(parseFloat(item.price) / 1e18).toFixed(4)} ETH
                        </span>
                        <button
                          onClick={() =>
                            handleRemoveItem(item.itemId || item.nftId, item.nftContract)
                          }
                          className="p-1 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300"
                          title="Remove from cart"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-800 p-6 space-y-4">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span>{(parseFloat(cartTotal || 0) / 1e18).toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gas (est.)</span>
                <span className="text-yellow-400">Pending</span>
              </div>
              <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-purple-400">
                  {(parseFloat(cartTotal || 0) / 1e18).toFixed(4)} ETH
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleBuyAll}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Processing...' : 'Buy All'}
              </button>
              <button
                onClick={handleClearCart}
                className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors text-red-400 hover:text-red-300"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
