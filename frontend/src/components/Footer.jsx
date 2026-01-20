import LOGO from "../assets/logo.png";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "About us", href: "/aboutus" },
    { label: "Documentation", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "FAQs", href: "/faq" },
    { label: "Contact", href: "#" }
  ];

  const communities = [
    { label: "Discord", href: "#", icon: "discord" },
    { label: "Twitter", href: "#", icon: "twitter" },
    { label: "Telegram", href: "#", icon: "telegram" },
    { label: "Medium", href: "#", icon: "medium" }
  ];

  const blockchains = {
    layer1: ["Ethereum", "BNB Chain", "Solana", "Avalanche", "Algorand", "Aptos", "SUI", "Fantom"],
    layer2: ["Polygon", "Base", "zkSync", "Arbitrum", "Optimism"]
  };

  const payments = {
    tokens: ["USDT", "USDC", "MATIC", "ETH"],
    fiat: ["Moonpay", "Transak", "Ramp", "Stripe", "PayPal", "Mercuryo"]
  };

  return (
    <footer className="bg-black border-t border-gray-800/50 text-gray-300 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none"></div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Top Section - Brand + Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img src={LOGO} alt="DURCHEX Logo" className="h-8 w-8" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-sm"></div>
              </div>
              <span className="text-white font-bold text-lg">DURCHEX</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The most secure and scalable multi-chain NFT marketplace for digital collectibles.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>© {currentYear} DURCHEX. All rights reserved.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-1 group"
                  >
                    {link.label}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Communities */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Join Community</h3>
            <ul className="space-y-3">
              {communities.map((community) => (
                <li key={community.label}>
                  <a 
                    href={community.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-4 h-4 rounded-full bg-gray-800 group-hover:bg-purple-600/30 transition-colors flex items-center justify-center">
                      <span className="text-xs">◆</span>
                    </span>
                    {community.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Support</h3>
            <div className="space-y-3">
              <a 
                href="mailto:support@durchex.com"
                className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group"
              >
                <Mail size={14} className="group-hover:text-purple-400" />
                support@durchex.com
              </a>
              <a 
                href="tel:+234801"
                className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group"
              >
                <Phone size={14} className="group-hover:text-purple-400" />
                +234 801 342 5496
              </a>
              <div className="text-gray-400 text-sm flex items-center gap-2">
                <MapPin size={14} />
                Lagos, Nigeria
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/50 my-8"></div>

        {/* Bottom Section - Blockchains and Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Layer 1 Blockchains */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Layer 1 Chains
            </h4>
            <ul className="grid grid-cols-2 gap-2">
              {blockchains.layer1.map((chain) => (
                <li key={chain} className="text-gray-400 text-xs hover:text-purple-400 transition-colors cursor-pointer">
                  • {chain}
                </li>
              ))}
            </ul>
          </div>

          {/* Layer 2 Blockchains */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Layer 2 Chains
            </h4>
            <ul className="space-y-1">
              {blockchains.layer2.map((chain) => (
                <li key={chain} className="text-gray-400 text-xs hover:text-purple-400 transition-colors cursor-pointer">
                  • {chain}
                </li>
              ))}
            </ul>
          </div>

          {/* Supported Tokens */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Tokens
            </h4>
            <ul className="space-y-1">
              {payments.tokens.map((token) => (
                <li key={token} className="text-gray-400 text-xs hover:text-green-400 transition-colors cursor-pointer">
                  • {token}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Fiat & Ramps
            </h4>
            <ul className="grid grid-cols-2 gap-2">
              {payments.fiat.map((method) => (
                <li key={method} className="text-gray-400 text-xs hover:text-blue-400 transition-colors cursor-pointer">
                  • {method}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/50 my-8"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center md:text-left">
            DURCHEX © {currentYear} | Built with ❤️ for Web3
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <a href="/faq" className="hover:text-purple-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Cookies</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
