import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiUsers, FiImage, FiShoppingCart, FiTrendingUp, FiGlobe, FiArrowRight } from 'react-icons/fi';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    // Store role in localStorage for user flow
    localStorage.setItem('userRole', role);
    
    // Navigate to appropriate page based on role
    if (role === 'creator') {
      navigate('/create');
    } else {
      navigate('/');
    }
  };

  const features = [
    {
      icon: FiShield,
      title: 'Secure & Decentralized',
      description: 'Built on blockchain technology for maximum security'
    },
    {
      icon: FiGlobe,
      title: 'Multi-Network Support',
      description: 'Support for Ethereum, Polygon, BSC, and Arbitrum'
    },
    {
      icon: FiTrendingUp,
      title: 'Real-time Analytics',
      description: 'Live market data and trending collections'
    },
    {
      icon: FiUsers,
      title: 'Community Driven',
      description: 'Connect with creators and collectors worldwide'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">Durchex</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors font-display"
          >
            Skip to Marketplace
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Durchex
            </span>
          </h1>
          <p className="text-xl text-gray-300 font-display max-w-3xl mx-auto mb-8">
            The premier NFT marketplace for creators and collectors. 
            Discover, create, and trade unique digital assets on multiple blockchains.
          </p>
        </div>

        {/* Role Selection */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            How would you like to use Durchex?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Creator Option */}
            <div
              onClick={() => handleRoleSelection('creator')}
              className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedRole === 'creator'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiImage className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">I'm a Creator</h3>
                <p className="text-gray-300 font-display mb-6">
                  Create, mint, and sell your unique NFTs. Set your own prices and earn royalties from future sales.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <FiImage className="w-5 h-5 text-green-400" />
                    <span className="font-display">Mint NFTs with custom metadata</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiDollarSign className="w-5 h-5 text-green-400" />
                    <span className="font-display">Set pricing and royalty percentages</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiGlobe className="w-5 h-5 text-green-400" />
                    <span className="font-display">Multi-network deployment</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center space-x-2 text-green-400 font-display">
                  <span>Start Creating</span>
                  <FiArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Collector Option */}
            <div
              onClick={() => handleRoleSelection('collector')}
              className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedRole === 'collector'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiShoppingCart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">I'm a Collector</h3>
                <p className="text-gray-300 font-display mb-6">
                  Discover, buy, and trade NFTs. Build your collection and connect with the community.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <FiShoppingCart className="w-5 h-5 text-purple-400" />
                    <span className="font-display">Browse and purchase NFTs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiTrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="font-display">Track trending collections</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiUsers className="w-5 h-5 text-purple-400" />
                    <span className="font-display">Connect with creators</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center space-x-2 text-purple-400 font-display">
                  <span>Start Collecting</span>
                  <FiArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Why Choose Durchex?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 font-display text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="text-3xl font-display font-bold text-blue-400 mb-2">10K+</div>
              <div className="text-gray-300 font-display">Active Users</div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="text-3xl font-display font-bold text-green-400 mb-2">50K+</div>
              <div className="text-gray-300 font-display">NFTs Minted</div>
            </div>
            <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="text-3xl font-display font-bold text-purple-400 mb-2">1M+</div>
              <div className="text-gray-300 font-display">ETH Volume</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 border-t border-gray-800">
        <div className="text-center text-gray-400 font-display">
          <p>&copy; 2024 Durchex. All rights reserved.</p>
          <p className="mt-2">Built with ❤️ for the NFT community</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
