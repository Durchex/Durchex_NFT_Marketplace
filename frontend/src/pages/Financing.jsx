import React, { useState } from 'react';
import { Lock, DollarSign, Clock, TrendingUp } from 'lucide-react';

/**
 * Financing - Collateral loans and flexible repayment
 */
const Financing = () => {
  const [tab, setTab] = useState('loans');

  const activeLoans = [
    { id: 1, nft: 'Cyber Punk #123', amount: 2.5, collateral: 5.0, borrowed: '15 days ago', expires: '45 days', interest: '8% APY' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Collateral Financing</h1>
          <p className="text-gray-400">Use NFTs as collateral for loans with flexible terms</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['loans', 'new'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              {t === 'loans' ? 'My Loans' : 'Request Loan'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'loans' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Borrowed</p>
                <p className="text-3xl font-bold text-green-400">2.5 ETH</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Collateral Value</p>
                <p className="text-3xl font-bold">5.0 ETH</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Interest Rate</p>
                <p className="text-3xl font-bold text-yellow-400">8% APY</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700 bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left">NFT (Collateral)</th>
                    <th className="px-6 py-3 text-left">Borrowed</th>
                    <th className="px-6 py-3 text-left">Interest</th>
                    <th className="px-6 py-3 text-left">Expires</th>
                    <th className="px-6 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map(loan => (
                    <tr key={loan.id} className="border-b border-gray-700">
                      <td className="px-6 py-3">{loan.nft}</td>
                      <td className="px-6 py-3">{loan.amount} ETH</td>
                      <td className="px-6 py-3">{loan.interest}</td>
                      <td className="px-6 py-3">{loan.expires}</td>
                      <td className="px-6 py-3">
                        <button className="text-purple-400 hover:text-purple-300">Repay</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === 'new' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Request a Loan</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">NFT to Collateralize</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                    <option>Select an NFT from your collection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Loan Amount (ETH)</label>
                  <input type="number" placeholder="1.5" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Loan Duration (days)</label>
                  <input type="number" placeholder="30" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2" />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  Request Loan
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Financing;
