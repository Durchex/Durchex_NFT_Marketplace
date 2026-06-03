/**
 * Explore — Orbital Homepage / Landing page.
 * Sections: Hero · Stats · Categories · Trending Collections · Top NFTs · Live Feed · Featured Creators
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass, TrendingUp, Zap, ArrowRight, Search,
  Layers, Clock, Users, BarChart2, Star,
  ChevronRight, Activity, Globe, Sparkles,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import NFTCard, { NFTCardSkeleton } from '../components/NFTCard';
import { nftAPI, analyticsAPI } from '../services/api';

/* ─── Category definitions ─── */
const CATEGORIES = [
  { id: 'all',         label: 'All',          icon: Globe },
  { id: 'art',         label: 'Art',           icon: Sparkles },
  { id: 'music',       label: 'Music',         icon: Activity },
  { id: 'gaming',      label: 'Gaming',        icon: Zap },
  { id: 'collectibles',label: 'Collectibles',  icon: Star },
  { id: 'photography', label: 'Photography',   icon: Compass },
  { id: 'sports',      label: 'Sports',        icon: TrendingUp },
];

/* ─── Stat formatter ─── */
function StatCard({ value, label, change, icon: Icon }) {
  const positive = change == null || change >= 0;
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(0,200,255,0.12),rgba(124,58,237,0.12))' }}>
          <Icon size={18} className="text-cyan-400" />
        </div>
        {change != null && (
          <span className={positive ? 'stat-change-up' : 'stat-change-down'}>
            {positive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({ label, title, cta, ctaHref }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <p className="section-label mb-1.5">{label}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {cta && ctaHref && (
        <Link to={ctaHref}
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-cyan-400
                     hover:text-cyan-300 transition-colors">
          {cta} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

/* ─── Collection card ─── */
function CollectionCard({ col, rank }) {
  const img = col.image || col.banner || '';
  return (
    <Link to={`/collection/${col._id || col.collectionId}`}
      className="group flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border
                 hover:border-cyan-400/25 hover:bg-raised transition-all duration-200 cursor-pointer">
      <span className="w-8 text-sm font-bold text-ink-600 text-center shrink-0">{rank}</span>
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-raised shrink-0">
        {img
          ? <img src={img} alt={col.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center">
              <Layers size={20} className="text-ink-600" />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-100 truncate group-hover:text-cyan-400 transition-colors">
          {col.name}
        </p>
        <p className="text-xs text-ink-400 truncate">{col.network || 'Multi-chain'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-ink-100">{col.floorPrice ? `${col.floorPrice} ETH` : '—'}</p>
        {col.volume24h && (
          <p className="text-xs text-emerald-400">Vol: {col.volume24h}</p>
        )}
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function Explore() {
  const navigate = useNavigate();
  const [nfts,       setNfts]       = useState([]);
  const [collections,setCols]       = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState('all');
  const [search,     setSearch]     = useState('');
  const [heroNfts,   setHeroNfts]   = useState([]);

  /* ── Boot data ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allNfts, allCols, mStats] = await Promise.allSettled([
        nftAPI.getAllNftsAllNetworksForExplore(200),
        nftAPI.getCollections(),
        analyticsAPI.getMarketplaceStats?.('24h'),
      ]);

      const nftList = allNfts.value || [];
      const colList = Array.isArray(allCols.value) ? allCols.value : [];
      const statsData = mStats.value;

      setNfts(nftList);
      setCols(colList.slice(0, 10));
      setStats(statsData);
      // Hero: pick up to 3 with images
      setHeroNfts(nftList.filter(n => n.image || n.imageURL).slice(0, 3));
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Filtered NFTs ── */
  const filtered = nfts.filter(n => {
    const matchCat = category === 'all' || String(n.category || '').toLowerCase() === category;
    const q = search.toLowerCase();
    const matchQ = !q || (n.name || '').toLowerCase().includes(q)
                      || (n.collection || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  /* ── Hero section (top 3 NFTs) ── */
  const hero = heroNfts[0];

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-void)' }}>
      <Header />

      {/* ════ HERO ════ */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00c8ff 0%, #7c3aed 50%, transparent 70%)' }} />

        <div className="page-container pt-12 pb-10 md:pt-20 md:pb-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/25
                              bg-cyan-400/5 text-cyan-400 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                The Multi-Chain NFT Marketplace
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight
                             text-ink-100 leading-tight mb-6">
                Discover, Collect &amp;<br />
                <span className="text-gradient">Trade Digital Art</span>
              </h1>

              <p className="text-ink-300 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
                The next-generation marketplace combining the best of OpenSea,
                Rarible and Magic Eden — all chains, one platform.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative mb-8">
                <Search size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search NFTs, collections or creators…"
                  className="input pl-12 pr-36 h-14 text-base rounded-2xl"
                />
                <button type="submit"
                  className="absolute right-2 top-2 btn-primary h-10 px-5">
                  Search
                </button>
              </form>

              <div className="flex items-center gap-4 flex-wrap">
                <Link to="/explore" className="btn-primary btn-lg gap-2">
                  <Compass size={18} /> Explore Market
                </Link>
                <Link to="/create" className="btn-secondary btn-lg gap-2">
                  <Zap size={18} /> Create NFT
                </Link>
              </div>
            </div>

            {/* Right: hero NFT + carousel */}
            <div className="hidden lg:block animate-fade-up" style={{ animationDelay: '0.15s' }}>
              {hero ? (
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute inset-8 blur-3xl opacity-40 rounded-3xl"
                    style={{ background: 'var(--g-orbital)' }} />
                  {/* Main card */}
                  <div className="relative">
                    <NFTCard nft={hero} variant="featured" />
                  </div>
                  {/* Floating mini cards */}
                  {heroNfts[1] && (
                    <div className="absolute -right-8 top-8 w-40 animate-fade-up"
                      style={{ animationDelay: '0.3s' }}>
                      <NFTCard nft={heroNfts[1]} variant="compact" />
                    </div>
                  )}
                  {heroNfts[2] && (
                    <div className="absolute -left-8 bottom-8 w-40 animate-fade-up"
                      style={{ animationDelay: '0.45s' }}>
                      <NFTCard nft={heroNfts[2]} variant="compact" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl bg-raised border border-border animate-pulse"
                  style={{ aspectRatio: '4/5' }} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════ STATS ROW ════ */}
      <section className="page-container pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BarChart2}
            value={stats?.volume24h ? `${Number(stats.volume24h).toLocaleString()} ETH` : '—'}
            label="24h Volume"
            change={stats?.volumeChange24h}
          />
          <StatCard
            icon={Users}
            value={stats?.traders24h ? Number(stats.traders24h).toLocaleString() : '—'}
            label="Active Traders"
            change={stats?.tradersChange24h}
          />
          <StatCard
            icon={Layers}
            value={stats?.totalCollections ? Number(stats.totalCollections).toLocaleString() : (collections.length || '—')}
            label="Collections"
          />
          <StatCard
            icon={TrendingUp}
            value={stats?.totalNfts ? Number(stats.totalNfts).toLocaleString() : (nfts.length || '—')}
            label="Total NFTs"
            change={stats?.nftsChange}
          />
        </div>
      </section>

      <main className="flex-1 page-container pb-20 space-y-14">

        {/* ════ CATEGORIES ════ */}
        <section>
          <div className="scroll-row pb-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`category-pill ${category === cat.id ? 'active' : ''}`}>
                <cat.icon size={15} />
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* ════ TRENDING COLLECTIONS ════ */}
        {collections.length > 0 && (
          <section>
            <SectionHeader
              label="📈 Hot Right Now"
              title="Trending Collections"
              cta="View all"
              ctaHref="/collections"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {collections.map((col, i) => (
                <CollectionCard key={col._id || i} col={col} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* ════ NFT GRID ════ */}
        <section>
          <SectionHeader
            label="🔥 Explore"
            title={category === 'all' ? 'All NFTs' : CATEGORIES.find(c => c.id === category)?.label + ' NFTs'}
            cta="View all"
            ctaHref="/marketplace"
          />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <NFTCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Layers size={48} className="text-ink-600 mx-auto mb-4" />
              <p className="text-ink-400 text-lg">No NFTs found</p>
              {category !== 'all' && (
                <button onClick={() => setCategory('all')}
                  className="btn-secondary mt-4">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.slice(0, 20).map((nft, i) => (
                <NFTCard key={nft.itemId || nft._id || i} nft={nft} />
              ))}
            </div>
          )}

          {filtered.length > 20 && (
            <div className="mt-10 text-center">
              <Link to="/marketplace" className="btn-secondary btn-lg gap-2">
                View all {filtered.length} NFTs <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* ════ LIVE ACTIVITY FEED ════ */}
        <section>
          <SectionHeader
            label="⚡ Live"
            title="Recent Activity"
            cta="Full activity"
            ctaHref="/marketplace"
          />
          <div className="card p-1">
            {nfts.slice(0, 8).map((nft, i) => (
              <div key={nft.itemId || i}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-raised
                           transition-colors border-b border-border/50 last:border-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-raised shrink-0">
                  {(nft.image || nft.imageURL) && (
                    <img src={nft.image || nft.imageURL} alt={nft.name}
                      className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-100 truncate">{nft.name}</p>
                  <p className="text-xs text-ink-400 truncate">
                    {nft.isLazyMint ? '🟣 Lazy Mint' : '🔵 Listed'} ·{' '}
                    {nft.network || 'base'}
                  </p>
                </div>
                {nft.price && (
                  <span className="text-sm font-bold text-ink-100 shrink-0">
                    {parseFloat(nft.price) > 1e9
                      ? (parseFloat(nft.price)/1e18).toFixed(4)
                      : parseFloat(nft.price).toFixed(4)
                    } ETH
                  </span>
                )}
                <span className="badge-cyan text-[10px] shrink-0">New</span>
              </div>
            ))}
          </div>
        </section>

        {/* ════ CTA BANNER ════ */}
        <section className="gradient-border rounded-3xl overflow-hidden">
          <div className="relative p-10 md:p-14 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(0,200,255,0.08), rgba(124,58,237,0.08))' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 30% 50%, rgba(0,200,255,0.1), transparent 60%), radial-gradient(circle at 70% 50%, rgba(124,58,237,0.1), transparent 60%)' }} />
            <h2 className="relative text-3xl md:text-4xl font-extrabold text-ink-100 mb-4">
              Start Creating Today
            </h2>
            <p className="relative text-ink-300 text-lg mb-8 max-w-lg mx-auto">
              Mint your NFTs with zero upfront gas costs using lazy minting.
              Your art on the blockchain in minutes.
            </p>
            <div className="relative flex items-center justify-center gap-4 flex-wrap">
              <Link to="/create" className="btn-primary btn-lg gap-2">
                <Zap size={18} /> Create Free NFT
              </Link>
              <Link to="/features/lazy-mint" className="btn-secondary btn-lg gap-2">
                <Layers size={18} /> Learn Lazy Minting
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
