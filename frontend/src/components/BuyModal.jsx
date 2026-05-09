import React, { useContext, useState } from 'react';
import { FiX, FiShoppingCart, FiClock } from 'react-icons/fi';
import { ICOContent } from '../Context';
import { getCurrencySymbol } from '../Context/constants';
import { useMarketplace } from '../hooks/useMarketplace';
import toast from 'react-hot-toast';

const BuyModal = ({ isOpen, onClose, listing }) => {
  const { address } = useContext(ICOContent);
  const { executeSale, isLoading } = useMarketplace();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handlePurchase = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (isAuction && isEnded) {
      toast.error('This auction has ended.');
      return;
    }

    try {
      // Pass the full listing so the hook can forward seller/quantity/network
      // to the backend (executeSale needs all of these to update state correctly).
      await executeSale(listing);
      setAgreedToTerms(false);
      onClose?.();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (!isOpen || !listing) return null;

  const symbol = getCurrencySymbol(listing.network || 'ethereum');
  const isAuction = listing.listingType === 'auction';
  const isEnded = isAuction && listing.endTime && Date.now() / 1000 > listing.endTime;
  const isActive = !isEnded;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <FiShoppingCart className="text-emerald-400 text-xl" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isAuction ? 'Place Bid' : 'Complete Purchase'}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">{listing.nftName || 'NFT Purchase'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* NFT Preview */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                {listing.nftImage && (
                  <img
                    src={listing.nftImage}
                    alt={listing.nftName}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{listing.nftName || 'Unnamed NFT'}</h3>
                  <p className="text-sm text-gray-400">Token ID: {listing.tokenId}</p>
                  <p className="text-xs text-gray-500 capitalize">{listing.network}</p>
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">
                  {isAuction ? 'Current Bid' : 'Price'}
                </span>
                <span className="text-xl font-bold text-emerald-400">
                  {listing.price} {symbol}
                </span>
              </div>

              {isAuction && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Minimum Bid</span>
                    <span className="text-white">{listing.minimumBid || 'N/A'} {symbol}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Time Remaining</span>
                    <span className="text-white flex items-center gap-1">
                      <FiClock className="text-xs" />
                      {isEnded ? 'Ended' : 'Active'}
                    </span>
                  </div>
                </>
              )}

              {/* Fee Information */}
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Service Fee (2.5%)</span>
                  <span>{(listing.price * 0.025).toFixed(4)} {symbol}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-white mt-1">
                  <span>Total</span>
                  <span>{(listing.price * 1.025).toFixed(4)} {symbol}</span>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 bg-gray-800 border-gray-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the{' '}
                <button className="text-emerald-400 hover:text-emerald-300 underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-emerald-400 hover:text-emerald-300 underline">
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={isLoading || !agreedToTerms || (isAuction && !isActive)}
                className="flex-1 py-3 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing…' : isAuction ? 'Place Bid' : 'Complete Purchase'}
              </button>
            </div>

            {/* Warning for ended auctions */}
            {isAuction && isEnded && (
              <p className="text-amber-400 text-sm text-center">
                This auction has ended. You can no longer place bids.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BuyModal;