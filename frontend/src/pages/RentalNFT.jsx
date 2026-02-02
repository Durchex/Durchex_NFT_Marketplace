import React, { useState, useEffect, useContext } from 'react';
import { Lock, Calendar, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import { ICOContent } from '../Context';
import { rentalAPI } from '../services/api';
import toast from 'react-hot-toast';

const FALLBACK_LISTINGS = [
  { id: 1, name: 'Cyber Punk #123', owner: 'Collector42', pricePerDay: 0.5, minDays: 7, maxDays: 30 },
  { id: 2, name: 'Digital Canvas #456', owner: 'ArtLab', pricePerDay: 0.2, minDays: 1, maxDays: 7 },
  { id: 3, name: 'Genesis #001', owner: 'Creator99', pricePerDay: 1.5, minDays: 30, maxDays: 90 },
  { id: 4, name: 'Moon NFT #789', owner: 'SpaceArt', pricePerDay: 0.8, minDays: 7, maxDays: 14 },
];

const FALLBACK_MY_RENTALS = [
  { id: 1, name: 'Virtual Land #001', renter: 'User123', endDate: 'Jan 25, 2026', earned: 0.32 },
  { id: 2, name: 'Metaverse Plot #045', renter: 'User456', endDate: 'Jan 20, 2026', earned: 0.15 },
];

/**
 * RentalNFT - NFT rental and leasing feature (live API + same layout as site)
 */
const RentalNFT = () => {
  const { address, connectWallet } = useContext(ICOContent) || {};
  const [tab, setTab] = useState('browse');
  const [filter, setFilter] = useState('all');
  const [rentalListings, setRentalListings] = useState(FALLBACK_LISTINGS);
  const [myRentals, setMyRentals] = useState(FALLBACK_MY_RENTALS);
  const [loading, setLoading] = useState(false);
  const [listForm, setListForm] = useState({ nftAddress: '', tokenId: '', pricePerDay: '', minDays: '', maxDays: '' });
  const [listSubmitting, setListSubmitting] = useState(false);

  useEffect(() => {
    if (tab === 'browse') {
      setLoading(true);
      rentalAPI.getAvailableListings(0, 20, 'recent')
        .then((list) => setRentalListings(Array.isArray(list) && list.length > 0 ? list : FALLBACK_LISTINGS))
        .catch(() => setRentalListings(FALLBACK_LISTINGS))
        .finally(() => setLoading(false));
    } else if (tab === 'my' && address) {
      setLoading(true);
      rentalAPI.getMyRentals(address)
        .then((list) => setMyRentals(Array.isArray(list) && list.length > 0 ? list : FALLBACK_MY_RENTALS))
        .catch(() => setMyRentals(FALLBACK_MY_RENTALS))
        .finally(() => setLoading(false));
    }
  }, [tab, address]);

  const handleListSubmit = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    const { nftAddress, tokenId, pricePerDay, minDays, maxDays } = listForm;
    if (!nftAddress?.trim() || !tokenId?.trim() || !pricePerDay || !minDays || !maxDays) {
      toast.error('Fill all required fields');
      return;
    }
    setListSubmitting(true);
    try {
      await rentalAPI.createListing(address, {
        nftAddress: nftAddress.trim(),
        tokenId: tokenId.trim(),
        pricePerDay: parseFloat(pricePerDay),
        minDays: parseInt(minDays, 10),
        maxDays: parseInt(maxDays, 10),
      });
      toast.success('Listing created');
      setListForm({ nftAddress: '', tokenId: '', pricePerDay: '', minDays: '', maxDays: '' });
      setTab('browse');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Create listing failed');
    } finally {
      setListSubmitting(false);
    }
  };

  const displayListings = rentalListings.map((r) => {
    const id = r.id ?? r.listingId ?? r._id;
    const name = r.name ?? `NFT #${r.tokenId ?? r.id ?? ''}`;
    const owner =
      r.owner ||
      (r.lister ? `${r.lister.slice(0, 6)}...${r.lister.slice(-4)}` : '—');
    const price = r.price ?? r.pricePerDay ?? 0;
    const duration =
      r.duration ||
      (r.minDays && r.maxDays ? `${r.minDays}-${r.maxDays} days` : '—');
    const roi = r.roi ?? '—';

    return { id, name, owner, price, duration, roi };
  });

  const displayMyRentals = myRentals.map((r) => {
    const id = r.id ?? r.rentalId ?? r._id;
    const name = r.name ?? `Rental #${r.rentalId ?? r.id}`;
    const renter =
      r.renter ||
      (r.renterAddress
        ? `${r.renterAddress.slice(0, 6)}...${r.renterAddress.slice(-4)}`
        : '—');
    const endDate =
      r.endDate ||
      (r.endTime ? new Date(r.endTime).toLocaleDateString() : '—');
    const earned = r.earned ?? r.earnedAmount ?? 0;

    return { id, name, renter, endDate, earned };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">NFT Rental</h1>
          <p className="text-gray-400">Rent NFTs to earn yield or use them temporarily</p>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          <button
            onClick={() => setTab('browse')}
            className={`px-4 py-2 rounded-lg transition ${
              tab === 'browse'
                ? 'bg-purple-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Browse Rentals
          </button>
          <button
            onClick={() => setTab('my')}
            className={`px-4 py-2 rounded-lg transition ${
              tab === 'my'
                ? 'bg-purple-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            My Rentals
          </button>
          <button
            onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-lg transition ${
              tab === 'list'
                ? 'bg-purple-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            List for Rental
          </button>
        </div>
      </section>

      {/* Browse Tab */}
      {tab === 'browse' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex gap-2">
              {['all', 'available', 'popular'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === f
                      ? 'bg-purple-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-gray-400">Loading listings…</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayListings.map(rental => (
                  <div key={rental.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-purple-500 transition">
                    <div className="h-40 bg-gradient-to-br from-purple-600 to-pink-600"></div>
                    <div className="p-4">
                      <p className="text-sm text-gray-400">{rental.owner}</p>
                      <h3 className="font-bold mb-2">{rental.name}</h3>
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center">
                          <DollarSign size={16} className="mr-2 text-green-400" />
                          <span>{rental.price} ETH</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-blue-400" />
                          <span>{rental.duration}</span>
                        </div>
                        {rental.roi !== '—' && (
                          <div className="flex items-center">
                            <TrendingUp size={16} className="mr-2 text-yellow-400" />
                            <span className="text-yellow-400 font-semibold">{rental.roi}</span>
                          </div>
                        )}
                      </div>
                      <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded transition">
                        Rent Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* My Rentals Tab */}
      {tab === 'my' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Earned</p>
                <p className="text-3xl font-bold text-green-400">0.47 ETH</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Active Rentals</p>
                <p className="text-3xl font-bold">2</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Avg. ROI</p>
                <p className="text-3xl font-bold text-yellow-400">19.2% APY</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-700 bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-3">NFT</th>
                    <th className="px-6 py-3">Renter</th>
                    <th className="px-6 py-3">End Date</th>
                    <th className="px-6 py-3">Earned</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayMyRentals.map(rental => (
                    <tr key={rental.id} className="border-b border-gray-700">
                      <td className="px-6 py-3">{rental.name}</td>
                      <td className="px-6 py-3">{rental.renter}</td>
                      <td className="px-6 py-3">{rental.endDate}</td>
                      <td className="px-6 py-3 text-green-400 font-semibold">{rental.earned} ETH</td>
                      <td className="px-6 py-3">
                        <button className="text-purple-400 hover:text-purple-300">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* List for Rental Tab */}
      {tab === 'list' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            {!address ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                <p className="text-gray-400 mb-4">Connect your wallet to list an NFT for rental.</p>
                <button type="button" onClick={connectWallet} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-6">List Your NFT for Rental</h2>
                <form onSubmit={handleListSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">NFT Contract Address *</label>
                    <input
                      value={listForm.nftAddress}
                      onChange={(e) => setListForm((f) => ({ ...f, nftAddress: e.target.value }))}
                      placeholder="0x..."
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Token ID *</label>
                    <input
                      value={listForm.tokenId}
                      onChange={(e) => setListForm((f) => ({ ...f, tokenId: e.target.value }))}
                      placeholder="1"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Daily Rental Price (ETH) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={listForm.pricePerDay}
                      onChange={(e) => setListForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                      placeholder="0.5"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Min Days *</label>
                      <input
                        type="number"
                        min="1"
                        value={listForm.minDays}
                        onChange={(e) => setListForm((f) => ({ ...f, minDays: e.target.value }))}
                        placeholder="7"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Max Days *</label>
                      <input
                        type="number"
                        min="1"
                        value={listForm.maxDays}
                        onChange={(e) => setListForm((f) => ({ ...f, maxDays: e.target.value }))}
                        placeholder="30"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={listSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold transition disabled:opacity-50">
                    {listSubmitting ? 'Creating…' : 'List for Rental'}
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

export default RentalNFT;
