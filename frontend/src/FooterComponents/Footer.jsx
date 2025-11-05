import { useState } from "react";
import LOGO from "../assets/logo.png";

const Footer = () => {
  // Tooltip content for quick links
  const tooltipContent = {
    "About us":
      "Learn about DURCHEX's mission, team, and journey in revolutionizing the NFT marketplace",
    Docs: "Access comprehensive documentation about DURCHEX's features, APIs, and integration guides",
    Privacy:
      "Learn about how we collect, use, and protect your personal information and data rights",
    Terms:
      "Review our terms of service, user agreements, and platform usage policies",
    FAQs: "Find answers to commonly asked questions about our marketplace, NFTs, and blockchain technology",
    "Feature Requests":
      "Submit your ideas and suggestions to help us improve the DURCHEX platform",
  };

  const [activeTooltip, setActiveTooltip] = useState(null);

  const showTooltip = (linkName) => {
    setActiveTooltip(linkName);
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  return (
    <footer className="bg-[#121212] text-gray-400 py-16 px-8 relative overflow-hidden">
      {/* Background Text */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute bottom-[-10%] left-[1%] right-[-5%] text-[20vw] font-bold bg-gradient-to-t
         from-[#1a1a1a] to-[#00000000] bg-clip-text text-transparent stroke-text pointer-events-none select-none opacity-25"
        >
          DURCHEX
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        {/* Brand Column */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <img
              src={LOGO || "/placeholder.svg"}
              alt="DURCHEX Logo"
              className="h-8 w-8"
            />
            <span className="text-white text-xl font-semibold">DURCHEX</span>
          </div>
          <p className="text-sm leading-relaxed">
            The most secure and scalable multi-chain marketplace for crypto
            collectibles and NFT
          </p>
          <p className="text-sm">© All rights reserved. 2025</p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h3 className="text-white text-lg font-medium mb-6">Quick Links</h3>
          <ul className="space-y-4">
            {/* Quick links with tooltips */}
            {Object.keys(tooltipContent).map((linkName) => (
              <li key={linkName} className="relative">
                <a
               href={linkName === "About us" ? "/aboutus" : linkName === "FAQs" ? "/faq" : "#"}
                  className="hover:text-white transition-colors"
                  onMouseEnter={() => showTooltip(linkName)}
                  onMouseLeave={hideTooltip}
                >
                  {linkName}
                </a>
                {activeTooltip === linkName && (
                  <div className="absolute z-50 left-0 mt-1 w-64 px-4 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg">
                    {tooltipContent[linkName]}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Communities Section */}
          <div>
            <h3 className="text-white text-lg font-medium my-6">Communities</h3>
            <div className="space-y-6 list-none">
              <li>
                <a
                  href="https://discord.gg/3tkGsgTs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <i className="fab fa-discord"></i> Discord
                </a>
              </li>

              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61563622507992"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <i className="fab fa-facebook"></i> Facebook
                </a>
              </li>

              <li>
                <a
                  href="https://x.com/DurchExc?t=TK8k5YBQoCyjgJdUY4Au3g&s=09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <i className="fab fa-twitter"></i> X (formerly Twitter)
                </a>
              </li>

              <li>
                <a
                  href="https://t.me/durchex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <i className="fab fa-telegram"></i> Telegram
                </a>
              </li>

              <li>
                <a
                  href="https://medium.com/@durchex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  <i className="fab fa-medium"></i> Medium
                </a>
              </li>
            </div>
          </div>

          {/* Contact Support Section */}
          <div>
            <h3 className="text-white text-lg font-medium my-6">
              Contact support
            </h3>
            <div className="space-y-4">
              <div>
                <a className="hover:text-white transition-colors">
                  <i className="fas fa-phone"></i> +15617227159
                </a>
              </div>
              <div>
                <a
                  href="mailto:support@durchex.com"
                  className="hover:text-white transition-colors"
                >
                  <i className="fas fa-envelope pr-2"></i>
                  support@durchex.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Blockchains Column */}
        <div>
          <h3 className="text-white text-lg font-medium mb-6">
            Supported Blockchains
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-white mb-4">Layer 1 Blockchains:</h4>
              <ul className="space-y-4">
                <li>Ethereum</li>
                <li>BNB chain</li>
                <li>Solana</li>
                <li>Avalanche</li>
                <li>Algorand</li>
                <li>Aptos</li>
                <li>SUI</li>
                <li>Fantom</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Layer 2 Blockchains:</h4>
              <ul className="space-y-4">
                <li>Polygon</li>
                <li>Base</li>
                <li>zkSync</li>
                <li>Arbitrum</li>
                <li>Optimism</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Accepted Payments Column */}
        <div>
          <h3 className="text-white text-lg font-medium mb-6">
            Accepted Payments
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-white mb-4">Tokens</h4>
              <ul className="space-y-4">
                <li>USDT</li>
                <li>USDC</li>
                <li>MATIC</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Fiat Payments</h4>
              <ul className="space-y-4">
                <li>Moonpay</li>
                <li>Transak</li>
                <li>Ramp</li>
                <li>Stripe</li>
                <li>Paypal</li>
                <li>Mercuryo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;