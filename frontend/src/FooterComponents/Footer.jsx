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
    <footer className="bg-[#121212] text-gray-400 py-8 md:py-16 px-4 md:px-8 relative overflow-hidden">
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
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 relative z-10">
        {/* Brand Column */}
        <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-6">
          <div className="flex items-center space-x-2">
            <img
              src={LOGO || "/placeholder.svg"}
              alt="DURCHEX Logo"
              className="h-6 w-6 md:h-8 md:w-8"
            />
            <span className="text-white text-lg md:text-xl font-semibold">DURCHEX</span>
          </div>
          <p className="text-xs md:text-sm leading-relaxed">
            The most secure and scalable multi-chain marketplace for crypto
            collectibles and NFT
          </p>
          <p className="text-xs md:text-sm">© All rights reserved. 2025</p>
        </div>

        {/* Quick Links Column */}
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-white text-base md:text-lg font-medium mb-4 md:mb-6">Quick Links</h3>
          <ul className="space-y-2 md:space-y-4">
            {/* Quick links with tooltips */}
            {Object.keys(tooltipContent).map((linkName) => (
              <li key={linkName} className="relative">
                <a
                  href={linkName === "About us" ? "/aboutus" : linkName === "FAQs" ? "/faq" : "#"}
                  className="hover:text-white transition-colors text-sm md:text-base"
                  onMouseEnter={() => showTooltip(linkName)}
                  onMouseLeave={hideTooltip}
                >
                  {linkName}
                </a>
                {activeTooltip === linkName && (
                  <div className="absolute z-50 left-0 mt-1 w-64 px-4 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg hidden md:block">
                    {tooltipContent[linkName]}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Communities & Contact - Combined on Mobile */}
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-white text-base md:text-lg font-medium mb-4 md:mb-6">Communities</h3>
          <div className="space-y-2 md:space-y-4 list-none">
            <li>
              <a
                href="https://discord.gg/3tkGsgTs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors text-sm md:text-base"
              >
                <i className="fab fa-discord"></i> Discord
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/profile.php?id=61563622507992"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors text-sm md:text-base"
              >
                <i className="fab fa-facebook"></i> Facebook
              </a>
            </li>
            <li>
              <a
                href="https://x.com/DurchExc?t=TK8k5YBQoCyjgJdUY4Au3g&s=09"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors text-sm md:text-base"
              >
                <i className="fab fa-twitter"></i> X
              </a>
            </li>
            <li>
              <a
                href="https://t.me/durchex"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors text-sm md:text-base"
              >
                <i className="fab fa-telegram"></i> Telegram
              </a>
            </li>
            <li>
              <a
                href="https://medium.com/@durchex"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors text-sm md:text-base"
              >
                <i className="fab fa-medium"></i> Medium
              </a>
            </li>
          </div>

          <h3 className="text-white text-base md:text-lg font-medium mt-6 mb-4 md:mb-6">
            Contact support
          </h3>
          <div className="space-y-2 md:space-y-4">
            <div>
              <a className="hover:text-white transition-colors text-sm md:text-base">
                <i className="fas fa-phone"></i> +15617227159
              </a>
            </div>
            <div>
              <a
                href="mailto:support@durchex.com"
                className="hover:text-white transition-colors text-sm md:text-base"
              >
                <i className="fas fa-envelope pr-2"></i>
                support@durchex.com
              </a>
            </div>
          </div>
        </div>

        {/* Supported Blockchains Column */}
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-white text-base md:text-lg font-medium mb-4 md:mb-6">
            Supported Blockchains
          </h3>
          <div className="space-y-3 md:space-y-6">
            <div>
              <h4 className="text-white mb-2 md:mb-4 text-sm md:text-base">Layer 1:</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-base">
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
              <h4 className="text-white mb-2 md:mb-4 text-sm md:text-base">Layer 2:</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-base">
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
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-white text-base md:text-lg font-medium mb-4 md:mb-6">
            Accepted Payments
          </h3>
          <div className="space-y-3 md:space-y-6">
            <div>
              <h4 className="text-white mb-2 md:mb-4 text-sm md:text-base">Tokens</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-base">
                <li>USDT</li>
                <li>USDC</li>
                <li>MATIC</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-2 md:mb-4 text-sm md:text-base">Fiat Payments</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-base">
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