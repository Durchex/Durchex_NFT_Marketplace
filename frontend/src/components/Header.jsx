import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search, Bell, ShoppingCart, Menu, X, ChevronDown,
  Layers, Compass, PlusCircle, BarChart2, Zap,
  Check, ExternalLink, Wallet, Grid, Tag,
} from "lucide-react";
import { useCart } from "../Context/CartContext";
import { ICOContent } from "../Context";
import { useNetwork } from "../Context/NetworkContext";
import { useSidebar } from "../Context/SidebarContext";
import WalletConnect from "./WalletConnect";
import VerifiedAvatar from "./VerifiedAvatar";
import { notificationsAPI } from "../services/api";
import LOGO from "../assets/logo.png";
import { useUser } from "../Context/UserContext";
import CartDrawer from "./CartDrawer";

/* ─── Network icons (emoji fallbacks, replace with SVGs later) ─── */
const CHAIN_ICONS = {
  base:     '🔵', ethereum: '⟠', polygon: '🟣',
  bsc:      '🟡', arbitrum: '🔵', optimism: '🔴',
  avalanche:'🔺', solana:   '◎',
};

/* ─── Main nav links ─── */
const NAV = [
  { label: 'Explore',     href: '/explore',      icon: Compass },
  { label: 'Collections', href: '/collections',  icon: Grid },
  { label: 'Create',      href: '/create',        icon: PlusCircle },
  { label: 'Analytics',   href: '/features/analytics', icon: BarChart2 },
  { label: 'Drops',       href: '/drops',         icon: Zap },
];

