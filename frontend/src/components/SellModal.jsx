import React, { useContext, useState } from 'react';
import { FiX, FiClock, FiTag } from 'react-icons/fi';
import { ICOContent } from '../Context';
import { getCurrencySymbol } from '../Context/constants';
import { useMarketplace } from '../hooks/useMarketplace';
import toast from 'react-hot-toast';

const NETWORK_CHAIN_IDS = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  arbitrum: 42161,
  base: 8453,
};

const SellModal = ({ isOpen, onClose, nft }) => {
  const { address } = useContext(ICOContent);
  const { createListing, isLoading } = useMarketplace();
  const [listingType, setListingType] = useState('fixed'); // 'fixed' | 'auction' | 'dutch'
  const [price, setPrice] = useState('');
  const [minimumBid, setMinimumBid] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('24'); // hours
  const [dutchStartPrice, setDutchStartPrice] = useState('');
  const [dutchEndPrice, setDutchEndPrice] = useState('');

  const totalPieces = Number(nft?.pieces ?? nft?.supply ?? 1) || 1;
  const remainingPieces = Number(nft?.remainingPieces ?? 0);
  const primarySaleComplete = totalPieces <= 1 || remainingPieces <= 0;

  const handleList = async (e) => {
    e?.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }

    if (!primarySaleComplete) {
      toast.error(`Resale is locked until all ${totalPieces} pieces are minted (${remainingPieces} left).`);
      return;
    }

    const nftContract = nft?.contractAddress || nft?.nftContract;
    const tokenId = nft?.tokenId;

    if (!nftContract || !tokenId) {
      toast.error('This NFT cannot be listed here (missing contract or token ID). Use Profile > List NFT.');
      return;
    }

    // Validate price
    const priceNum = price && parseFloat(price);
    if (!priceNum || priceNum <= 0) {
      toast.error('Enter a valid price');
      return;
    }

    // Validate auction fields if auction listing
    if (listingType === 'auction') {
      const minBidNum = minimumBid && parseFloat(minimumBid);
      if (!minBidNum || minBidNum <= 0) {
        toast.error('Enter a valid minimum bid for auction');
        return;
      }
      if (minBidNum >= priceNum) {
        toast.error('Minimum bid must be less than reserve price');
        return;
      }
    }

    try {
      const listingData = {
        nftContract,
        tokenId,
        price: priceNum,
        listingType,
        network: nft?.network || 'ethereum',
        parentNftId: nft?._id || nft?.itemId,
      };

      // English auction
      if (listingType === 'auction') {
        const durationHours = parseInt(auctionDuration);
        listingData.startTime = Math.floor(Date.now() / 1000);
        listingData.endTime = listingData.startTime + (durationHours * 3600);
        listingData.minimumBid = parseFloat(minimumBid);
      }

      // Dutch auction — price decays linearly from start → end over duration
      if (listingType === 'dutch') {
        const start = parseFloat(dutchStartPrice);
        const end = parseFloat(dutchEndPrice);
        if (!start || !end || end >= start) {
          toast.error('Dutch auction needs start price > end price.');
          return;
        }
        const durationHours = parseInt(auctionDuration);
        listingData.startTime = Math.floor(Date.now() / 1000);
        listingData.endTime = listingData.startTime + (durationHours * 3600);
        // Backend wants wei strings; the createListing hook converts price → wei.
        // Re-use the same conversion by sending eth-denominated values and letting
        // the hook handle parseEther for both endpoints. Send dutch start/end
        // as eth strings; the bulk path also accepts these.
        listingData.dutchStartPriceEth = start;
        listingData.dutchEndPriceEth = end;
      }

      await createListing(listingData);

      // Reset form
      setPrice('');
      setMinimumBid('');
      setAuctionDuration('24');
      setListingType('fixed');
      onClose?.();
    } catch (err) {
      console.error('SellModal list error:', err);
      // Error is already handled in the hook
    }
  };

  if (!isOpen) return null;

  const symbol = getCurrencySymbol(nft?.network || 'ethereum');
  const canList = nft?.contractAddress || nft?.nftContract;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-white">List for sale</h2>
              <p className="text-sm text-gray-400 mt-0.5">{nft?.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <FiX className="text-xl" />
            </button>
          </div>
          <form onSubmit={handleList} className="p-6 space-y-4">
            {/* Listing Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Listing Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setListingType('fixed')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    listingType === 'fixed' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                  }`}>
                  <FiTag className="text-lg mx-auto mb-1" />
                  <div className="text-sm font-medium">Fixed</div>
                </button>
                <button type="button" onClick={() => setListingType('auction')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    listingType === 'auction' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                  }`}>
                  <FiClock className="text-lg mx-auto mb-1" />
                  <div className="text-sm font-medium">Auction</div>
                </button>
                <button type="button" onClick={() => setListingType('dutch')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    listingType === 'dutch' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                  }`}
                  title="Price decays linearly over time">
                  <FiClock className="text-lg mx-auto mb-1 rotate-180" />
                  <div className="text-sm font-medium">Dutch</div>
                </button>
              </div>
            </div>

            {/* Price Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {listingType === 'auction' ? 'Reserve Price' : 'Price'} ({symbol}) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={`0.00`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Dutch-specific fields */}
            {listingType === 'dutch' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start price ({symbol})</label>
                    <input type="text" inputMode="decimal" placeholder="2.0" value={dutchStartPrice}
                      onChange={(e) => setDutchStartPrice(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End price ({symbol})</label>
                    <input type="text" inputMode="decimal" placeholder="0.5" value={dutchEndPrice}
                      onChange={(e) => setDutchEndPrice(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                  <select value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white">
                    <option value="1">1 hour</option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">2 days</option>
                    <option value="72">3 days</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400">
                  Price will decay linearly from {dutchStartPrice || '?'} {symbol} to {dutchEndPrice || '?'} {symbol} over {auctionDuration}h.
                </p>
              </>
            )}

            {/* Auction-specific fields */}
            {listingType === 'auction' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Bid ({symbol}) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={minimumBid}
                    onChange={(e) => setMinimumBid(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auction Duration
                  </label>
                  <select
                    value={auctionDuration}
                    onChange={(e) => setAuctionDuration(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1">1 hour</option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">2 days</option>
                    <option value="72">3 days</option>
                    <option value="168">7 days</option>
                  </select>
                </div>
              </>
            )}

            {/* NFT Info */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network</span>
                <span className="font-medium text-white capitalize">{nft?.network || 'Ethereum'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Token ID</span>
                <span className="font-mono text-white">{nft?.tokenId ?? '—'}</span>
              </div>
              {listingType === 'auction' && (
                <div className="text-xs text-gray-400 mt-2">
                  Auction will start immediately and end after {auctionDuration} hours
                </div>
              )}
            </div>

            {!canList && (
              <p className="text-amber-400 text-sm">
                This item does not have a contract/token ID for on-chain listing. You can list from Profile → List NFT with your token ID.
              </p>
            )}

            {!primarySaleComplete && (
              <p className="text-amber-400 text-sm">
                Resale is locked: {remainingPieces} of {totalPieces} pieces still unminted. Secondary listings unlock once all pieces are minted.
              </p>
            )}

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
                type="submit"
                disabled={isLoading || !price.trim() || !canList || !primarySaleComplete || (listingType === 'auction' && !minimumBid.trim())}
                className="flex-1 py-3 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating…' : `List for ${listingType === 'auction' ? 'Auction' : 'Sale'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SellModal;
