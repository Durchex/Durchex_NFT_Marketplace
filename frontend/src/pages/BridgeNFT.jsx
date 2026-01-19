import React, { useState } from 'react';

/**
 * BridgeNFT - Cross-chain NFT bridge (will be replaced with Stargate later)
 */
const BridgeNFT = () => {
  const [tab, setTab] = useState('bridge');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Cross-Chain Bridge</h1>
          <p className="text-gray-400">Transfer your NFTs between different blockchain networks</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-6">Bridge NFT</h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">From Network</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                  <option>Ethereum</option>
                  <option>Polygon</option>
                  <option>Arbitrum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">To Network</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                  <option>Polygon</option>
                  <option>Ethereum</option>
                  <option>Arbitrum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Select NFT</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                  <option>Choose an NFT</option>
                </select>
              </div>
              <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                Bridge NFT
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BridgeNFT;
