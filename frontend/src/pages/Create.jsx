import React from 'react';
import Header from '../components/Header';
import CreateNFTForm from '../components/CreateNFTForm';

export default function Create() {
  return (
    <div className='min-h-screen w-full bg-black text-white'>
      <Header />
      <main className='flex-1 p-4 sm:p-8'>
        <div className='max-w-6xl mx-auto'>
          <CreateNFTForm />
        </div>
      </main>
    </div>
  );
}
