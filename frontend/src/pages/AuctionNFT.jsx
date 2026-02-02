import React, { useState, useEffect, useContext } from 'react';
import { Clock, DollarSign, Users } from 'lucide-react';
import Header from '../components/Header';
import { auctionAPI } from '../services/api';
import { ICOContent } from '../Context';
import { changeNetwork } from '../Context/constants';
import toast from 'react-hot-toast';

const DEFAULT_AUCTION_NETWORK = 'polygon';

/**
 * AuctionNFT - NFT auctions feature (live API + on-chain bid/settle)
 */
const AuctionNFT = () => {
  const { address, connectWallet, placeAuctionBid, settleAuction, hasAuctionContract, selectedChain } = useContext(ICOContent) || {};
  const [tab, setTab] = useState('browse');
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [bidModal, setBidModal] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [settleLoadingId, setSettleLoadingId] = useState(null);
  const [createForm, setCreateForm] = useState({
    nftContract: '',
    tokenId: '',
    reservePrice: '',
    durationHours: '24',
    minBidIncrement: '500',
  });

  useEffect(() => {
    if (tab === 'browse') {
      setLoading(true);
      auctionAPI
        .list()
        .then((data) => setAuctions(Array.isArray(data) ? data : []))
        .catch(() => setAuctions([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const { nftContract, tokenId, reservePrice, durationHours, minBidIncrement } = createForm;
    if (!nftContract?.trim() || !tokenId?.trim() || !reservePrice?.trim() || !durationHours?.trim()) {
      toast.error('Fill NFT contract, token ID, reserve price, and duration');
      return;
    }
    const reserve = parseFloat(reservePrice);
    if (isNaN(reserve) || reserve <= 0) {
      toast.error('Reserve price must be a positive number');
      return;
    }
    const hours = parseFloat(durationHours);
    if (isNaN(hours) || hours < 1 || hours > 720) {
      toast.error('Duration must be between 1 and 720 hours');
      return;
    }
    const durationInSeconds = Math.round(hours * 3600);
    setCreateLoading(true);
    try {
      const res = await auctionAPI.create(
        {
          nftContract: nftContract.trim(),
          tokenId: tokenId.trim(),
          reservePrice: reserve,
          durationInSeconds,
          minBidIncrement: parseInt(minBidIncrement, 10) || 500,
        },
        address
      );
      toast.success(res?.message || 'Auction created. Complete the transaction in your wallet.');
      setCreateForm({ nftContract: '', tokenId: '', reservePrice: '', durationHours: '24', minBidIncrement: '500' });
      setTab('browse');
      setAuctions((prev) => [...prev, { id: res?.data?.auctionId, ...res?.data, status: 'pending' }]);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatEnds = (endTime) => {
    if (!endTime) return '—';
    const end = new Date(endTime);
    const now = new Date();
    const ms = end - now;
    if (ms <= 0) return 'Ended';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const isEnded = (endTime) => endTime && new Date(endTime) <= new Date();

  const network = selectedChain?.toLowerCase() || DEFAULT_AUCTION_NETWORK;
  const canUseChain = hasAuctionContract?.(network);

  const handlePlaceBid = async () => {
    if (!address || !bidModal) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid bid amount');
      return;
    }
    setBidLoading(true);
    try {
      await changeNetwork(network);
      await new Promise((r) => setTimeout(r, 500));
      await placeAuctionBid(network, bidModal.id, amount);
      toast.success('Bid placed');
      setBidModal(null);
      setBidAmount('');
      const data = await auctionAPI.list();
      setAuctions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Bid failed');
    } finally {
      setBidLoading(false);
    }
  };

  const handleSettle = async (auction) => {
    if (!address) return;
    setSettleLoadingId(auction.id);
    try {
      await changeNetwork(network);
      await new Promise((r) => setTimeout(r, 500));
      await settleAuction(network, auction.id);
      toast.success('Auction settled');
      const data = await auctionAPI.list();
      setAuctions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Settle failed');
    } finally {
      setSettleLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">NFT Auctions</h1>
          <p className="text-gray-400">Bid on exclusive NFTs in timed auctions</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['browse', 'create'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {t === 'browse' ? 'Browse Auctions' : 'Create Auction'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'browse' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <p className="text-gray-400">Loading auctions…</p>
            ) : auctions.length === 0 ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
                <p>No active auctions yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {auctions.map((auction) => (
                  <div key={auction.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <span className="text-4xl text-white/50">#{auction.tokenId}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-400">{auction.seller ? `${auction.seller.slice(0, 6)}...${auction.seller.slice(-4)}` : '—'}</p>
                      <h3 className="font-bold mb-3">NFT #{auction.tokenId}</h3>
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span>Current Bid</span>
                          <span className="text-yellow-400 font-semibold">{Number(auction.currentBid) || Number(auction.reservePrice) || 0} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reserve</span>
                          <span>{Number(auction.reservePrice) || 0} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ends</span>
                          <span className="text-red-400">{formatEnds(auction.endTime)}</span>
                        </div>
                      </div>
                      {isEnded(auction.endTime) ? (
                        canUseChain && (
                          <button
                            onClick={() => handleSettle(auction)}
                            disabled={!address || settleLoadingId === auction.id}
                            className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold transition disabled:opacity-50"
                          >
                            {settleLoadingId === auction.id ? 'Settling…' : 'Settle'}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => { setBidModal(auction); setBidAmount(''); }}
                          disabled={!address}
                          className="w-full bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-semibold transition disabled:opacity-50"
                        >
                          {canUseChain ? 'Place Bid' : 'Place Bid (connect wallet)'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {bidModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => !bidLoading && setBidModal(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Place Bid — NFT #{bidModal.tokenId}</h3>
            <p className="text-gray-400 text-sm mb-4">Min: {Number(bidModal.currentBid) || Number(bidModal.reservePrice) || 0} ETH</p>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.1"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handlePlaceBid} disabled={bidLoading} className="flex-1 bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-semibold disabled:opacity-50">
                {bidLoading ? 'Placing…' : 'Place Bid'}
              </button>
              <button onClick={() => setBidModal(null)} disabled={bidLoading} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'create' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                <p className="text-gray-400 mb-4">Connect your wallet to create an auction.</p>
                <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-6">Create Auction</h2>
                <form onSubmit={handleCreate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">NFT Contract Address *</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={createForm.nftContract}
                      onChange={(e) => setCreateForm((f) => ({ ...f, nftContract: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Token ID *</label>
                    <input
                      type="text"
                      placeholder="1"
                      value={createForm.tokenId}
                      onChange={(e) => setCreateForm((f) => ({ ...f, tokenId: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Reserve Price (ETH) *</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="1.0"
                        value={createForm.reservePrice}
                        onChange={(e) => setCreateForm((f) => ({ ...f, reservePrice: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Duration (hours) *</label>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        placeholder="24"
                        value={createForm.durationHours}
                        onChange={(e) => setCreateForm((f) => ({ ...f, durationHours: e.target.value }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Min Bid Increment (wei)</label>
                    <input
                      type="text"
                      placeholder="500"
                      value={createForm.minBidIncrement}
                      onChange={(e) => setCreateForm((f) => ({ ...f, minBidIncrement: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold disabled:opacity-50"
                  >
                    {createLoading ? 'Creating…' : 'Create Auction'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AuctionNFT;
