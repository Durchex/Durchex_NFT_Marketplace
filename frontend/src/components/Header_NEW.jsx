import { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiShoppingBag, FiUser, FiBell } from "react-icons/fi";
import { HiChevronDown } from "react-icons/hi";
import { useCart } from "../Context/CartContext";
import { ICOContent } from "../Context";
import { useNetwork } from "../Context/NetworkContext";
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
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (address) initializeProfile(address);
  }, [address, initializeProfile]);

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
    <nav className="bg-black border-b border-gray-800/50 px-4 py-4 md:py-6 sticky top-0 z-30 w-full" style={{ isolation: 'isolate' }}>
      <div className="w-full flex items-center justify-between ml-20 md:ml-0">
        {/* Logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="relative">
            <img src={LOGO} alt="DURCHEX Logo" className="h-8 w-8 md:h-10 md:w-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-sm"></div>
          </div>
          <div className="text-violet-500 font-display font-bold text-xl md:text-2xl tracking-tight">
            DURCHEX
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Search Bar - Desktop Only */}
          <div className="hidden lg:block flex-1 max-w-md mx-4">
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
            className="md:hidden text-gray-300 hover:text-white p-2"
            aria-label="Open search"
          >
            <FiSearch className="w-5 h-5" />
          </button>

          {/* Notifications - Only show if logged in */}
          {address && (
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative text-gray-300 hover:text-white p-2 transition"
                aria-label="Notifications"
              >
                <FiBell className="w-5 h-5 md:w-6 md:h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 p-4 z-50">
                  <h3 className="font-bold text-white mb-3">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-gray-400 text-sm">No new notifications</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notif, idx) => (
                        <div key={idx} className="p-2 bg-gray-800/50 rounded text-sm text-gray-300">
                          {notif}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="text-gray-300 hover:text-white p-2 relative transition"
            aria-label="Shopping cart"
          >
            <FiShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
            {getCartItemCount() > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                {getCartItemCount()}
              </span>
            )}
          </button>

          {/* Network Selector */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 bg-[#19171C] text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              title="Select network"
            >
              <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-600">
                <img 
                  src={selectedNetwork?.icon || networks[0].icon} 
                  alt={selectedNetwork?.name || networks[0].name}
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <span className="font-display text-xs md:text-sm hidden sm:inline">{selectedNetwork?.name || networks[0].name}</span>
              <HiChevronDown
                className={`transform transition-transform text-xs md:text-sm ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Network Dropdown */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                <p className="px-3 py-2 text-xs text-gray-400 font-display border-b border-gray-700">
                  Select Network
                </p>
                {networks.map((network) => (
                  <button
                    key={network.name}
                    onClick={() => {
                      switchNetwork(network.name);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-medium transition ${
                      selectedNetwork?.name === network.name
                        ? "text-purple-400 bg-purple-400/10"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                        <img 
                          src={network.icon} 
                          alt={network.name}
                          className="w-4 h-4 rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <span>{network.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connect Wallet */}
          <div className="hidden sm:block">
            <WalletConnect />
          </div>

          {/* Mobile Profile Menu */}
          <div className="sm:hidden relative">
            {address ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500 flex-shrink-0">
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
                    <FiUser className="w-4 h-4 text-gray-300" />
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
  );
}
