/**
 * Sidebar — mobile-only navigation drawer (Orbital design).
 * On desktop the Header already shows all nav links, so the sidebar
 * only appears on small screens when the hamburger is tapped.
 */
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../../Context/SidebarContext';
import {
  X, Compass, LayoutGrid, PlusCircle, BarChart2, Zap,
  Gamepad2, TrendingUp, Bell, ShoppingCart, Settings,
  ChevronRight, Layers, Users, Globe,
} from 'lucide-react';

const NAV = [
  {
    section: 'Marketplace',
    items: [
      { icon: Compass,    label: 'Explore',      path: '/explore'        },
      { icon: LayoutGrid, label: 'Marketplace',  path: '/marketplace'    },
      { icon: Layers,     label: 'Collections',  path: '/collections'    },
      { icon: Zap,        label: 'Drops',        path: '/drops'          },
      { icon: BarChart2,  label: 'Analytics',    path: '/features/analytics' },
    ],
  },
  {
    section: 'Create',
    items: [
      { icon: PlusCircle, label: 'Create NFT',   path: '/create'              },
      { icon: Layers,     label: 'Lazy Mint',    path: '/features/lazy-mint'  },
      { icon: Layers,     label: 'Batch Mint',   path: '/features/batch-mint' },
    ],
  },
  {
    section: 'Features',
    items: [
      { icon: TrendingUp, label: 'Trading',      path: '/features/trading'       },
      { icon: Zap,        label: 'Auctions',     path: '/features/auction'       },
      { icon: Users,      label: 'Governance',   path: '/features/governance'    },
      { icon: Globe,      label: 'Bridge',       path: '/features/bridge'        },
      { icon: Bell,       label: 'Notifications',path: '/features/notifications' },
    ],
  },
  {
    section: 'Account',
    items: [
      { icon: Settings,      label: 'Profile',  path: '/profile' },
      { icon: ShoppingCart,  label: 'Cart',     path: '/cart'    },
      { icon: Gamepad2,      label: 'Games',    path: '/games'   },
    ],
  },
];

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/explore' && location.pathname === '/');

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed left-0 top-0 h-screen w-72 z-50 flex flex-col overflow-hidden animate-fade-in"
        style={{
          background: 'rgba(13,13,26,0.97)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border shrink-0">
          <span className="font-bold text-lg text-gradient">DURCHEX</span>
          <button
            onClick={closeSidebar}
            className="btn-icon text-ink-400 hover:text-ink-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="section-label px-2 mb-2">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${active
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-ink-400 hover:text-ink-100 hover:bg-raised'
                        }`}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight size={14} className="text-violet-400 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <p className="text-xs text-ink-600">© {new Date().getFullYear()} Durchex</p>
        </div>
      </aside>
    </>
  );
}
