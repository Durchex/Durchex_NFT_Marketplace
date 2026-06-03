/**
 * Footer — Orbital design system.
 */
import { Link } from "react-router-dom";
import LOGO from "../assets/logo.png";
import { Twitter, Github, Globe, Send, ArrowRight } from "lucide-react";

const LINKS = {
  Marketplace: [
    { label: "Explore",    href: "/explore"       },
    { label: "Collections",href: "/collections"   },
    { label: "Marketplace",href: "/marketplace"   },
    { label: "Drops",      href: "/drops"         },
    { label: "Analytics",  href: "/features/analytics" },
  ],
  Create: [
    { label: "Create NFT",      href: "/create"              },
    { label: "Lazy Mint",       href: "/features/lazy-mint"  },
    { label: "Batch Mint",      href: "/features/batch-mint" },
    { label: "Create Collection", href: "/create"            },
  ],
  Account: [
    { label: "My NFTs",   href: "/mynfts"     },
    { label: "Profile",   href: "/profile"    },
    { label: "Cart",      href: "/cart"       },
    { label: "Studio",    href: "/studio"     },
  ],
  Company: [
    { label: "About",   href: "/aboutus" },
    { label: "FAQ",     href: "/faq"     },
  ],
};

const SOCIAL = [
  { icon: Twitter, href: "#", label: "Twitter"  },
  { icon: Send,    href: "#", label: "Telegram" },
  { icon: Github,  href: "#", label: "GitHub"   },
  { icon: Globe,   href: "#", label: "Website"  },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
      {/* Newsletter bar */}
      <div className="page-container py-8 border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-100 mb-1">Stay in the loop</p>
            <p className="text-xs text-ink-400">Get the latest drops, collections and marketplace news.</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <input type="email" placeholder="your@email.com"
              className="input h-10 text-sm flex-1 sm:w-64" />
            <button className="btn-primary h-10 px-4 shrink-0 gap-1.5">
              Subscribe <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main links grid */}
      <div className="page-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl blur-md opacity-40"
                  style={{ background: 'var(--g-orbital)' }} />
                <img src={LOGO} alt="Durchex" className="relative w-9 h-9 rounded-xl object-contain" />
              </div>
              <span className="font-bold text-lg text-gradient">DURCHEX</span>
            </Link>
            <p className="text-xs text-ink-400 leading-relaxed mb-4">
              The next-generation multi-chain NFT marketplace.
              Discover, collect and trade digital art.
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href}
                  className="w-9 h-9 rounded-xl bg-raised border border-border flex items-center justify-center
                             text-ink-400 hover:text-ink-100 hover:border-cyan-400/40 transition-all duration-200"
                  aria-label={label}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav groups */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="section-label mb-4">{group}</p>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href}
                      className="text-sm text-ink-400 hover:text-ink-100 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="page-container pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <p className="text-xs text-ink-600">
            © {new Date().getFullYear()} Durchex. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-ink-600">
            <Link to="/faq" className="hover:text-ink-300 transition-colors">Privacy</Link>
            <Link to="/faq" className="hover:text-ink-300 transition-colors">Terms</Link>
            <Link to="/faq" className="hover:text-ink-300 transition-colors">Cookies</Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-ink-600">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
