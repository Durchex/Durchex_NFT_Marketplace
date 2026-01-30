import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import Header from '../Header';
import Footer from '../../FooterComponents/Footer';
import '../../styles/casino.css';

const colorMap = {
  amber: 'border-amber-500/30 text-amber-400 shadow-amber-500/20',
  emerald: 'border-emerald-500/30 text-emerald-400 shadow-emerald-500/20',
  violet: 'border-violet-500/30 text-violet-400 shadow-violet-500/20',
  red: 'border-red-500/30 text-red-400 shadow-red-500/20',
  cyan: 'border-cyan-500/30 text-cyan-400 shadow-cyan-500/20',
};

export default function CasinoLayout({
  title,
  subtitle,
  icon: Icon,
  themeColor = 'amber',
  children,
  gameBalance,
  maxWidth = 'max-w-5xl',
}) {
  const c = colorMap[themeColor] || colorMap.amber;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 py-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/games" className="flex items-center gap-2 text-gray-300 hover:text-white transition font-medium">
            <ArrowLeft size={20} /> Back to Games
          </Link>
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 border bg-black/40 ${c}`}>
            <Wallet size={20} />
            <span className="text-gray-300 text-sm">Balance</span>
            <span className="text-xl font-bold">${(gameBalance ?? 0).toFixed(2)}</span>
          </div>
        </div>
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                {Icon && <Icon className={themeColor === 'amber' ? 'text-amber-400' : themeColor === 'emerald' ? 'text-emerald-400' : themeColor === 'violet' ? 'text-violet-400' : themeColor === 'red' ? 'text-red-400' : 'text-cyan-400'} size={36} />}
                {title}
              </h1>
            )}
            {subtitle && <p className="text-gray-400">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}
