import React, { useState } from 'react';
import { Lock, Calendar, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

/**
 * RentalNFT - NFT rental and leasing feature
 * Allows users to rent NFTs or list them for rental
 */
const RentalNFT = () => {
  const [tab, setTab] = useState('browse');
  const [filter, setFilter] = useState('all');

  const rentalListings = [
    { id: 1, name: 'Cyber Punk #123', owner: 'Collector42', price: 0.5, duration: '30 days', roi: '18% APY', listed: '2 hours ago' },
    { id: 2, name: 'Digital Canvas #456', owner: 'ArtLab', price: 0.2, duration: '7 days', roi: '24% APY', listed: '5 hours ago' },
    { id: 3, name: 'Genesis #001', owner: 'Creator99', price: 1.5, duration: '90 days', roi: '15% APY', listed: '1 day ago' },
    { id: 4, name: 'Moon NFT #789', owner: 'SpaceArt', price: 0.8, duration: '14 days', roi: '20% APY', listed: '2 days ago' },
  ];

  const myRentals = [
    { id: 1, name: 'Virtual Land #001', renter: 'User123', endDate: 'Jan 25, 2026', earned: 0.32 },
    { id: 2, name: 'Metaverse Plot #045', renter: 'User456', endDate: 'Jan 20, 2026', earned: 0.15 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {rentalListings.map(rental => (
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
                      <div className="flex items-center">
                        <TrendingUp size={16} className="mr-2 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold">{rental.roi}</span>
                      </div>
                    </div>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded transition">
                      Rent Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                  {myRentals.map(rental => (
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
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">List Your NFT for Rental</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Select NFT</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                    <option>Choose an NFT from your collection</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Daily Rental Price (ETH)</label>
                    <input type="number" placeholder="0.5" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Max Rental Period (days)</label>
                    <input type="number" placeholder="30" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea
                    placeholder="Describe your rental offer..."
                    rows="4"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>

                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold transition">
                  List for Rental
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default RentalNFT;
