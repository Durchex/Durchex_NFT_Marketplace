import React, { useState } from 'react';
import { Vote, TrendingUp, Users, Lock } from 'lucide-react';

/**
 * GovernanceDAO - DAO voting and governance
 */
const GovernanceDAO = () => {
  const [tab, setTab] = useState('proposals');

  const proposals = [
    { id: 1, title: 'Increase Marketplace Fee to 3%', votes: 4523, for: 78, against: 22, status: 'active', ends: '3 days' },
    { id: 2, title: 'Add Solana Network Support', votes: 3421, for: 92, against: 8, status: 'active', ends: '5 days' },
    { id: 3, title: 'Launch Creator Fund', votes: 2891, for: 85, against: 15, status: 'passed', ends: 'passed' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">DAO Governance</h1>
          <p className="text-gray-400">Vote on proposals and shape the marketplace future</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['proposals', 'create'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              {t === 'proposals' ? 'Proposals' : 'Create Proposal'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'proposals' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Your Voting Power</p>
                <p className="text-3xl font-bold">5,234 VOTE</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Voted On</p>
                <p className="text-3xl font-bold">12 proposals</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Rewards</p>
                <p className="text-3xl font-bold text-green-400">2.5 ETH</p>
              </div>
            </div>

            <div className="space-y-4">
              {proposals.map(prop => (
                <div key={prop.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold mb-2">{prop.title}</h3>
                      <p className="text-sm text-gray-400">{prop.votes.toLocaleString()} votes • {prop.ends}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      prop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {prop.status.charAt(0).toUpperCase() + prop.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex gap-8 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">For</span>
                        <span className="text-sm font-semibold">{prop.for}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${prop.for}%` }}></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Against</span>
                        <span className="text-sm font-semibold">{prop.against}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${prop.against}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {prop.status === 'active' && (
                    <div className="flex gap-3">
                      <button className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-semibold transition">
                        Vote For
                      </button>
                      <button className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-semibold transition">
                        Vote Against
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'create' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Create Proposal</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Title</label>
                  <input placeholder="Proposal title..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea rows="6" placeholder="Detailed proposal description..." className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  Create Proposal
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default GovernanceDAO;
