import React, { useState } from 'react';
import { TrendingUp, Lock, Gift } from 'lucide-react';

/**
 * Staking - NFT and token staking with rewards
 */
const Staking = () => {
  const [tab, setTab] = useState('stake');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Staking & Rewards</h1>
          <p className="text-gray-400">Stake NFTs or tokens to earn passive rewards</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['stake', 'my', 'rewards'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              {t === 'stake' ? 'Stake NFTs' : t === 'my' ? 'My Stakes' : 'Rewards'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'stake' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Stake Your NFTs</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Select NFT to Stake</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                    <option>Choose an NFT from your collection</option>
                  </select>
                </div>
                <div className="bg-blue-900/30 border border-blue-700 rounded p-4">
                  <p className="text-sm text-blue-300">
                    <TrendingUp size={16} className="inline mr-2" />
                    Estimated APY: 15-25% depending on NFT rarity
                  </p>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" defaultChecked />
                    <span className="text-sm">I agree to lock this NFT for rewards</span>
                  </label>
                </div>
                <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  <Lock size={18} className="inline mr-2" />
                  Stake NFT
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {tab === 'my' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Staked</p>
                <p className="text-3xl font-bold">2</p>
                <p className="text-xs text-gray-400 mt-1">NFTs</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Earned This Month</p>
                <p className="text-3xl font-bold text-green-400">1.25 ETH</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Average APY</p>
                <p className="text-3xl font-bold text-yellow-400">18.5%</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700 bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left">NFT</th>
                    <th className="px-6 py-3 text-left">Staked</th>
                    <th className="px-6 py-3 text-left">Earned</th>
                    <th className="px-6 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nft: 'Cyber Punk #123', staked: '20 days', earned: '0.75 ETH' },
                    { nft: 'Digital Canvas #456', staked: '10 days', earned: '0.50 ETH' },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="px-6 py-3">{row.nft}</td>
                      <td className="px-6 py-3">{row.staked}</td>
                      <td className="px-6 py-3 text-green-400">{row.earned}</td>
                      <td className="px-6 py-3">
                        <button className="text-purple-400 hover:text-purple-300">Unstake</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === 'rewards' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <Gift size={48} className="mx-auto mb-4 text-yellow-400" />
              <h2 className="text-3xl font-bold mb-2">0.0 ETH</h2>
              <p className="text-gray-400 mb-6">Pending Rewards</p>
              <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold">
                Claim Rewards
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Staking;
