import React from 'react';
import Header from '../components/Header';
import LazyMintNFTForm from '../components/LazyMintNFT';

/**
 * LazyMintNFT - Lazy minting page with signature verification
 * Wraps the functional component with Header for global display
 */
const LazyMintNFT = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <section className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Lazy Mint NFTs</h1>
            <p className="text-gray-400">Mint NFTs only when purchased - save gas fees upfront</p>
          </section>
          <LazyMintNFTForm />
        </div>
      </main>
    </div>
  );
};

export default LazyMintNFT;
