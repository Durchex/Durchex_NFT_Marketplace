import React, { useContext, useState } from 'react';
import { ICOContent } from '../Context/index.jsx';
import { getCurrencySymbol } from '../Context/constants.jsx';
import { ErrorToast } from '../app/Toast/Error.jsx';
import { SuccessToast } from '../app/Toast/Success';
import toast from 'react-hot-toast';

const NETWORK_OPTIONS = [
  { value: 'polygon', label: 'Polygon' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'base', label: 'Base' },
  { value: 'bsc', label: 'BSC' },
];

/**
 * Compact form to list an NFT on the marketplace using Token ID.
 * Uses the NFT contract (VendorNFT) for the selected network.
 */
export default function ListNftForm() {
  const { listNFT, contractAddressMarketplace, selectedChain, setSelectedChain, address } = useContext(ICOContent) || {};
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = (tokenId || '').trim();
    const p = (price || '').trim();
    if (!tid || !p) {
      ErrorToast('Enter Token ID and price');
      return;
    }
    if (!address) {
      ErrorToast('Connect your wallet first');
      return;
    }
    const nftContractAddress = contractAddressMarketplace;
    if (!nftContractAddress) {
      ErrorToast('No NFT contract configured for this network. Try another network.');
      return;
    }
    const priceNum = parseFloat(p);
    if (isNaN(priceNum) || priceNum <= 0) {
      ErrorToast('Enter a valid price');
      return;
    }

    setSubmitting(true);
    try {
      const receipt = await listNFT(nftContractAddress, tid, String(priceNum));
      const success = receipt && (receipt.status === 1 || receipt.transactionHash);
      if (success) {
        SuccessToast('NFT listed successfully!');
        setTokenId('');
        setPrice('');
      } else {
        ErrorToast(receipt?.message || 'Listing failed');
      }
    } catch (err) {
      console.error('List NFT error:', err);
      ErrorToast(err?.message || 'Failed to list NFT');
    } finally {
      setSubmitting(false);
    }
  };

  const symbol = getCurrencySymbol(selectedChain || 'polygon');

  return (
    <div className="bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-700/50 p-6 mb-8">
      <h2 className="text-xl font-bold text-white mb-1">List NFT by Token ID</h2>
      <p className="text-gray-400 text-sm mb-4">
        Enter the token ID of an NFT you own. Ensure your wallet is on the correct network.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Network</label>
          <select
            value={(selectedChain || 'polygon').toLowerCase()}
            onChange={(e) => setSelectedChain?.(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {NETWORK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Token ID *</label>
          <input
            type="text"
            placeholder="e.g. 1 or 42"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Price ({symbol}) *
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder={`0.0`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !tokenId.trim() || !price.trim() || !address}
          className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-white transition shadow-lg"
        >
          {submitting ? 'Listing...' : 'List NFT'}
        </button>
        {!address && (
          <p className="text-amber-400 text-sm">Connect your wallet to list an NFT.</p>
        )}
      </form>
    </div>
  );
}
