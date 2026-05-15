import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { nftAPI } from '../services/api';
import { SUPPORTED_NETWORKS } from '../Context/constants';

/**
 * Countdown timer that ticks once per second. Returns null once the target
 * date is in the past so callers can swap to a "Live now" badge.
 */
function useCountdown(targetIso) {
  const target = useMemo(() => (targetIso ? new Date(targetIso).getTime() : null), [targetIso]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const ms = target - now;
  if (ms <= 0) return null;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function DropCard({ nft }) {
  const launchAt = nft.publicLaunchAt || null;
  const cd = useCountdown(launchAt);
  const isLive = nft.isPublic || (launchAt && new Date(launchAt) <= new Date());
  const displayPrice = isLive && nft.publicPrice ? nft.publicPrice : nft.whitelistPrice;
  const isFree = Number(displayPrice ?? 0) === 0;

  return (
    <Link to={`/nft/${nft._id}`} className="block bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-2xl overflow-hidden transition group">
      <div className="relative">
        <img src={nft.image} alt={nft.name} className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
            isLive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'
          }`}>
            {isLive ? 'LIVE' : 'UPCOMING'}
          </span>
          {nft.whitelistMode === 'allowlist' && !isLive && (
            <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-purple-600 text-white">
              Allowlist
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3 px-2 py-1 text-[10px] uppercase font-bold rounded bg-black/70 text-white capitalize">
          {nft.network}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white text-lg truncate">{nft.name}</h3>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Mint price</div>
            <div className="text-xl font-bold text-white">
              {isFree ? 'FREE' : displayPrice}
            </div>
            {Number(nft.mintingFee) > 0 && (
              <div className="text-xs text-gray-400">+ {nft.mintingFee} fee</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Supply</div>
            <div className="text-white font-semibold">{nft.remainingPieces ?? nft.pieces ?? 1} / {nft.pieces ?? 1}</div>
          </div>
        </div>
        {/* Countdown or live badge */}
        <div className="mt-4 border-t border-gray-800 pt-3">
          {cd ? (
            <div className="grid grid-cols-4 gap-2">
              {[
                ['Days', cd.days],
                ['Hours', cd.hours],
                ['Min', cd.minutes],
                ['Sec', cd.seconds],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-800 rounded-lg py-2 text-center">
                  <div className="text-xl font-mono font-bold text-purple-400 tabular-nums">{String(val).padStart(2, '0')}</div>
                  <div className="text-[10px] uppercase text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center py-2 rounded-lg font-semibold text-sm">
              {isLive ? 'Mint now →' : 'No launch time set'}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Drops() {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkFilter, setNetworkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'upcoming' | 'live'

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await nftAPI.listUpcomingNfts({
          network: networkFilter === 'all' ? undefined : networkFilter,
          includePublic: true,
          page: 1,
          limit: 60,
        });
        if (!cancelled) setDrops(data?.nfts || []);
      } catch (err) {
        console.error('Failed to load drops', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // Auto-refresh every 30s so newly-launched drops flip from upcoming → live.
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [networkFilter]);

  // Apply status filter + sort: live first, then by closest launch time.
  const visible = useMemo(() => {
    const now = Date.now();
    let list = [...drops];
    if (statusFilter === 'upcoming') {
      list = list.filter((n) => {
        const lt = n.publicLaunchAt ? new Date(n.publicLaunchAt).getTime() : null;
        return !n.isPublic && (!lt || lt > now);
      });
    } else if (statusFilter === 'live') {
      list = list.filter((n) => {
        const lt = n.publicLaunchAt ? new Date(n.publicLaunchAt).getTime() : null;
        return n.isPublic || (lt && lt <= now);
      });
    }
    list.sort((a, b) => {
      const al = a.publicLaunchAt ? new Date(a.publicLaunchAt).getTime() : Infinity;
      const bl = b.publicLaunchAt ? new Date(b.publicLaunchAt).getTime() : Infinity;
      const aLive = a.isPublic || (al && al <= now);
      const bLive = b.isPublic || (bl && bl <= now);
      if (aLive !== bLive) return aLive ? -1 : 1;
      return al - bl;
    });
    return list;
  }, [drops, statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      <Header />
      <main className="px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold">Drops</h1>
              <p className="text-gray-400 mt-2">Upcoming and live NFT mints. Sorted by launch time.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                <option value="all">All networks</option>
                {SUPPORTED_NETWORKS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                {['all', 'live', 'upcoming'].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition ${
                      statusFilter === s ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && drops.length === 0 ? (
            <div className="text-center py-20 text-gray-400">Loading drops…</div>
          ) : visible.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No drops match these filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visible.map((nft) => <DropCard key={nft._id} nft={nft} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
