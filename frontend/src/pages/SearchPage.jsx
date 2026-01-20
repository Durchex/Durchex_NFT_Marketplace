import React from 'react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import SearchUI from '../components/Search/SearchUI';

/**
 * SearchPage - Dedicated advanced search interface
 * Uses the SearchUI component to provide full-featured NFT discovery
 */
const SearchPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      
      <main className="flex-1">
        <SearchUI />
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchPage;
