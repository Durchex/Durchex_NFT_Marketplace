/**
 * Collections page — Orbital design system.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Grid3x3, List, TrendingUp, Layers, Users,
  BarChart2, ArrowUpDown, RefreshCw, ChevronDown, X,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { nftAPI } from '../services/api';

const NETWORKS = ['All', 'Base', 'Ethereum', 'Polygon', 'Arbitrum', 'BSC'];
const SORT_OPTIONS = [
  { id: 'volume',    label: 'Volume'       },
  { id: 'floor',     label: 'Floor Price'  },
  { id: 'items',     label: 'Items'        },
  { id: 'newest',    label: 'Newest'       },
  { id: 'name',      label: 'Name A–Z'     },
];

function CollectionCard({ col }) {
  const banner = col.banner || col.image || '';
  const avatar = col.image || col.banner || '';
  return (
    <Link to={`/collection/${col._id || col.collectionId}`}
      className="card group cursor-pointer overflow-visible">
      {/* Banner */}
      <div className="relative h-28 overflow-hidden rounded-t-2xl bg-raised">
        {banner
          ? <img src={banner} alt="" className="w-full h-full object-cover
                                               group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full"
              style={{ background: 'linear-gradient(135deg,rgba(0,200,255,0.15),rgba(124,58,237,0.15))' }} />
        }
        {/* Network badge */}
        {col.network && (
          <span className="absolute top-3 right-3 badge-cyan text-[10px] capitalize">
            {col.network}
          </span>
        )}
      </div>

      {/* Avatar (overlapping) */}
      <div className="relative px-4 pb-4">
        <div className="-mt-6 mb-3 relative z-10 inline-block">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 bg-raised"
            style={{ borderColor: 'var(--c-void)' }}>
            {avatar
              ? <img src={avatar} alt={col.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Layers size={22} className="text-ink-600" />
                </div>
            }
          </div>
          {col.isVerified && (
            <div className="absolute -bottom-1 -right-1 verified-dot">✓</div>
          )}
        </div>

        <h3 className="font-bold text-ink-100 truncate mb-1 group-hover:text-cyan-400 transition-colors">
          {col.name}
        </h3>
        <p className="text-xs text-ink-400 mb-3 line-clamp-2">
          {col.description || 'A collection on Durchex'}
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="text-ink-600 mb-0.5">Floor</p>
            <p className="font-bold text-ink-100">
              {col.floorPrice ? `${col.floorPrice} ETH` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-ink-600 mb-0.5">Items</p>
            <p className="font-bold text-ink-100">
              {col.totalItems ? Number(col.totalItems).toLocaleString() : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-ink-600 mb-0.5">Vol.</p>
            <p className="font-bold text-emerald-400">
              {col.volume24h ? `${Number(col.volume24h).toFixed(1)} Ξ` : '—'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CollectionRow({ col, rank }) {
  return (
    <Link to={`/collection/${col._id || col.collectionId}`}
      className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border
                 hover:border-cyan-400/25 hover:bg-raised transition-all duration-200 cursor-pointer group">
      <span className="w-8 text-sm font-bold text-ink-600 text-center shrink-0">{rank}</span>
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-raised shrink-0">
        {(col.image || col.banner)
          ? <img src={col.image || col.banner} alt={col.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          : <div className="w-full h-full flex items-center justify-center">
              <Layers size={18} className="text-ink-600" />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink-100 truncate group-hover:text-cyan-400 transition-colors">
          {col.name}
        </p>
        <p className="text-xs text-ink-400 capitalize">{col.network || 'Multi-chain'}</p>
      </div>
      <div className="hidden sm:block text-right w-24 shrink-0">
        <p className="text-xs text-ink-600 mb-0.5">Floor</p>
        <p className="text-sm font-bold text-ink-100">{col.floorPrice ? `${col.floorPrice} Ξ` : '—'}</p>
      </div>
      <div className="hidden md:block text-right w-24 shrink-0">
        <p className="text-xs text-ink-600 mb-0.5">Volume</p>
        <p className="text-sm font-bold text-emerald-400">{col.volume24h ? `${col.volume24h} Ξ` : '—'}</p>
      </div>
      <div className="hidden lg:block text-right w-20 shrink-0">
        <p className="text-xs text-ink-600 mb-0.5">Items</p>
        <p className="text-sm font-bold text-ink-100">{col.totalItems ? Number(col.totalItems).toLocaleString() : '—'}</p>
      </div>
    </Link>
  );
}

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [network, setNetwork] = useState('All');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await nftAPI.getCollections();
      setCollections(Array.isArray(data) ? data : []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = collections
    .filter(c => {
      const matchNet = network === 'All' || (c.network || '').toLowerCase() === network.toLowerCase();
      const q = search.toLowerCase();
      const matchQ = !q || (c.name || '').toLowerCase().includes(q);
      return matchNet && matchQ;
    })
    .sort((a, b) => {
      if (sortBy === 'floor')  return (parseFloat(b.floorPrice) || 0) - (parseFloat(a.floorPrice) || 0);
      if (sortBy === 'items')  return (Number(b.totalItems) || 0) - (Number(a.totalItems) || 0);
      if (sortBy === 'newest') return new Date(b.createdAt||0) - new Date(a.createdAt||0);
      if (sortBy === 'name')   return (a.name||'').localeCompare(b.name||'');
      return (parseFloat(b.volume24h) || 0) - (parseFloat(a.volume24h) || 0); // volume
    });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-void)' }}>
      <Header />

      {/* Page header */}
      <div className="page-container pt-8 pb-6">
        <p className="section-label mb-1.5">Browse</p>
        <h1 className="section-title">Collections</h1>
      </div>

      <main className="flex-1 page-container pb-20">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search collections…"
              className="input pl-9 h-10 text-sm w-full"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Network filter */}
          <div className="scroll-row gap-1.5">
            {NETWORKS.map(net => (
              <button key={net}
                onClick={() => setNetwork(net)}
                className={`category-pill ${network === net ? 'active' : ''}`}>
                {net}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <button onClick={() => setSortOpen(p => !p)}
              className="btn-secondary h-10 gap-2 text-sm px-4 shrink-0">
              <ArrowUpDown size={14} />
              <span className="hidden sm:inline">
                {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
              </span>
              <ChevronDown size={12} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 card-glass z-10 py-1">
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

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-raised rounded-xl p-1 border border-border shrink-0">
            <button onClick={() => setViewMode('grid')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${viewMode === 'grid' ? 'bg-surface text-cyan-400' : 'text-ink-600 hover:text-ink-300'}`}>
              <Grid3x3 size={15} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${viewMode === 'list' ? 'bg-surface text-cyan-400' : 'text-ink-600 hover:text-ink-300'}`}>
              <List size={15} />
            </button>
          </div>

          <button onClick={load} disabled={loading}
            className="btn-icon text-ink-400 hover:text-ink-100 disabled:opacity-50 shrink-0">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Results count */}
        <p className="text-sm text-ink-400 mb-4">
          {loading ? '…' : `${filtered.length} collection${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-surface border border-border">
                <div className="h-28 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="-mt-6 w-14 h-14 rounded-2xl skeleton" />
                  <div className="h-4 skeleton rounded w-2/3" />
                  <div className="h-3 skeleton rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <Layers size={52} className="text-ink-600 mx-auto mb-4" />
            <p className="text-ink-300 text-lg font-medium mb-2">No collections found</p>
            <button onClick={() => { setSearch(''); setNetwork('All'); }}
              className="btn-secondary mt-4 gap-2">
              <X size={15} /> Clear filters
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {/* List header */}
            <div className="flex items-center gap-4 px-4 py-2 text-xs text-ink-600 font-medium">
              <span className="w-8 text-center">#</span>
              <span className="w-12 shrink-0" />
              <span className="flex-1">Collection</span>
              <span className="hidden sm:block w-24 text-right">Floor</span>
              <span className="hidden md:block w-24 text-right">Volume</span>
              <span className="hidden lg:block w-20 text-right">Items</span>
            </div>
            {filtered.map((col, i) => (
              <CollectionRow key={col._id || i} col={col} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((col, i) => (
              <CollectionCard key={col._id || i} col={col} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
