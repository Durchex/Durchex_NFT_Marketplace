import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiShoppingBag, FiUser } from "react-icons/fi";
import { HiChevronDown } from "react-icons/hi";
import { HiMenu, HiX } from "react-icons/hi";
import { useCart } from "../Context/CartContext";
import { useContext, useEffect, useMemo } from "react";
import { ICOContent } from "../Context";
import { useNetwork } from "../Context/NetworkContext";
import WalletConnect from "./WalletConnect";
import LOGO from "../assets/logo.png";
import { useUser } from "../Context/UserContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { getCartItemCount } = useCart();
  const { address } = useContext(ICOContent) || {};
  const { selectedNetwork, networks, switchNetwork } = useNetwork();
  const { userProfile, initializeProfile } = useUser();

  useEffect(() => {
    if (address) initializeProfile(address);
  }, [address, initializeProfile]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, searchOpen]);

  const avatarUrl = useMemo(() => {
    // Priority: userProfile.image -> userProfile.avatar -> localStorage profile -> dicebear -> null
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

  // Navigation items array
  const navItems = [
    { name: "Explore", path: "/" },
    { name: "Create", path: "/studio" },
    { name: "How It Works", path: "/welcome" },
    // { name: "Stats", path: "/stats" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  return (
    <nav className="bg-black border-b border-gray-800/50 px-4 py-4 md:py-6 sticky top-0 z-40 w-full" style={{ isolation: 'isolate' }}>
      <div className="w-full flex items-center justify-between">
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

        {/* Mobile Menu Toggle - Always visible on mobile */}
        <div className="flex items-center md:hidden z-50">
          <button
            onClick={toggleSearch}
            className="text-gray-300 hover:text-white p-2 mr-1"
            aria-label="Open search"
          >
            <FiSearch className="w-5 h-5" />
          </button>
          <Link to="/cart" className="text-gray-300 hover:text-white p-2 mr-1 relative">
            <FiShoppingBag className="w-5 h-5" />
            {getCartItemCount() > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                {getCartItemCount()}
              </span>
            )}
          </Link>
          {/* Mobile Profile - WhatsApp Status Style with avatar */}
          <Link to="/profile" className="p-1 mr-1">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-green-500">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none';}} />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-gray-300" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="text-gray-300 hover:text-white p-2 bg-[#19171C] rounded-lg"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? (
              <HiX className="w-6 h-6" />
            ) : (
              <HiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center flex-1">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for collections, NFTs or Artists"
                className="w-full bg-transparent border border-[#4A4554] rounded-lg pl-10 pr-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-6 font-medium">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative px-1 py-2 text-gray-300 hover:text-white group ${
                  location.pathname === item.path ? "text-[#8149F4]" : ""
                }`}
              >
                {item.name}
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 transform origin-left transition-transform duration-300 ease-out ${
                    location.pathname === item.path
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}

            {/* Network Selector */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-[#19171C] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-gray-600">
                  <img 
                    src={selectedNetwork?.icon || networks[0].icon} 
                    alt={selectedNetwork?.name || networks[0].name}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hidden items-center justify-center text-white text-xs font-bold">
                    {(selectedNetwork?.symbol || networks[0].symbol).charAt(0)}
                  </div>
                </div>
                <span className="font-display">{selectedNetwork?.name || networks[0].name}</span>
                <HiChevronDown
                  className={`transform transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-700">
                    <p className="text-xs text-gray-400 font-display">Select Network</p>
                  </div>
                  {networks.map((network) => (
                    <button
                      key={network.name}
                      onClick={async () => {
                        await switchNetwork(network);
                        setIsOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-gray-600">
                        <img 
                          src={network.icon} 
                          alt={network.name}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hidden items-center justify-center text-white text-xs font-bold">
                          {network.symbol.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-medium">{network.name}</div>
                        <div className="text-xs text-gray-500">{network.symbol}</div>
                      </div>
                      {selectedNetwork?.name === network.name && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-4 items-center">
          {/* Onboarding CTA - only when wallet connected and not completed */}
          {address && !localStorage.getItem('durchex_onboarding_completed') && (
            <Link to="/onboarding">
              <button className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
                Get Started
              </button>
            </Link>
          )}
          {/* Cart with count */}
          <Link to="/cart" className="relative">
            <button className="text-gray-300 hover:text-white relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <FiShoppingBag className="w-5 h-5" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </Link>

          {/* Profile - WhatsApp Status Style with avatar */}
          <Link to="/profile">
            <button className="relative text-gray-300 hover:text-white transition-colors">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-green-500">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none';}} />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
              </div>
            </button>
          </Link>

          {/* Admin - Hidden for security */}
          {/* <Link to="/admin">
            <button className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
              Admin
            </button>
          </Link> */}

          {/* Trading */}
          <Link to="/trading">
            <button className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
              Trading
            </button>
          </Link>

          {/* Wallet Connect */}
            <WalletConnect />
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black z-50 flex items-start pt-20 px-4" onClick={toggleSearch}>
          <div className="w-full max-w-xl mx-auto" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for collections, NFTs or Artists"
                className="w-full bg-transparent border border-[#4A4554] rounded-lg pl-10 pr-10 py-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
              <button
                onClick={toggleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                aria-label="Close search"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center pt-20 px-4 w-full overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={toggleMobileMenu}
                className={`block text-xl font-medium px-4 py-3 rounded-lg border-b border-gray-600 hover:bg-gray-800 transition-colors ${
                  location.pathname === item.path
                    ? "text-[#8149F4] bg-violet-500/20"
                    : "text-gray-300"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/cart"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 text-xl font-medium px-4 py-3 rounded-lg border-b border-gray-600 hover:bg-gray-800 transition-colors text-gray-300"
            >
              <FiShoppingBag className="w-6 h-6" />
              <span>Cart</span>
              {getCartItemCount() > 0 && (
                <span className="bg-red-500 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {getCartItemCount()}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 text-xl font-medium px-4 py-3 rounded-lg border-b border-gray-600 hover:bg-gray-800 transition-colors text-gray-300"
            >
              <FiUser className="w-6 h-6" />
              <span>Profile</span>
            </Link>
            <Link
              to="/trading"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 text-xl font-medium px-4 py-3 rounded-lg border-b border-gray-600 hover:bg-gray-800 transition-colors text-gray-300"
            >
              <span>Trading</span>
            </Link>
            {address && !localStorage.getItem('durchex_onboarding_completed') && (
              <Link
                to="/onboarding"
                onClick={toggleMobileMenu}
                className="block text-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-lg font-medium"
              >
                Get Started
              </Link>
            )}
            <div className="pt-2">
              <WalletConnect />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}