import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../../Context/SidebarContext';
import {
  LayoutGrid,
  Gamepad2,
  TrendingUp,
  Zap,
  Wind,
  Layers,
  Lock,
  Coins,
  Gift,
  Users,
  BarChart3,
  Repeat2,
  Bell,
  ShoppingCart,
  Settings,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

/**
 * Sidebar - Static navigation sidebar with collapsible functionality
 * Shows icons when collapsed, expands to show labels on hover or manual expand
 */
const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();
  const [isHovering, setIsHovering] = React.useState(false);
  const location = useLocation();

  // Navigation items grouped by category
  const navItems = [
    {
      section: 'Main',
      items: [
        { icon: LayoutGrid, label: 'Explore', path: '/explore', badge: null },
        { icon: Gamepad2, label: 'Games', path: '/games', badge: 'Coming Soon' },
      ]
    },
    {
      section: 'Features',
      items: [
        { icon: TrendingUp, label: 'Trading', path: '/features/trading', badge: 'Coming Soon' },
        { icon: Zap, label: 'Auctions', path: '/features/auction', badge: 'Coming Soon' },
        { icon: Wind, label: 'Lazy Mint', path: '/features/lazy-mint', badge: 'Coming Soon' },
        { icon: Layers, label: 'Batch Mint', path: '/features/batch-mint', badge: 'Coming Soon' },
        { icon: Lock, label: 'Rental', path: '/features/rental', badge: 'Coming Soon' },
        { icon: Coins, label: 'Financing', path: '/features/financing', badge: 'Coming Soon' },
        { icon: Gift, label: 'Staking', path: '/features/staking', badge: 'Coming Soon' },
        { icon: Users, label: 'Governance', path: '/features/governance', badge: 'Coming Soon' },
        { icon: BarChart3, label: 'Monetization', path: '/features/monetization', badge: 'Coming Soon' },
        { icon: Repeat2, label: 'Analytics', path: '/features/analytics', badge: 'Coming Soon' },
        { icon: Repeat2, label: 'Bridge', path: '/features/bridge', badge: 'Coming Soon' },
        { icon: Bell, label: 'Notifications', path: '/features/notifications', badge: 'Coming Soon' },
      ]
    },
    {
      section: 'User',
      items: [
        { icon: ShoppingCart, label: 'Minting', path: '/minting', badge: null },
        { icon: Settings, label: 'Settings', path: '/settings', badge: null },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;
  const showLabel = isSidebarOpen || isHovering;

  return (
    <>
      {/* Desktop Sidebar - Always visible on md and above */}
      <div
        className="fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 z-40 transition-all duration-300 hidden md:flex flex-col"
        style={{ width: isSidebarOpen || isHovering ? '280px' : '80px' }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between h-20 flex-shrink-0">
          <div className={`transition-opacity duration-300 ${showLabel ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-lg font-bold text-white">Menu</h2>
          </div>
          <button
            onClick={() => toggleSidebar()}
            className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
            title={isSidebarOpen ? 'Collapse' : 'Expand'}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-6 px-2">
          {navItems.map((section) => (
            <div key={section.section} className="mb-6">
              {/* Section Title */}
              {showLabel && (
                <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2 transition-opacity duration-300">
                  {section.section}
                </p>
              )}

              {/* Section Items */}
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                        active
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
                      }`}
                      title={!showLabel ? item.label : ''}
                    >
                      {/* Icon */}
                      <Icon size={20} className="flex-shrink-0" />

                      {/* Label */}
                      <div
                        className={`flex items-center justify-between flex-1 transition-opacity duration-300 ${
                          showLabel ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                        }`}
                      >
                        <span className="font-medium text-sm">{item.label}</span>

                        {/* Badge */}
                        {item.badge && (
                          <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded whitespace-nowrap">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Arrow on hover */}
                      {active && showLabel && (
                        <ChevronRight size={16} className="absolute right-2" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="border-t border-gray-700 p-4 flex-shrink-0">
          {showLabel && (
            <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
              <p className="font-semibold text-white mb-1">Durchex</p>
              <p>NFT Marketplace</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar - Drawer overlay on mobile, hidden by default */}
      {isSidebarOpen && (
        <>
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => closeSidebar()}
          />

          {/* Mobile Drawer */}
          <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 z-40 flex flex-col md:hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between h-16 flex-shrink-0">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button
                onClick={() => closeSidebar()}
                className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
              {navItems.map((section) => (
                <div key={section.section} className="mb-6">
                  {/* Section Title */}
                  <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">
                    {section.section}
                  </p>

                  {/* Section Items */}
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => closeSidebar()}
                          className={`relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            active
                              ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
                          }`}
                        >
                          {/* Icon */}
                          <Icon size={20} className="flex-shrink-0" />

                          {/* Label */}
                          <div className="flex items-center justify-between flex-1">
                            <span className="font-medium text-sm">{item.label}</span>

                            {/* Badge */}
                            {item.badge && (
                              <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded whitespace-nowrap">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {/* Arrow on active */}
                          {active && (
                            <ChevronRight size={16} className="absolute right-2" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer Info */}
            <div className="border-t border-gray-700 p-4 flex-shrink-0">
              <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
                <p className="font-semibold text-white mb-1">Durchex</p>
                <p>NFT Marketplace</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
