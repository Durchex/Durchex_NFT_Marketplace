import React from 'react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { Gamepad2, Lock } from 'lucide-react';

/**
 * Games Page - Placeholder for future games integration
 */
const Games = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="p-6 bg-purple-600/20 border border-purple-600/50 rounded-full">
              <Gamepad2 size={48} className="text-purple-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-2">Games</h1>

          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Lock size={18} className="text-amber-400" />
            <span className="text-lg font-semibold text-amber-400">Coming Soon</span>
          </div>

          {/* Description */}
          <p className="text-gray-400 max-w-md mb-8">
            We're working on bringing you an exciting collection of NFT-integrated games. 
            This feature will be available soon!
          </p>

          {/* CTA */}
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">
            Notify Me When Ready
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Games;
