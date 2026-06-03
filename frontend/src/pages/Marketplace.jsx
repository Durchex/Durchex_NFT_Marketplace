/**
 * Marketplace — full-browse with sidebar filters, sort, grid/list toggle.
 * Orbital design system.
 */
import { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, Filter, Grid3x3, List, ChevronDown, ChevronUp,
  X, Sliders, LayoutGrid, Layers, Tag, TrendingUp, Clock,
  ArrowUpDown, RefreshCw,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import NFTCard, { NFTCardSkeleton } from '../components/NFTCard';
import { nftAPI } from '../services/api';
import { ICOContent } from '../Context';

/* ─── Network options ─── */
const NETWORKS = [
  { id: 'all',       label: 'All Chains' },
  { id: 'base',      label: 'Base'       },
  { id: 'ethereum',  label: 'Ethereum'   },
  { id: 'polygon',   label: 'Polygon'    },
  { id: 'arbitrum',  label: 'Arbitrum'   },
  { id: 'bsc',       label: 'BSC'        },
  { id: 'optimism',  label: 'Optimism'   },
];

const CATEGORIES = ['All', 'Art', 'Music', 'Gaming', 'Collectibles', 'Photography', 'Sports'];

const SORT_OPTIONS = [
  { id: 'newest',    label: 'Newest First'    },
  { id: 'oldest',    label: 'Oldest First'    },
  { id: 'price-asc', label: 'Price: Low → High'},
  { id: 'price-desc',label: 'Price: High → Low'},
];

function normalizePrice(p) {
  if (!p) return 0;
  const n = parseFloat(p);
  return n > 1e9 ? n / 1e18 : n;
}

function sortNfts(list, sort) {
  return [...list].sort((a, b) => {
    if (sort === 'newest')    return new Date(b.createdAt||0) - new Date(a.createdAt||0);
    if (sort === 'oldest')    return new Date(a.createdAt||0) - new Date(b.createdAt||0);
    if (sort === 'price-asc') return normalizePrice(a.price) - normalizePrice(b.price);
    if (sort === 'price-desc')return normalizePrice(b.price) - normalizePrice(a.price);
    return 0;
  });
}

/* ─── Collapsible filter section ─── */
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:mb-0">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold
                   text-ink-200 hover:text-ink-100 transition-colors">
        {title}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allNfts,    setAllNfts]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [viewMode,   setViewMode]   = useState('grid'); // grid | list
  const [sidebarOpen,setSidebarOpen]= useState(true);
  const [sortBy,     setSortBy]     = useState('newest');
  const [sortOpen,   setSortOpen]   = useState(false);

  /* Filters */
  const [network,    setNetwork]    = useState('all');
  const [category,   setCategory]   = useState('All');
  const [search,     setSearch]     = useState(searchParams.get('q') || '');
  const [minPrice,   setMinPrice]   = useState('');
  const [maxPrice,   setMaxPrice]   = useState('');
  const [showLazy,   setShowLazy]   = useState(true);
  const [showListed, setShowListed] = useState(true);

  /* ── Load data ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await nftAPI.getAllNftsAllNetworksForExplore(500);
      setAllNfts(Array.isArray(data) ? data : []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Apply filters ── */
  const filtered = sortNfts(
    allNfts.filter(n => {
      if (network !== 'all' && String(n.network || '').toLowerCase() !== network) return false;
      if (category !== 'All' && String(n.category || '').toLowerCase() !== category.toLowerCase()) return false;
      const q = search.toLowerCase();
      if (q && !(n.name||'').toLowerCase().includes(q) && !(n.collection||'').toLowerCase().includes(q)) return false;
      if (!showLazy && n.isLazyMint) return false;
      if (!showListed && !n.isLazyMint && !n.currentlyListed) return false;
      const p = normalizePrice(n.price);
      if (minPrice && p < parseFloat(minPrice)) return false;
      if (maxPrice && p > parseFloat(maxPrice)) return false;
      return true;
    }),
    sortBy
  );

  const activeFilterCount = [
    network !== 'all', category !== 'All', search,
    minPrice, maxPrice, !showLazy, !showListed,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setNetwork('all'); setCategory('All'); setSearch('');
    setMinPrice(''); setMaxPrice('');
    setShowLazy(true); setShowListed(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-void)' }}>
      <Header />

      {/* ── Page header ── */}
      <div className="page-container pt-8 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="section-label mb-1.5">Browse</p>
            <h1 className="section-title">Marketplace</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <span>{loading ? '…' : filtered.length.toLocaleString()}</span>
            <span>results</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="ml-2 flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                <X size={12} /> Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-container pb-20 flex gap-6 min-h-0">

        {/* ═════ FILTER SIDEBAR ═════ */}
        {sidebarOpen && (
          <aside className="hidden md:block w-60 shrink-0">
            <div className="card p-5 sticky top-28">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                  <Sliders size={15} className="text-cyan-400" /> Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters}
                    className="text-xs text-cyan-400 hover:text-cyan-300">
                    Clear all
                  </button>
                )}
              </div>

              {/* Status */}
              <FilterSection title="Status">
                <div className="space-y-2">
                  {[
                    { label: 'Listed',    state: showListed,  set: setShowListed },
                    { label: 'Lazy Mint', state: showLazy,    set: setShowLazy },
                  ].map(({ label, state, set }) => (
                    <label key={label}
                      className="flex items-center gap-2.5 cursor-pointer group">
                      <div onClick={() => set(p => !p)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                          ${state
                            ? 'bg-cyan-400 border-cyan-400'
                            : 'border-border bg-raised group-hover:border-cyan-400/50'}`}>
                        {state && <div className="w-2 h-2 bg-void rounded-sm" />}
                      </div>
                      <span className="text-sm text-ink-200">{label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Network */}
              <FilterSection title="Network">
                <div className="space-y-1">
                  {NETWORKS.map(n => (
                    <button key={n.id}
                      onClick={() => setNetwork(n.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all
                        ${network === n.id
                          ? 'bg-cyan-400/10 text-cyan-400 font-medium'
                          : 'text-ink-300 hover:bg-raised hover:text-ink-100'}`}>
                      {n.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Category */}
              <FilterSection title="Category">
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat}
                      onClick={() => setCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all
                        ${category === cat
                          ? 'bg-cyan-400/10 text-cyan-400 font-medium'
                          : 'text-ink-300 hover:bg-raised hover:text-ink-100'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Price range */}
              <FilterSection title="Price Range (ETH)" defaultOpen={false}>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Min"
                    value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    className="input text-sm py-2 px-3"
                  />
                  <input
                    type="number" placeholder="Max"
                    value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    className="input text-sm py-2 px-3"
                  />
                </div>
              </FilterSection>
            </div>
          </aside>
        )}

        {/* ═════ MAIN CONTENT ═════ */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {/* Sidebar toggle */}
            <button onClick={() => setSidebarOpen(p => !p)}
              className={`btn-icon hidden md:flex gap-2 transition-all
                ${sidebarOpen ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' : 'text-ink-400'}`}
              style={{ width: 'auto', padding: '0 12px' }}>
              <Filter size={15} />
              <span className="text-sm">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full text-xs font-bold text-void flex items-center justify-center"
                  style={{ background: 'var(--g-orbital)' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Search */}
            <div className="flex-1 relative min-w-48">
              <Search size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or collection…"
                className="input pl-9 h-10 text-sm w-full"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-300">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button onClick={() => setSortOpen(p => !p)}
                className="btn-secondary h-10 gap-2 text-sm px-4">
                <ArrowUpDown size={14} />
                <span className="hidden sm:inline">
                  {SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Sort'}
                </span>
                <ChevronDown size={12} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 card-glass z-10 py-1">
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.id}
                      onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${sortBy === opt.id
                          ? 'text-cyan-400 bg-cyan-400/10'
                          : 'text-ink-300 hover:bg-raised hover:text-ink-100'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View mode */}
            <div className="flex items-center gap-1 bg-raised rounded-xl p-1 border border-border">
              <button onClick={() => setViewMode('grid')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${viewMode === 'grid' ? 'bg-surface text-cyan-400' : 'text-ink-600 hover:text-ink-300'}`}>
                <LayoutGrid size={15} />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${viewMode === 'list' ? 'bg-surface text-cyan-400' : 'text-ink-600 hover:text-ink-300'}`}>
                <List size={15} />
              </button>
            </div>

            {/* Refresh */}
            <button onClick={load} disabled={loading}
              className="btn-icon text-ink-400 hover:text-ink-100 disabled:opacity-50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Grid / List */}
          {loading ? (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-2'}>
              {Array.from({ length: 12 }).map((_, i) => (
                <NFTCardSkeleton key={i} variant={viewMode === 'list' ? 'compact' : 'default'} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <Layers size={52} className="text-ink-600 mx-auto mb-4" />
              <p className="text-ink-300 text-lg font-medium mb-2">No NFTs found</p>
              <p className="text-ink-500 text-sm mb-6">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-secondary gap-2">
                <X size={15} /> Clear all filters
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {filtered.map((nft, i) => (
                <NFTCard key={nft.itemId || nft._id || i} nft={nft} variant="compact" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((nft, i) => (
                <NFTCard key={nft.itemId || nft._id || i} nft={nft} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
