import React, { useState, useContext, useEffect } from 'react';
import Header from '../components/Header';
import { ICOContent } from '../Context';
import { bridgeAPI } from '../services/api';
import toast from 'react-hot-toast';

const CHAINS_FALLBACK = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'base', label: 'Base' },
  { value: 'bsc', label: 'BSC' },
];

/**
 * BridgeNFT - Cross-chain NFT bridge (live API + same layout)
 */
const BridgeNFT = () => {
  const { address, connectWallet } = useContext(ICOContent) || {};
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState(CHAINS_FALLBACK);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    sourceChain: 'ethereum',
    destinationChain: 'polygon',
    nftAddress: '',
    tokenId: '',
    tokenType: 'nft',
    amount: '1',
    recipientAddress: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const { sourceChain, destinationChain, nftAddress, tokenId, tokenType, amount, recipientAddress } = form;
    if (!nftAddress?.trim() || !tokenId?.trim()) {
      toast.error('Enter NFT contract address and token ID');
      return;
    }
    if (sourceChain === destinationChain) {
      toast.error('Source and destination must be different');
      return;
    }
    setLoading(true);
    try {
      const res = await bridgeAPI.initiate(address, {
        sourceChain: sourceChain.toLowerCase(),
        destinationChain: destinationChain.toLowerCase(),
        nftAddress: nftAddress.trim(),
        tokenId: tokenId.trim(),
        tokenType: tokenType || 'nft',
        amount: parseInt(amount, 10) || 1,
        recipientAddress: recipientAddress?.trim() || address,
      });
      toast.success(res?.message || 'Bridge initiated');
      setForm((f) => ({ ...f, nftAddress: '', tokenId: '' }));
    } catch (err) {
      const msg = err.response?.data?.errors || err.response?.data?.error || err.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Bridge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Cross-Chain Bridge</h1>
          <p className="text-gray-400">Transfer your NFTs between different blockchain networks</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {!address ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400 mb-4">Connect your wallet to bridge NFTs.</p>
              <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Bridge NFT</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">From Network *</label>
                  <select
                    value={form.sourceChain}
                    onChange={(e) => setForm((f) => ({ ...f, sourceChain: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    required
                  >
                    {chains.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">To Network *</label>
                  <select
                    value={form.destinationChain}
                    onChange={(e) => setForm((f) => ({ ...f, destinationChain: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    required
                  >
                    {chains.filter((c) => c.value !== form.sourceChain).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">NFT Contract Address *</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={form.nftAddress}
                    onChange={(e) => setForm((f) => ({ ...f, nftAddress: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Token ID *</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={form.tokenId}
                    onChange={(e) => setForm((f) => ({ ...f, tokenId: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Recipient (optional)</label>
                  <input
                    type="text"
                    placeholder={address}
                    value={form.recipientAddress}
                    onChange={(e) => setForm((f) => ({ ...f, recipientAddress: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold disabled:opacity-50"
                >
                  {loading ? 'Initiating…' : 'Bridge NFT'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BridgeNFT;
