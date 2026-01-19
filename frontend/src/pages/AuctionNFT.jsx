import React, { useState } from 'react';
import { Clock, DollarSign, Users } from 'lucide-react';

/**
 * AuctionNFT - NFT auctions feature
 */
const AuctionNFT = () => {
  const [tab, setTab] = useState('browse');

  const auctions = [
    { id: 1, nft: 'Cyber Punk #123', creator: 'ArtLab', current: 3.5, bids: 12, ends: '2 hours', floor: 2.5 },
    { id: 2, nft: 'Digital Canvas #456', creator: 'Creator99', current: 1.2, bids: 5, ends: '5 hours', floor: 0.8 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">NFT Auctions</h1>
          <p className="text-gray-400">Bid on exclusive NFTs in timed auctions</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex gap-4">
          {['browse', 'create'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              {t === 'browse' ? 'Browse Auctions' : 'Create Auction'}
            </button>
          ))}
        </div>
      </section>

      {tab === 'browse' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map(auction => (
              <div key={auction.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-blue-600 to-cyan-600"></div>
                <div className="p-4">
                  <p className="text-xs text-gray-400">{auction.creator}</p>
                  <h3 className="font-bold mb-3">{auction.nft}</h3>
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span>Current Bid</span>
                      <span className="text-yellow-400 font-semibold">{auction.current} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bids</span>
                      <span>{auction.bids}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ends in</span>
                      <span className="text-red-400">{auction.ends}</span>
                    </div>
                  </div>
                  <button className="w-full bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-semibold transition">
                    Place Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'create' && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6">Create Auction</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Select NFT</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                    <option>Choose an NFT</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Starting Price (ETH)</label>
                    <input type="number" placeholder="1.0" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Duration (hours)</label>
                    <input type="number" placeholder="24" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  Create Auction
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AuctionNFT;
