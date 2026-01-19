import React, { useState } from 'react';
import { DollarSign, TrendingUp, Users, Settings } from 'lucide-react';

/**
 * MonetizationHub - Creator monetization and revenue management
 */
const MonetizationHub = () => {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Creator Monetization</h1>
          <p className="text-gray-400">Manage royalties, revenue splits, and creator streams</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['dashboard', 'royalties', 'splits'].map(t => (
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

      {tab === 'dashboard' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Earned</p>
                <p className="text-3xl font-bold text-green-400">15.34 ETH</p>
                <p className="text-xs text-green-400 mt-1">+2.5 ETH this month</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Royalty Rate</p>
                <p className="text-3xl font-bold">10%</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Collections</p>
                <p className="text-3xl font-bold">5</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Sales</p>
                <p className="text-3xl font-bold">234</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700 bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left">Collection</th>
                    <th className="px-6 py-3 text-left">Royalty Rate</th>
                    <th className="px-6 py-3 text-left">Total Earned</th>
                    <th className="px-6 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { collection: 'Cyber Punks', rate: '10%', earned: '5.2 ETH' },
                    { collection: 'Digital Canvas', rate: '12%', earned: '4.8 ETH' },
                    { collection: 'Virtual Land', rate: '8%', earned: '3.5 ETH' },
                    { collection: 'Genesis NFTs', rate: '15%', earned: '1.94 ETH' },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="px-6 py-3">{row.collection}</td>
                      <td className="px-6 py-3 text-yellow-400">{row.rate}</td>
                      <td className="px-6 py-3 text-green-400">{row.earned}</td>
                      <td className="px-6 py-3">
                        <button className="text-purple-400 hover:text-purple-300">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === 'royalties' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Configure Royalties</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Collection</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                    <option>Select a collection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Royalty Percentage</label>
                  <input type="number" min="0" max="100" placeholder="10" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Recipient Address</label>
                  <input placeholder="0x..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  Update Royalties
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {tab === 'splits' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Revenue Splits</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Co-creator Address</label>
                  <input placeholder="0x..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Split Percentage</label>
                  <input type="number" min="0" max="100" placeholder="50" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  Add Co-creator
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MonetizationHub;
