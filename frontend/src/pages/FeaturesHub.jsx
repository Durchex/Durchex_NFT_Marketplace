import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Zap,
  TrendingUp,
  Users,
  Lock,
  Coins,
  Gift,
  Layers,
  Wind,
  AlertCircle,
  ArrowRight,
  Check
} from 'lucide-react';

/**
 * FeaturesHub - Central discovery page for all marketplace features
 * Shows all available features with descriptions and quick access links
 */
const FeaturesHub = () => {
  const navigate = useNavigate();
  const { account } = useWallet();
  const [activeCategory, setActiveCategory] = useState('all');

  const features = [
    {
      category: 'trading',
      title: 'Advanced Trading',
      description: 'Make and accept offers, negotiate prices, and trade NFTs directly',
      icon: TrendingUp,
      color: 'blue',
      route: '/trading/advanced',
      status: 'live',
      tags: ['Offers', 'Negotiations', 'Direct Sales']
    },
    {
      category: 'auctions',
      title: 'NFT Auctions',
      description: 'Create and participate in time-based auctions for your NFTs',
      icon: Zap,
      color: 'orange',
      route: '/nft/auction',
      status: 'live',
      tags: ['Bidding', 'Time-locked', 'Premium']
    },
    {
      category: 'minting',
      title: 'Lazy Minting',
      description: 'Mint NFTs only when purchased - save gas fees upfront',
      icon: Wind,
      color: 'purple',
      route: '/nft/lazy-mint',
      status: 'live',
      tags: ['Gas Efficient', 'Signature Based', 'Creator Friendly']
    },
    {
      category: 'minting',
      title: 'Batch Minting',
      description: 'Mint multiple NFTs at once to save time and gas costs',
      icon: Layers,
      color: 'green',
      route: '/nft/batch-mint',
      status: 'live',
      tags: ['Bulk Upload', 'CSV Import', 'Optimized Gas']
    },
    {
      category: 'rental',
      title: 'NFT Rental',
      description: 'Rent your NFTs to earn yield or use rented NFTs temporarily',
      icon: Lock,
      color: 'pink',
      route: '/features/rental',
      status: 'active',
      tags: ['Time-locked', 'Rental Period', 'Yield']
    },
    {
      category: 'finance',
      title: 'Collateral Financing',
      description: 'Use your NFTs as collateral for loans with flexible repayment',
      icon: Coins,
      color: 'yellow',
      route: '/features/financing',
      status: 'active',
      tags: ['Loans', 'DeFi', 'Flexible Terms']
    },
    {
      category: 'finance',
      title: 'Staking & Rewards',
      description: 'Stake NFTs or governance tokens to earn passive rewards',
      icon: Gift,
      color: 'indigo',
      route: '/features/staking',
      status: 'active',
      tags: ['APY', 'Passive Income', 'Rewards']
    },
    {
      category: 'governance',
      title: 'DAO Governance',
      description: 'Vote on proposals and shape the future of the marketplace',
      icon: Users,
      color: 'teal',
      route: '/features/governance',
      status: 'active',
      tags: ['Voting', 'Proposals', 'Community']
    },
    {
      category: 'creator',
      title: 'Creator Monetization',
      description: 'Set royalties, split revenue, and manage creator streams',
      icon: Star,
      color: 'rose',
      route: '/features/monetization',
      status: 'active',
      tags: ['Royalties', 'Revenue Split', 'Payouts']
    },
    {
      category: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Track sales, volume, trends, and your portfolio performance',
      icon: TrendingUp,
      color: 'cyan',
      route: '/analytics/dashboard',
      status: 'live',
      tags: ['Charts', 'Trends', 'Portfolio']
    },
    {
      category: 'bridge',
      title: 'Cross-Chain Bridge',
      description: 'Transfer NFTs between different blockchain networks',
      icon: Layers,
      color: 'violet',
      route: '/features/bridge',
      status: 'beta',
      tags: ['Multi-chain', 'Ethereum', 'Polygon']
    },
    {
      category: 'social',
      title: 'Social & Recommendations',
      description: 'Connect with creators, get personalized NFT recommendations',
      icon: Users,
      color: 'amber',
      route: '/features/social',
      status: 'active',
      tags: ['Community', 'Discovery', 'Social']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Features', count: features.length },
    { id: 'trading', label: 'Trading', count: features.filter(f => f.category === 'trading').length },
    { id: 'auctions', label: 'Auctions & Minting', count: 3 },
    { id: 'rental', label: 'Rental', count: 1 },
    { id: 'finance', label: 'Finance', count: 3 },
    { id: 'governance', label: 'Governance', count: 1 },
    { id: 'creator', label: 'Creator Tools', count: 1 },
    { id: 'analytics', label: 'Analytics', count: 1 },
  ];

  const filteredFeatures = activeCategory === 'all'
    ? features
    : features.filter(f => f.category === activeCategory || 
        (activeCategory === 'auctions' && (f.category === 'auctions' || f.title.includes('Batch'))) ||
        (activeCategory === 'finance' && f.category === 'finance')
      );

  const getIconComponent = (IconComponent) => IconComponent;

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      pink: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
      yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
      indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
      teal: 'bg-teal-100 text-teal-600 hover:bg-teal-200',
      rose: 'bg-rose-100 text-rose-600 hover:bg-rose-200',
      cyan: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200',
      violet: 'bg-violet-100 text-violet-600 hover:bg-violet-200',
      amber: 'bg-amber-100 text-amber-600 hover:bg-amber-200',
    };
    return colors[color] || colors.blue;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-700';
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'beta':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            Discover All Features
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Explore the complete Durchex marketplace ecosystem. From advanced trading to creator tools,
            find everything you need to buy, sell, and manage your NFTs.
          </p>
          {!account && (
            <button
              onClick={() => navigate('/signin')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
            >
              Connect Wallet
              <ArrowRight className="ml-2" size={20} />
            </button>
          )}
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full transition ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                {cat.label}
                <span className="ml-2 text-sm opacity-75">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((feature, idx) => {
              const IconComponent = getIconComponent(feature.icon);
              return (
                <Link
                  key={idx}
                  to={feature.route}
                  className="group relative bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-500 transition-all p-6 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* Status Badge */}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(feature.status)}`}>
                    {feature.status === 'live' && <Check size={14} className="inline mr-1" />}
                    {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg ${getColorClasses(feature.color)} flex items-center justify-center mb-4 transition`}>
                    <IconComponent size={24} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {feature.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {feature.tags.slice(0, 2).map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center text-purple-400 group-hover:translate-x-2 transition">
                    <span className="text-sm font-semibold">Explore</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
              <AlertCircle size={24} className="text-amber-400 mb-3" />
              <h3 className="font-bold mb-2">Enhanced Trading Pools</h3>
              <p className="text-gray-300 text-sm">
                Liquidity pools for NFT trading with automatic market makers
              </p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
              <AlertCircle size={24} className="text-amber-400 mb-3" />
              <h3 className="font-bold mb-2">Multi-Network Support</h3>
              <p className="text-gray-300 text-sm">
                Full support for additional chains including Solana and Tezos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-4">
                <span className="font-bold">1</span>
              </div>
              <h3 className="font-bold mb-2">Connect Wallet</h3>
              <p className="text-gray-400 text-sm">
                Connect your Web3 wallet to access the marketplace
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-4">
                <span className="font-bold">2</span>
              </div>
              <h3 className="font-bold mb-2">Choose a Feature</h3>
              <p className="text-gray-400 text-sm">
                Select a feature above based on your needs
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-4">
                <span className="font-bold">3</span>
              </div>
              <h3 className="font-bold mb-2">Start Trading</h3>
              <p className="text-gray-400 text-sm">
                Begin buying, selling, or managing your NFTs
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesHub;
