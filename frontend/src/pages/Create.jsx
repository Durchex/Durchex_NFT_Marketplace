import React, { useState } from 'react';
import Header from '../components/Header';
import CreateNFTForm from '../components/CreateNFTForm';
import CreateCollectionForm from '../components/CreateCollectionForm';

const TABS = [
  { id: 'nft', label: 'Create NFT' },
  { id: 'collection', label: 'Create collection' },
];

export default function Create() {
  const [activeTab, setActiveTab] = useState('nft');

  return (
    <div className='min-h-screen w-full bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white'>
      <Header />
      <main className='flex-1 p-4 sm:p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-wrap gap-2 mb-6 border-b border-gray-800'>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm sm:text-base font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'nft' ? <CreateNFTForm /> : <CreateCollectionForm />}
        </div>
      </main>
    </div>
  );
}
