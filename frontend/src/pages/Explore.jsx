import React from 'react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import FeaturedNFTShowcase from '../components/Hero/FeaturedNFTShowcase';
import TopCreators from '../components/TopCreators/TopCreators';
import RealTimeDataTable from '../components/RealTimeData/RealTimeDataTable';
import TopNFTsCarousel from '../components/TopNFTs/TopNFTsCarousel';
import ExploreNFTsGrid from '../components/ExploreNFTs/ExploreNFTsGrid';
import LiveAuctions from '../components/LiveAuctions/LiveAuctions';

/**
 * Explore - Main landing/discovery page with all sections
 * Displays featured NFTs, top creators, market data, auctions, and more
 */
const Explore = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header />

      {/* Main Content - Responsive padding */}
      <main className="flex-1 w-full overflow-x-hidden px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-12">
          {/* Section 1: Featured NFT Showcase */}
          <FeaturedNFTShowcase />

          {/* Section 2: Top Creators */}
          <TopCreators />

          {/* Section 3: Real-Time Market Data */}
          <RealTimeDataTable />

          {/* Section 4: Top NFTs Carousel */}
          <TopNFTsCarousel />

          {/* Section 5: Explore NFTs Grid with Tabs */}
          <ExploreNFTsGrid />

          {/* Section 6: Live Auctions */}
          <LiveAuctions />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Explore;
