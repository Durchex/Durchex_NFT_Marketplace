import React, { useState } from 'react';
import { Wind, FileText, Key } from 'lucide-react';

/**
 * LazyMintNFT - Lazy minting with signature verification
 */
const LazyMintNFT = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Lazy Mint NFTs</h1>
          <p className="text-gray-400">Mint NFTs only when purchased - save gas fees upfront</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step ? 'bg-purple-600' : 'bg-gray-700'
                }`}>
                  {s}
                </div>
                <p className="text-sm mt-2">{['Create', 'Sign', 'List'][s-1]}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Create Lazy Mint</h2>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Collection</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                      <option>Select collection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Name</label>
                    <input placeholder="NFT Name" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Description</label>
                    <textarea placeholder="Description..." rows="4" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Price (ETH)</label>
                    <input type="number" placeholder="1.0" className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white" />
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                    Continue
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Sign Metadata</h2>
                <div className="bg-gray-700/30 rounded p-4 mb-6 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-3">Sign this message with your wallet to authorize the lazy mint:</p>
                  <code className="text-xs bg-black p-3 rounded block overflow-auto">
                    Lazy Mint: NFT #1 for 1.0 ETH | Created: Jan 2026
                  </code>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold mb-4">
                  <Key size={18} className="inline mr-2" />
                  Sign with Wallet
                </button>
                <button type="button" onClick={() => setStep(3)} className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                  Continue
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold mb-6">List for Sale</h2>
                <div className="space-y-6">
                  <div className="bg-green-900/30 border border-green-700 rounded p-4">
                    <p className="text-green-400 font-semibold mb-2">✓ Lazy Mint Authorized</p>
                    <p className="text-sm text-green-300">Your NFT is ready to be listed. It will mint only when someone purchases it.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Listing Type</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                      <option>Fixed Price</option>
                      <option>Auction</option>
                    </select>
                  </div>
                  <button className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold">
                    List NFT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LazyMintNFT;
