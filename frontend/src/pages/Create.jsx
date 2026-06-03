/**
 * Create — Orbital design. Tabs: Create NFT · Upcoming Drop · Collection
 */
import { useState } from 'react';
import { Layers, Zap, FolderPlus, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import CreateNFTForm from '../components/CreateNFTForm';
import CreateCollectionForm from '../components/CreateCollectionForm';
import CreateUpcomingNFTForm from '../components/CreateUpcomingNFTForm';

const TABS = [
  {
    id: 'nft',
    label: 'Create NFT',
    short: 'NFT',
    icon: Layers,
    description: 'Mint a single or multi-edition NFT with lazy minting — no upfront gas.',
  },
  {
    id: 'upcoming',
    label: 'Upcoming Drop',
    short: 'Drop',
    icon: Zap,
    description: 'Set up a whitelist phase + public sale with signed vouchers.',
  },
  {
    id: 'collection',
    label: 'New Collection',
    short: 'Collection',
    icon: FolderPlus,
    description: 'Create a named collection to organise your NFTs.',
  },
];

export default function Create() {
  const [active, setActive] = useState('nft');
  const current = TABS.find(t => t.id === active);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-void)' }}>
      <Header />

      {/* ── Page header ── */}
      <div className="page-container pt-8 sm:pt-12 pb-6">
        <p className="section-label mb-2">Studio</p>
        <h1 className="section-title mb-2">Create</h1>
        <p className="text-ink-400 text-sm max-w-xl">
          Mint NFTs, launch upcoming drops, or set up collections — all on-chain with lazy minting support.
        </p>
      </div>

      {/* ── Mode selector cards (desktop) / tab pills (mobile) ── */}
      <div className="page-container mb-8">
        {/* Desktop: feature cards */}
        <div className="hidden sm:grid grid-cols-3 gap-4">
          {TABS.map(({ id, label, icon: Icon, description }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 group
                  ${isActive
                    ? 'border-violet-500/50 bg-violet-500/10'
                    : 'border-border bg-surface hover:border-violet-500/30 hover:bg-raised'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                  ${isActive ? 'bg-violet-500/20' : 'bg-raised group-hover:bg-violet-500/10'}`}>
                  <Icon size={18} className={isActive ? 'text-violet-400' : 'text-ink-400 group-hover:text-violet-400'} />
                </div>
                <p className={`font-semibold text-sm mb-1 ${isActive ? 'text-violet-300' : 'text-ink-100'}`}>
                  {label}
                </p>
                <p className="text-xs text-ink-500 leading-relaxed">{description}</p>
                {isActive && (
                  <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-violet-400">
                    Active <ChevronRight size={12} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile: pill tabs */}
        <div className="flex sm:hidden gap-1 bg-raised rounded-2xl p-1 border border-border">
          {TABS.map(({ id, short, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                  text-xs font-semibold transition-all duration-200
                  ${isActive
                    ? 'bg-surface text-violet-300 shadow-sm'
                    : 'text-ink-400 hover:text-ink-200'
                  }`}
              >
                <Icon size={13} />
                {short}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="page-container pb-16 flex-1">
        <div className="max-w-3xl">
          {/* Panel header */}
          <div className="flex items-center gap-3 mb-6">
            {current && (
              <>
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                  <current.icon size={16} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink-100">{current.label}</h2>
                  <p className="text-xs text-ink-500">{current.description}</p>
                </div>
              </>
            )}
          </div>

          {/* Forms — backgrounds removed from components, colors updated */}
          <div className="space-y-4">
            {active === 'nft'        && <CreateNFTForm />}
            {active === 'upcoming'   && <CreateUpcomingNFTForm />}
            {active === 'collection' && <CreateCollectionForm />}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
