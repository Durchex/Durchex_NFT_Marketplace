import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../FooterComponents/Footer";
import { ICOContent } from "../Context";
import { FiArrowRight, FiCheck, FiWallet, FiUsers, FiTrendingUp, FiShield, FiZap, FiLayers } from "react-icons/fi";
import { useContext } from "react";

const Welcome = () => {
  const navigate = useNavigate();
  const { address } = useContext(ICOContent) || {};
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: <FiWallet className="w-8 h-8" />,
      title: "Connect Your Wallet",
      description: "Securely connect your MetaMask, Coinbase Wallet, or other supported wallets to start trading NFTs.",
      step: 1
    },
    {
      icon: <FiLayers className="w-8 h-8" />,
      title: "Choose Your Network",
      description: "Switch between Ethereum, Polygon, BSC, Arbitrum, Tezos, or Hyperliquid. Each network has unique benefits.",
      step: 2
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: "Explore & Discover",
      description: "Browse through thousands of unique NFTs from verified creators. Discover trending collections and rare finds.",
      step: 3
    },
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Create & Sell",
      description: "Mint your own NFTs and list them for sale. Set your prices and royalties to earn from your digital art.",
      step: 4
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Verified Creators",
      description: "Get verified to build trust with collectors. Show your verification badge and gain access to exclusive features.",
      step: 5
    }
  ];

  const networks = [
    {
      name: "Ethereum",
      symbol: "ETH",
      description: "The original blockchain for NFTs. High security and wide adoption.",
      pros: ["Largest ecosystem", "Highest liquidity", "Best security"],
      icon: "🟦"
    },
    {
      name: "Polygon",
      symbol: "MATIC",
      description: "Low fees and fast transactions. Perfect for frequent trading.",
      pros: ["Low gas fees", "Fast transactions", "Ethereum compatible"],
      icon: "🟣"
    },
    {
      name: "BSC",
      symbol: "BNB",
      description: "Binance Smart Chain offers affordable NFT trading.",
      pros: ["Very low fees", "Fast confirmations", "High performance"],
      icon: "🟡"
    },
    {
      name: "Arbitrum",
      symbol: "ARB",
      description: "Layer 2 solution with Ethereum-level security at lower costs.",
      pros: ["Ethereum security", "Lower costs", "Fast processing"],
      icon: "🔵"
    },
    {
      name: "Tezos",
      symbol: "XTZ",
      description: "Self-amending blockchain with low fees and energy efficiency.",
      pros: ["Energy efficient", "Low fees", "Self-upgrading"],
      icon: "🟠"
    },
    {
      name: "Hyperliquid",
      symbol: "HL",
      description: "Next-generation DEX with advanced trading capabilities.",
      pros: ["Advanced features", "High performance", "Innovative tech"],
      icon: "⚡"
    }
  ];

  const steps = [
    {
      title: "Welcome to Durchex",
      subtitle: "Your Gateway to the NFT Marketplace",
      content: (
        <div className="space-y-6">
          <p className="text-lg text-gray-300">
            Durchex is a multi-chain NFT marketplace where creators and collectors come together to buy, sell, and trade digital assets.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <h3 className="font-semibold text-white mb-2">For Creators</h3>
              <p className="text-sm text-gray-400">
                Mint your digital art, create collections, and earn royalties from every sale.
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <h3 className="font-semibold text-white mb-2">For Collectors</h3>
              <p className="text-sm text-gray-400">
                Discover unique NFTs, build your collection, and trade with others.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How It Works",
      subtitle: "Get Started in Minutes",
      content: (
        <div className="space-y-6">
          {features.map((feature, idx) => (
            <div key={idx} className="flex gap-4 items-start bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Supported Networks",
      subtitle: "Choose Your Preferred Blockchain",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 mb-6">
            Durchex supports multiple blockchains. Each network has unique advantages:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {networks.map((network, idx) => (
              <div key={idx} className="bg-gray-900/50 p-5 rounded-lg border border-gray-800 hover:border-purple-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{network.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{network.name}</h3>
                    <p className="text-sm text-gray-400">{network.symbol}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-3">{network.description}</p>
                <div className="space-y-1">
                  {network.pros.map((pro, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <FiCheck className="text-green-500" />
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Getting Started",
      subtitle: "Ready to Begin?",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-lg border border-purple-500/30">
            <h3 className="font-semibold text-white mb-4 text-lg">Quick Start Guide</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Connect Your Wallet</h4>
                  <p className="text-sm text-gray-300">
                    Click the "Connect Wallet" button and choose your preferred wallet (MetaMask, Coinbase Wallet, etc.)
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Select a Network</h4>
                  <p className="text-sm text-gray-300">
                    Choose your preferred blockchain from the network dropdown. Start with Polygon for lower fees!
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Explore or Create</h4>
                  <p className="text-sm text-gray-300">
                    Browse NFTs in the Explore section, or go to Studio to create and mint your own NFTs.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {!address && (
            <div className="text-center space-y-4">
              <p className="text-gray-300">Ready to get started?</p>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 mx-auto"
              >
                Connect Wallet & Start
                <FiArrowRight />
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? "w-8 bg-purple-600"
                    : "w-2 bg-gray-700 hover:bg-gray-600"
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-300 bg-clip-text text-transparent">
              {steps[currentStep].title}
            </h1>
            <p className="text-xl text-gray-400">{steps[currentStep].subtitle}</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {steps[currentStep].content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-800">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FiArrowRight className="rotate-180" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
              >
                Next
                <FiArrowRight />
              </button>
            ) : (
              <Link
                to="/"
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
              >
                Get Started
                <FiArrowRight />
              </Link>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <Link
            to="/explore"
            className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-purple-500 transition-all text-center"
          >
            <FiTrendingUp className="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <h3 className="font-semibold mb-2">Explore NFTs</h3>
            <p className="text-sm text-gray-400">Browse our marketplace</p>
          </Link>
          <Link
            to="/studio"
            className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-purple-500 transition-all text-center"
          >
            <FiZap className="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <h3 className="font-semibold mb-2">Create NFTs</h3>
            <p className="text-sm text-gray-400">Start minting today</p>
          </Link>
          <Link
            to="/profile"
            className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-purple-500 transition-all text-center"
          >
            <FiUsers className="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <h3 className="font-semibold mb-2">Your Profile</h3>
            <p className="text-sm text-gray-400">Manage your account</p>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Welcome;

