import React, { useState } from 'react';
import { Plus, DollarSign, Users, TrendingUp } from 'lucide-react';

/**
 * AdvancedTrading - Advanced trading and offers
 */
const AdvancedTrading = () => {
  const [tab, setTab] = useState('offers');

  const offers = [
    { id: 1, nft: 'Cyber Punk #123', from: 'Collector42', price: 5.5, expires: '2 days', status: 'pending' },
    { id: 2, nft: 'Digital Canvas #456', from: 'ArtLab', price: 0.75, expires: '5 days', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Advanced Trading</h1>
          <p className="text-gray-400">Make and accept offers, negotiate directly</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['offers', 'history', 'create'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {tab === 'offers' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700 bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left">NFT</th>
                    <th className="px-6 py-3 text-left">From</th>
                    <th className="px-6 py-3 text-left">Price</th>
                    <th className="px-6 py-3 text-left">Expires</th>
                    <th className="px-6 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map(offer => (
                    <tr key={offer.id} className="border-b border-gray-700">
                      <td className="px-6 py-3">{offer.nft}</td>
                      <td className="px-6 py-3">{offer.from}</td>
                      <td className="px-6 py-3">{offer.price} ETH</td>
                      <td className="px-6 py-3">{offer.expires}</td>
                      <td className="px-6 py-3 space-x-2">
                        <button className="text-green-400 hover:text-green-300">Accept</button>
                        <button className="text-red-400 hover:text-red-300">Decline</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === 'create' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Make an Offer</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">NFT Address</label>
                  <input placeholder="0x..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Offer (ETH)</label>
                  <input type="number" placeholder="2.5" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2" />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  Submit Offer
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdvancedTrading;
