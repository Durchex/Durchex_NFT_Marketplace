import LOGO from "../assets/LOGO.png";

const Footer = () => {
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
            <img src={LOGO} alt="DURCHEX Logo" className="h-8 w-8" />
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
            <li>
              <a href="#" className="hover:text-white transition-colors">
                About us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Docs
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                FAQs
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Feature Requests
              </a>
            </li>
          </ul>

          {/* Communities Section */}
          <div>
            <h3 className="text-white text-lg font-medium my-6">Communities</h3>
            <div className=" space-y-6 list-none">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  <i className="fab fa-discord"></i> Discord
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition-colors">
                  <i className="fab fa-twitter"></i> X (formerly twitter)
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition-colors">
                  <i className="fab fa-telegram"></i> Telegram
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition-colors">
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
              <a
                href="mailto:discoveroffice@durchex.com"
                className="hover:text-white transition-colors"
              >
                discoveroffice@durchex.com
              </a>
              <p>+234 801 342 5496</p>
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

