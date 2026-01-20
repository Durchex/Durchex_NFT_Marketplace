import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import FeaturedNFTShowcase from '../components/Hero/FeaturedNFTShowcase';
import TopCreators from '../components/TopCreators/TopCreators';
import RealTimeDataTable from '../components/RealTimeData/RealTimeDataTable';
import TopNFTsCarousel from '../components/TopNFTs/TopNFTsCarousel';
import ExploreNFTsGrid from '../components/ExploreNFTs/ExploreNFTsGrid';
import LiveAuctions from '../components/LiveAuctions/LiveAuctions';

/**
 * Explore DEBUG - Main landing/discovery page with debugging
 */
const ExploreDebug = () => {
  const [componentStates, setComponentStates] = useState({
    featured: 'loading',
    creators: 'loading',
    data: 'loading',
    carousel: 'loading',
    grid: 'loading',
    auctions: 'loading'
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header />

      {/* Debug Panel */}
      <div className="bg-yellow-900/50 border-b border-yellow-700 p-4 text-yellow-100">
        <h3 className="font-bold mb-2">🐛 DEBUG MODE - Explore Page</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div>📌 FeaturedNFT: {componentStates.featured}</div>
          <div>📌 TopCreators: {componentStates.creators}</div>
          <div>📌 RealTimeData: {componentStates.data}</div>
          <div>📌 Carousel: {componentStates.carousel}</div>
          <div>📌 Grid: {componentStates.grid}</div>
          <div>📌 Auctions: {componentStates.auctions}</div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Section 1: Featured NFT Showcase */}
          <div className="border border-blue-500 p-4 rounded mb-4">
            <h3 className="text-blue-400 font-bold text-sm mb-2">Section 1: FeaturedNFTShowcase</h3>
            <ErrorBoundary onError={() => setComponentStates({...componentStates, featured: 'error'})}>
              <FeaturedNFTShowcase />
            </ErrorBoundary>
          </div>

          {/* Section 2: Top Creators */}
          <div className="border border-green-500 p-4 rounded mb-4">
            <h3 className="text-green-400 font-bold text-sm mb-2">Section 2: TopCreators</h3>
            <ErrorBoundary onError={() => setComponentStates({...componentStates, creators: 'error'})}>
              <TopCreators />
            </ErrorBoundary>
          </div>

          {/* Section 3: Real-Time Market Data */}
          <div className="border border-purple-500 p-4 rounded mb-4">
            <h3 className="text-purple-400 font-bold text-sm mb-2">Section 3: RealTimeDataTable</h3>
            <ErrorBoundary onError={() => setComponentStates({...componentStates, data: 'error'})}>
              <RealTimeDataTable />
            </ErrorBoundary>
          </div>

          {/* Section 4: Top NFTs Carousel */}
          <div className="border border-yellow-500 p-4 rounded mb-4">
            <h3 className="text-yellow-400 font-bold text-sm mb-2">Section 4: TopNFTsCarousel</h3>
            <ErrorBoundary onError={() => setComponentStates({...componentStates, carousel: 'error'})}>
              <TopNFTsCarousel />
            </ErrorBoundary>
          </div>

          {/* Section 5: Explore NFTs Grid with Tabs */}
          <div className="border border-pink-500 p-4 rounded mb-4">
            <h3 className="text-pink-400 font-bold text-sm mb-2">Section 5: ExploreNFTsGrid</h3>
            <ErrorBoundary onError={() => setComponentStates({...componentStates, grid: 'error'})}>
              <ExploreNFTsGrid />
            </ErrorBoundary>
          </div>

          {/* Section 6: Live Auctions */}
          <div className="border border-red-500 p-4 rounded mb-4">
            <h3 className="text-red-400 font-bold text-sm mb-2">Section 6: LiveAuctions</h3>
            <ErrorBoundary onError={() => setComponentStates({...componentStates, auctions: 'error'})}>
              <LiveAuctions />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/30 border border-red-600 p-4 rounded text-red-300 text-sm">
          <strong>Error:</strong> {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ExploreDebug;
