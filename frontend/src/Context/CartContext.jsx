import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  // Load cart items when wallet address changes
  const loadCart = async (walletAddress) => {
    if (!walletAddress) {
      setCartItems([]);
      setCartTotal(0);
      return;
    }

    setIsLoading(true);
    try {
      const cart = await cartAPI.getUserCart(walletAddress);
      const items = Array.isArray(cart) ? cart : (cart.items || []);
      setCartItems(items);
      calculateTotal(items);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems([]);
      setCartTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total price
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + parseFloat(item.price || 0);
    }, 0);
    setCartTotal(total);
  };

  // Ensure backend gets a numeric nftId (for lazy mints itemId can be string)
  const toCartNftId = (nftData) => {
    const raw = nftData.itemId ?? nftData.tokenId;
    if (typeof raw === 'number' && !isNaN(raw)) return raw;
    if (typeof raw === 'string' && /^\d+$/.test(raw)) return parseInt(raw, 10);
    const str = String(nftData.itemId ?? nftData.tokenId ?? nftData._id ?? '0');
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
    return Math.abs(h) || 0;
  };

  // Add NFT to cart
  const addToCart = async (nftData, walletAddress) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const cartItem = {
        walletAddress,
        nftId: toCartNftId(nftData),
        contractAddress: nftData.contractAddress || nftData.nftContract,
        tokenId: nftData.tokenId,
        price: nftData.price,
        name: nftData.name,
        image: nftData.image || nftData.imageURL,
        metadata: { ...(nftData.metadata || {}), network: nftData.network, isLazyMint: !!nftData.isLazyMint },
        addedAt: new Date().toISOString(),
      };

      await cartAPI.addNftToCart(cartItem);
      
      // Reload cart to get updated items
      await loadCart(walletAddress);
      toast.success('NFT added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add NFT to cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove NFT from cart
  const removeFromCart = async (walletAddress, nftId, contractAddress) => {
    setIsLoading(true);
    try {
      await cartAPI.removeNftFromCart(walletAddress, nftId, contractAddress);
      
      // Reload cart to get updated items
      await loadCart(walletAddress);
      toast.success('NFT removed from cart!');
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error('Failed to remove NFT from cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async (walletAddress) => {
    setIsLoading(true);
    try {
      await cartAPI.clearUserCart(walletAddress);
      setCartItems([]);
      setCartTotal(0);
      toast.success('Cart cleared!');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if NFT is in cart (use same id as addToCart: getCartNftId(nft))
  const isInCart = (nftId, contractAddress) => {
    return cartItems.some(
      item => item.nftId === nftId && item.contractAddress === contractAddress
    );
  };

  // Get cart item count
  const getCartItemCount = () => {
    return cartItems.length;
  };

  const value = {
    cartItems,
    cartTotal,
    isLoading,
    loadCart,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getCartNftId: toCartNftId,
    getCartItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
