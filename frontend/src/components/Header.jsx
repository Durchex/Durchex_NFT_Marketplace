import { useState, useContext, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiShoppingBag, FiUser, FiBell, FiMenu } from "react-icons/fi";
import { HiChevronDown } from "react-icons/hi";
import { useCart } from "../Context/CartContext";
import { ICOContent } from "../Context";
import { useNetwork } from "../Context/NetworkContext";
import { useSidebar } from "../Context/SidebarContext";
import WalletConnect from "./WalletConnect";
import LOGO from "../assets/logo.png";
import { useUser } from "../Context/UserContext";
import CartDrawer from "./CartDrawer";
import SearchBar from "./SearchBar/SearchBar";

/**
 * Simplified Header - Only shows Search, Notifications, Cart, Networks, and Connect Wallet
 * Navigation moved to Sidebar
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();
  const { address } = useContext(ICOContent) || {};
  const { selectedNetwork, networks, switchNetwork } = useNetwork();
  const { userProfile, initializeProfile } = useUser();
  const { toggleSidebar } = useSidebar();
  const [notifications, setNotifications] = useState([]);
  const navRef = useRef(null);
  const networkButtonRef = useRef(null);
  const notificationsButtonRef = useRef(null);
  const [networkDropdownPosition, setNetworkDropdownPosition] = useState({ top: 0, right: 0 });
  const [notificationsDropdownPosition, setNotificationsDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (address) initializeProfile(address);
  }, [address, initializeProfile]);

  useEffect(() => {
    if (isOpen && networkButtonRef.current) {
      const rect = networkButtonRef.current.getBoundingClientRect();
      setNetworkDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (notificationsOpen && notificationsButtonRef.current) {
      const rect = notificationsButtonRef.current.getBoundingClientRect();
      setNotificationsDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [notificationsOpen]);

  const avatarUrl = useMemo(() => {
    if (userProfile?.image) return userProfile.image;
    if (userProfile?.avatar) return userProfile.avatar;
    try {
      const saved = localStorage.getItem("durchex_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.image) return parsed.image;
        if (parsed?.avatar) return parsed.avatar;
      }
    } catch {}
    if (address) return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
    return null;
  }, [userProfile, address]);

  return (
    <>
    <nav ref={navRef} className="bg-black border-b border-gray-800/50 px-1.5 xs:px-2 sm:px-4 py-2 xs:py-3 md:py-6 sticky top-0 z-50 w-full max-w-full overflow-x-hidden" style={{ isolation: 'isolate' }}>
      <div className="w-full max-w-full flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-3 relative z-50">
        {/* Logo + Menu Toggle */}
        <div className="flex items-center space-x-1 xs:space-x-2 z-10 flex-shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-300 hover:text-white p-1 xs:p-1.5 transition"
            aria-label="Toggle menu"
          >
            <FiMenu className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>
          
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <img src={LOGO} alt="DURCHEX Logo" className="h-6 w-6 xs:h-7 xs:w-7 md:h-10 md:w-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-sm"></div>
          </div>
          <div className="text-violet-500 font-display font-bold text-sm xs:text-base sm:text-xl md:text-2xl tracking-tight hidden sm:block">
            DURCHEX
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-3 md:space-x-4 flex-shrink-0 min-w-0">
          {/* Search Bar - Desktop Only */}
          <div className="hidden lg:block flex-1 max-w-md mx-4 min-w-0">
            <SearchBar 
              onSearch={(query) => {
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }}
              placeholder="Search NFTs..."
            />
          </div>

          {/* Search Icon - Mobile */}
          <button
            onClick={() => navigate('/search')}
            className="lg:hidden text-gray-300 hover:text-white p-1 xs:p-1.5 flex-shrink-0"
            aria-label="Open search"
          >
            <FiSearch className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>

          {/* Notifications - Only show if logged in, hide on very small screens */}
          {address && (
            <>
            <div className="relative flex-shrink-0 z-[100] hidden xs:block">
              <button
                ref={notificationsButtonRef}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative text-gray-300 hover:text-white p-1 xs:p-1.5 transition z-[100]"
                aria-label="Notifications"
              >
                <FiBell className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 xs:w-2.5 xs:h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>

              {/* Notifications Dropdown - Rendered via Portal outside header to prevent expansion */}
              {notificationsOpen && typeof document !== 'undefined' && createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setNotificationsOpen(false)}></div>
                  <div 
                    className="fixed w-72 xs:w-80 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 p-3 xs:p-4 z-[9999] max-h-[80vh] overflow-y-auto"
                    style={{ 
                      top: `${notificationsDropdownPosition.top}px`,
                      right: `${notificationsDropdownPosition.right}px`
                    }}
                  >
                    <h3 className="font-bold text-white mb-2 xs:mb-3 text-sm xs:text-base">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-400 text-xs xs:text-sm">No new notifications</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif, idx) => (
                          <div key={idx} className="p-2 bg-gray-800/50 rounded text-xs xs:text-sm text-gray-300">
                            {notif}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>,
                document.body
              )}
            </>
          )}

          {/* Cart - Hide on very small screens */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="text-gray-300 hover:text-white p-1 xs:p-1.5 relative transition flex-shrink-0 hidden xs:block"
            aria-label="Shopping cart"
          >
            <FiShoppingBag className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6" />
            {getCartItemCount() > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] xs:text-[10px] rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 flex items-center justify-center font-medium">
                {getCartItemCount()}
              </span>
            )}
          </button>

          {/* Network Selector - Icon only on mobile */}
          <div className="relative flex-shrink-0 z-[100]">
            <button
              ref={networkButtonRef}
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-1 bg-[#19171C] text-white px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-lg hover:bg-gray-800 transition-colors relative z-[100]"
              title="Select network"
            >
              <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-600 flex-shrink-0">
                <img 
                  src={selectedNetwork?.icon || networks[0].icon} 
                  alt={selectedNetwork?.name || networks[0].name}
                  className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <span className="font-display text-[10px] xs:text-xs md:text-sm hidden md:inline truncate max-w-[60px] lg:max-w-none">{selectedNetwork?.name || networks[0].name}</span>
              <HiChevronDown
                className={`transform transition-transform text-[10px] xs:text-xs md:text-sm flex-shrink-0 hidden sm:block ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

          </div>

      {/* Network Dropdown - Rendered via Portal outside header to prevent expansion */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)}></div>
          <div 
            className="fixed w-40 xs:w-48 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 py-2 z-[9999]"
            style={{ 
              top: `${networkDropdownPosition.top}px`,
              right: `${networkDropdownPosition.right}px`
            }}
          >
            <p className="px-2 xs:px-3 py-1.5 xs:py-2 text-[10px] xs:text-xs text-gray-400 font-display border-b border-gray-700">
              Select Network
            </p>
            {networks.map((network) => (
              <button
                key={network.name}
                onClick={async () => {
                  await switchNetwork(network);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm font-medium transition ${
                  selectedNetwork?.name === network.name
                    ? "text-purple-400 bg-purple-400/10"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center space-x-1.5 xs:space-x-2">
                  <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={network.icon} 
                      alt={network.name}
                      className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="truncate">{network.name}</span>
                </div>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

          {/* Connect Wallet - Desktop */}
          <div className="hidden md:block flex-shrink-0 relative z-[100]" style={{ position: 'relative' }}>
            <WalletConnect />
          </div>

          {/* Mobile Profile Menu / Connect Wallet */}
          <div className="md:hidden relative flex-shrink-0 z-[100]" style={{ position: 'relative' }}>
            {address ? (
              <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-full overflow-hidden border-2 border-purple-500 flex-shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }} 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <FiUser className="w-3 h-3 xs:w-4 xs:h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </nav>
    </>
  );
}