export default function Header() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { getCartItemCount } = useCart();
  const { address } = useContext(ICOContent) || {};
  const { selectedNetwork, networks, switchNetwork } = useNetwork();
  const { userProfile, initializeProfile } = useUser();
  const { toggleSidebar } = useSidebar();

  const [cartOpen,  setCartOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [netOpen,   setNetOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal,  setSearchVal]  = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const notifRef = useRef(null);
  const netRef   = useRef(null);
  const searchRef = useRef(null);

  /* ── Init profile ── */
  useEffect(() => {
    if (address) initializeProfile(address);
  }, [address, initializeProfile]);

  /* ── Load notifications ── */
  const loadNotifs = useCallback(async () => {
    if (!address) return;
    try {
      const raw = await notificationsAPI.getList(address, { limit: 20 });
      const items = Array.isArray(raw) ? raw : (raw?.notifications || []);
      setNotifications(items);
      setUnread(items.filter(n => !n.read).length);
    } catch (_) {}
  }, [address]);

  useEffect(() => {
    if (!address) { setNotifications([]); setUnread(0); return; }
    loadNotifs();
    const t = setInterval(loadNotifs, 60_000);
    return () => clearInterval(t);
  }, [address, loadNotifs]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (netRef.current   && !netRef.current.contains(e.target))   setNetOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Search submit ── */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
      setSearchOpen(false);
    }
  };

  /* ── Mark all notifs read ── */
  const markAllRead = async () => {
    if (!address) return;
    try { await notificationsAPI.markAllRead(address); } catch (_) {}
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const cartCount = getCartItemCount?.() || 0;
  const isActive  = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  // selectedNetwork may be a string ID or an object — normalise to string first
  const selectedNetworkId = selectedNetwork
    ? (typeof selectedNetwork === 'string' ? selectedNetwork : (selectedNetwork?.id || selectedNetwork?.name || ''))
    : '';
  const currentNetwork = networks?.find(n =>
    String(n.id || '').toLowerCase() === selectedNetworkId.toLowerCase()
  ) || networks?.[0];

  return (
    <>
      {/* ── Ticker Bar ── */}
      <div className="h-9 bg-raised border-b border-border overflow-hidden flex items-center text-xs text-ink-400">
        <div className="ticker-track whitespace-nowrap flex gap-8 px-4">
          {['ETH Floor: 0.08Ξ ↑2.4%', 'BAYC: 12.5Ξ ↑0.8%', 'Azuki: 4.2Ξ ↓1.1%',
            '24h Volume: 1,240Ξ', 'Traders: 8,420', 'Listings: 24,100',
            'CryptoPunks: 52.0Ξ ↑3.2%', 'Moonbirds: 2.1Ξ ↓0.5%',
            'CloneX: 1.8Ξ ↑1.4%', 'BAYC: 12.5Ξ ↑0.8%'].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              <span className={t.includes('↑') ? 'text-emerald-400' : t.includes('↓') ? 'text-red-400' : 'text-cyan-400'}>•</span>
              {t}
            </span>
          ))}
          {/* duplicate for seamless loop */}
          {['ETH Floor: 0.08Ξ ↑2.4%', 'BAYC: 12.5Ξ ↑0.8%', 'Azuki: 4.2Ξ ↓1.1%',
            '24h Volume: 1,240Ξ', 'Traders: 8,420', 'Listings: 24,100',
            'CryptoPunks: 52.0Ξ ↑3.2%', 'Moonbirds: 2.1Ξ ↓0.5%',
            'CloneX: 1.8Ξ ↑1.4%', 'BAYC: 12.5Ξ ↑0.8%'].map((t, i) => (
            <span key={`d${i}`} className="flex items-center gap-1.5 shrink-0">
              <span className={t.includes('↑') ? 'text-emerald-400' : t.includes('↓') ? 'text-red-400' : 'text-cyan-400'}>•</span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main header ── */}
      <header className="sticky top-9 z-40 w-full"
        style={{ background: 'rgba(5,5,13,0.85)', backdropFilter: 'blur(20px)',
                 borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="page-container h-[68px] flex items-center gap-4">

          {/* Mobile menu toggle */}
          <button onClick={toggleSidebar}
            className="btn-icon text-ink-400 hover:text-ink-100 md:hidden shrink-0">
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-md opacity-60"
                style={{ background: 'var(--g-orbital)' }} />
              <img src={LOGO} alt="Durchex" className="relative w-9 h-9 rounded-xl object-contain" />
            </div>
            <span className="hidden sm:block font-bold text-lg tracking-tight text-gradient">
              DURCHEX
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {NAV.map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive(href)
                    ? 'bg-cyan-400/10 text-cyan-400'
                    : 'text-ink-400 hover:text-ink-100 hover:bg-raised'}`}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Search bar — grows to fill space */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none" />
              <input
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search NFTs, collections, creators…"
                className="input-search w-full text-sm h-10"
              />
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Mobile search */}
            <button className="btn-icon text-ink-400 hover:text-ink-100 md:hidden"
              onClick={() => navigate('/search')}>
              <Search size={18} />
            </button>

            {/* Network selector */}
            <div ref={netRef} className="relative">
              <button onClick={() => setNetOpen(p => !p)}
                className="hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-xl
                           bg-raised border border-border text-sm font-medium text-ink-200
                           hover:border-cyan-400/40 hover:text-ink-100 transition-all duration-200">
                <span className="text-base leading-none">
                  {CHAIN_ICONS[currentNetwork?.id?.toLowerCase()] || '🌐'}
                </span>
                <span className="hidden lg:block">
                  {currentNetwork?.name || 'Network'}
                </span>
                <ChevronDown size={14} className={`text-ink-600 transition-transform duration-200 ${netOpen ? 'rotate-180' : ''}`} />
              </button>

              {netOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 card-glass shadow-modal z-50 py-1 overflow-hidden">
                  <p className="section-label px-4 py-2">Switch Network</p>
                  {(networks || []).map(net => (
                    <button key={net.id}
                      onClick={() => { switchNetwork?.(String(net.id || '')); setNetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                 text-ink-200 hover:text-ink-100 hover:bg-raised transition-colors">
                      <span className="text-base">{CHAIN_ICONS[net.id?.toLowerCase()] || '🌐'}</span>
                      <span className="flex-1 text-left">{net.name}</span>
                      {String(currentNetwork?.id||'') === String(net.id||'') && <Check size={14} className="text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            {address && (
              <div ref={notifRef} className="relative">
                <button onClick={() => { setNotifOpen(p => !p); if (!notifOpen) loadNotifs(); }}
                  className="btn-icon text-ink-400 hover:text-ink-100 relative">
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full
                                     bg-orbital text-white text-[10px] font-bold flex items-center
                                     justify-center px-1 leading-none"
                      style={{ background: 'var(--g-orbital)' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 card-glass shadow-modal z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <span className="font-semibold text-ink-100 text-sm">Notifications</span>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs text-cyan-400 hover:text-cyan-300">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scroll">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-ink-400 text-sm">
                          No notifications yet
                        </div>
                      ) : notifications.map((n, i) => (
                        <div key={n._id || i}
                          className={`px-4 py-3 border-b border-border/50 hover:bg-raised
                                      transition-colors cursor-pointer
                                      ${!n.read ? 'bg-cyan-400/[0.03]' : ''}`}>
                          <div className="flex items-start gap-3">
                            {!n.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                            )}
                            <div className={!n.read ? '' : 'pl-4'}>
                              <p className="text-xs text-ink-200 leading-relaxed">{n.message || n.title}</p>
                              <p className="text-[10px] text-ink-600 mt-1">
                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-border">
                      <Link to="/features/notifications"
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                        View all <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              className="btn-icon text-ink-400 hover:text-ink-100 relative">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full
                                 text-void text-[10px] font-bold flex items-center justify-center px-1"
                  style={{ background: 'var(--g-orbital)' }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Wallet */}
            <div className="shrink-0">
              <WalletConnect compact />
            </div>
          </div>
        </div>
      </header>

      {/* Cart drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
