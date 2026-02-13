import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import FeaturedNFTShowcase from '../components/Hero/FeaturedNFTShowcase';
import TopCreators from '../components/TopCreators/TopCreators';
import RealTimeDataTable from '../components/RealTimeData/RealTimeDataTable';
import TopNFTsCarousel from '../components/TopNFTs/TopNFTsCarousel';
import ExploreNFTsGrid from '../components/ExploreNFTs/ExploreNFTsGrid';
import LiveAuctions from '../components/LiveAuctions/LiveAuctions';
import { nftAPI, analyticsAPI } from '../services/api';

/**
 * Explore - Main landing/discovery page with all sections
 * Displays featured NFTs, top creators, market data, auctions, and more
 */
const Explore = () => {
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const warmCaches = async () => {
      try {
        await Promise.allSettled([
          // Warm NFT and collection caches so hero, explore grid, live auctions, and collections-style
          // components all have instant access when they mount.
          nftAPI.getAllNftsAllNetworksForExplore(500),
          nftAPI.getCollections(),
          // Warm key analytics so RealTimeData loads swiftly.
          analyticsAPI.getMarketplaceStats('24h'),
          analyticsAPI.getVolumeTrends('24h', 'hourly'),
        ]);
      } catch {
        // Ignore – child components already handle empty/failure states gracefully.
      }
    };

    const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));

    Promise.all([warmCaches(), minDelay]).then(() => {
      if (!cancelled) setBootLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden w-full max-w-full">
      <Header />

      {/* Main Content - Mobile optimized padding */}
      <main className="flex-1 w-full overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 md:py-8 lg:py-12 relative">
        {bootLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-300 text-sm">Loading Explore data…</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full min-w-0 space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-12">
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
