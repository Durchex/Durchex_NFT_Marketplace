import React, { useState } from 'react';
import { Upload, FileJson, Check } from 'lucide-react';

/**
 * BatchMintNFT - Batch minting multiple NFTs at once
 */
const BatchMintNFT = () => {
  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Batch Mint NFTs</h1>
          <p className="text-gray-400">Mint multiple NFTs at once to save time and gas costs</p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step ? 'bg-purple-600' : 'bg-gray-700'
                }`}>
                  {s}
                </div>
                <p className="text-sm mt-2">{['Upload CSV', 'Review', 'Mint'][s-1]}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Upload NFT Data</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Collection</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white">
                      <option>Select collection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Import Method</label>
                    <div className="space-y-3">
                      <label className="flex items-center bg-gray-700 p-3 rounded cursor-pointer">
                        <input type="radio" name="method" defaultChecked className="mr-3" />
                        <span>CSV File</span>
                      </label>
                      <label className="flex items-center bg-gray-700 p-3 rounded cursor-pointer">
                        <input type="radio" name="method" className="mr-3" />
                        <span>JSON File</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition cursor-pointer">
                    <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                    <p className="font-semibold mb-1">Drop file here</p>
                    <p className="text-sm text-gray-400">or click to select CSV/JSON</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-3">CSV Format (example):</p>
                    <code className="text-xs bg-black p-3 rounded block overflow-auto">
                      name,description,price,image_url
                      <br />
                      "NFT #1","First NFT",1.5,ipfs://...
                      <br />
                      "NFT #2","Second NFT",2.0,ipfs://...
                    </code>
                  </div>

                  <button onClick={() => setStep(2)} className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Review & Confirm</h2>
                <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600 mb-6">
                  <p className="font-semibold mb-4">Upload Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Collection</span>
                      <span>Cyber Punks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total NFTs</span>
                      <span className="text-cyan-400 font-semibold">50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Price</span>
                      <span>2.5 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Value</span>
                      <span className="text-green-400 font-semibold">125 ETH</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600 mb-6 max-h-64 overflow-y-auto">
                  <p className="font-semibold mb-4">Preview (first 5)</p>
                  <div className="space-y-2 text-sm">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex justify-between">
                        <span>NFT #{i}</span>
                        <span className="text-gray-400">2.5 ETH</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded font-semibold">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold">
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Batch Mint</h2>
                <div className="space-y-6">
                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                    <p className="text-blue-400 font-semibold mb-2">ℹ️ Optimized Gas Cost</p>
                    <p className="text-sm text-blue-300">
                      Batching 50 NFTs will save approximately 40% in gas fees compared to individual mints.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center p-3 bg-gray-700 rounded">
                      <input type="checkbox" defaultChecked className="mr-3" />
                      <span className="text-sm">I confirm all NFT data is accurate</span>
                    </label>
                  </div>

                  <button className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold">
                    <Check size={18} className="inline mr-2" />
                    Start Batch Mint
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

export default BatchMintNFT;
