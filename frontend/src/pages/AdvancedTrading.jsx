import React, { useState, useEffect, useContext } from 'react';
import { Plus, DollarSign, Users, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import { offerAPI } from '../services/api';
import { ICOContent } from '../Context';
import toast from 'react-hot-toast';

/**
 * AdvancedTrading - Offers (live API: received, my offers, create/accept/reject)
 */
const AdvancedTrading = () => {
  const { address, connectWallet, createOfferOnChain, acceptOfferOnChain, cancelOfferOnChain, hasOfferContract } = useContext(ICOContent) || {};
  const [tab, setTab] = useState('offers');
  const [received, setReceived] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    contractAddress: '',
    nftId: '',
    nftOwner: '',
    offerPrice: '',
    currency: 'ETH',
    network: 'polygon',
    nftName: '',
    message: '',
  });

  useEffect(() => {
    if (!address) {
      setReceived([]);
      setMyOffers([]);
      return;
    }
    setLoading(true);
    Promise.all([offerAPI.getReceived(address), offerAPI.getByUser(address)])
      .then(([rec, my]) => {
        setReceived(Array.isArray(rec) ? rec : rec?.offers ?? []);
        setMyOffers(Array.isArray(my) ? my : my?.offers ?? []);
      })
      .catch(() => {
        setReceived([]);
        setMyOffers([]);
      })
      .finally(() => setLoading(false));
  }, [address, tab]);

  const handleAccept = async (offer) => {
    if (!address) return;
    const offerId = offer?.offerId ?? offer;
    const network = (offer?.network || 'polygon').toLowerCase();
    const contractOfferId = offer?.contractOfferId ?? offer?.onChainOfferId;
    try {
      if (contractOfferId != null && hasOfferContract?.(network)) {
        await acceptOfferOnChain(network, contractOfferId);
      }
      try { await offerAPI.accept(offerId); } catch (_) { /* DB may not have offer */ }
      toast.success('Offer accepted');
      setReceived((prev) => prev.filter((o) => (o?.offerId ?? o) !== offerId));
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Accept failed');
    }
  };

  const handleReject = async (offerId) => {
    if (!address) return;
    try {
      await offerAPI.reject(offerId);
      toast.success('Offer declined');
      setReceived((prev) => prev.filter((o) => o.offerId !== offerId));
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Decline failed');
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const { contractAddress, nftId, nftOwner, offerPrice, currency, network, nftName, message } = createForm;
    if (!contractAddress?.trim() || !nftId?.trim() || !offerPrice?.trim()) {
      toast.error('Fill contract address, NFT ID, and offer price');
      return;
    }
    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Offer price must be a positive number');
      return;
    }
    const net = (network || 'polygon').toLowerCase();
    const seller = (nftOwner || address).trim();
    setCreateLoading(true);
    try {
      let contractOfferId = null;
      if (hasOfferContract?.(net) && createOfferOnChain) {
        const { ethers } = await import('ethers');
        const amountWei = ethers.utils.parseEther(offerPrice);
        const { offerId } = await createOfferOnChain(net, {
          nftContract: contractAddress.trim(),
          tokenId: nftId.trim(),
          seller: ethers.utils.getAddress(seller),
          amountWei,
          durationDays: 7,
        });
        contractOfferId = offerId;
      }
      await offerAPI.create({
        maker: address,
        contractAddress: contractAddress.trim(),
        nftId: nftId.trim(),
        nftOwner: seller.toLowerCase(),
        offerPrice: price,
        offerAmount: price,
        currency: currency || 'ETH',
        network: net,
        nftName: nftName || undefined,
        message: message || undefined,
        contractOfferId: contractOfferId ?? undefined,
        onChainOfferId: contractOfferId ?? undefined,
      });
      toast.success(contractOfferId ? 'Offer created on-chain and recorded' : 'Offer submitted');
      setCreateForm({ contractAddress: '', nftId: '', nftOwner: '', offerPrice: '', currency: 'ETH', network: 'polygon', nftName: '', message: '' });
      setTab('history');
      const my = await offerAPI.getByUser(address);
      setMyOffers(Array.isArray(my) ? my : my?.offers ?? []);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Submit failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const offersToShow = tab === 'offers' ? received : tab === 'history' ? myOffers : [];
  const tableLabel = tab === 'offers' ? 'Offers received' : tab === 'history' ? 'My offers' : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Advanced Trading</h1>
          <p className="text-gray-400">Make and accept offers, negotiate directly</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['offers', 'history', 'create'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {t === 'offers' ? 'Offers received' : t === 'history' ? 'My offers' : 'Make offer'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'offers' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
                <p>Connect your wallet to see offers.</p>
                <button type="button" onClick={connectWallet} className="mt-4 px-6 py-2 bg-purple-600 rounded font-semibold">
                  Connect Wallet
                </button>
              </div>
            ) : loading ? (
              <p className="text-gray-400">Loading…</p>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-700 bg-gray-700/30">
                    <tr>
                      <th className="px-6 py-3 text-left">NFT</th>
                      <th className="px-6 py-3 text-left">From</th>
                      <th className="px-6 py-3 text-left">Price</th>
                      <th className="px-6 py-3 text-left">Expires</th>
                      {tab === 'offers' && <th className="px-6 py-3 text-left">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {offersToShow.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          {tab === 'offers' ? 'No offers received yet.' : 'No offers made yet.'}
                        </td>
                      </tr>
                    ) : (
                      offersToShow.map((offer) => (
                        <tr key={offer.offerId} className="border-b border-gray-700">
                          <td className="px-6 py-3">{offer.nftName || `#${offer.nftId}`}</td>
                          <td className="px-6 py-3">{offer.maker ? `${offer.maker.slice(0, 6)}...${offer.maker.slice(-4)}` : '—'}</td>
                          <td className="px-6 py-3">{offer.offerAmount ?? offer.offerPrice ?? 0} {offer.currency || 'ETH'}</td>
                          <td className="px-6 py-3">{offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString() : '—'}</td>
                          {tab === 'offers' && offer.status === 'active' && (
                            <td className="px-6 py-3 space-x-2">
                              <button onClick={() => handleAccept(offer)} className="text-green-400 hover:text-green-300">
                                Accept
                              </button>
                              <button onClick={() => handleReject(offer.offerId)} className="text-red-400 hover:text-red-300">
                                Decline
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {!address ? null : loading ? (
              <p className="text-gray-400">Loading…</p>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-700 bg-gray-700/30">
                    <tr>
                      <th className="px-6 py-3 text-left">NFT</th>
                      <th className="px-6 py-3 text-left">Your offer</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myOffers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                          No offers made yet.
                        </td>
                      </tr>
                    ) : (
                      myOffers.map((offer) => (
                        <tr key={offer.offerId} className="border-b border-gray-700">
                          <td className="px-6 py-3">{offer.nftName || `#${offer.nftId}`}</td>
                          <td className="px-6 py-3">{offer.offerAmount ?? offer.offerPrice ?? 0} {offer.currency || 'ETH'}</td>
                          <td className="px-6 py-3">{offer.status || 'active'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'create' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
                <p>Connect your wallet to make an offer.</p>
                <button type="button" onClick={connectWallet} className="mt-4 px-6 py-2 bg-purple-600 rounded font-semibold">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-6">Make an Offer</h2>
                <form onSubmit={handleCreateOffer} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">NFT Contract Address *</label>
                    <input
                      placeholder="0x..."
                      value={createForm.contractAddress}
                      onChange={(e) => setCreateForm((f) => ({ ...f, contractAddress: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">NFT ID (token ID) *</label>
                    <input
                      placeholder="1"
                      value={createForm.nftId}
                      onChange={(e) => setCreateForm((f) => ({ ...f, nftId: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Current owner (wallet) *</label>
                    <input
                      placeholder="0x..."
                      value={createForm.nftOwner}
                      onChange={(e) => setCreateForm((f) => ({ ...f, nftOwner: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Your offer (ETH) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="2.5"
                      value={createForm.offerPrice}
                      onChange={(e) => setCreateForm((f) => ({ ...f, offerPrice: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Network</label>
                    <select
                      value={createForm.network}
                      onChange={(e) => setCreateForm((f) => ({ ...f, network: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    >
                      <option value="polygon">Polygon</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="base">Base</option>
                      <option value="bsc">BSC</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold disabled:opacity-50"
                  >
                    {createLoading ? 'Submitting…' : 'Submit Offer'}
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

export default AdvancedTrading;
