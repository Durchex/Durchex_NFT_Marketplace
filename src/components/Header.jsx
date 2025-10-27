import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiShoppingBag, FiUser } from "react-icons/fi";
import { HiChevronDown } from "react-icons/hi";
import { HiMenu, HiX } from "react-icons/hi";
import { useCart } from "../Context/CartContext";
import { useNetwork } from "../Context/NetworkContext";
import EnhancedWalletConnect from "./EnhancedWalletConnect";
import LOGO from "../assets/LOGO.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { getCartItemCount } = useCart();
  const { selectedNetwork, networks, switchNetwork } = useNetwork();
  // Navigation items array
  const navItems = [
    { name: "Explore", path: "/" },
    { name: "Create", path: "/studio" },
    // { name: "Stats", path: "/stats" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  return (
    <nav className="bg-black/95 backdrop-blur-md border-b border-gray-800/50 px-4 py-4 md:py-6 relative sticky top-0 z-40 w-full">
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
          >
            <FiSearch className="w-5 h-5" />
          </button>
          <Link to="/admin" className="text-gray-300 hover:text-white p-2 mr-1">
            <FiShoppingBag className="w-5 h-5" />
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="text-gray-300 hover:text-white p-2 bg-[#19171C] rounded-lg"
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
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold hidden">
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
                        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold hidden">
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

          {/* Profile */}
          <Link to="/user-profile">
            <button className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <FiUser className="w-5 h-5" />
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
            <EnhancedWalletConnect />
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-40 flex items-start pt-20 px-4">
          <div className="w-full max-w-xl mx-auto">
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
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-30 flex flex-col pt-20 pb-4 px-6">
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={toggleMobileMenu}
                className={`text-xl font-medium px-1 py-3 border-b border-gray-800 ${
                  location.pathname === item.path
                    ? "text-[#8149F4]"
                    : "text-gray-300"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile Wallet Connect */}
            <div className="py-3 border-b border-gray-800">
              <div className="text-gray-400 text-sm mb-2">
                Wallet Connection
              </div>
              <EnhancedWalletConnect />
            </div>

            {/* Mobile Network Selector */}
            <div className="py-3 border-b border-gray-800">
              <div className="text-gray-400 text-sm mb-2 font-display">
                Select Network
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-3 bg-[#19171C] text-white px-4 py-3 rounded-lg w-full hover:bg-gray-800 transition-colors"
                >
                  <img 
                    src={selectedNetwork?.icon || networks[0].icon} 
                    alt={selectedNetwork?.name || networks[0].name}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-display font-medium">{selectedNetwork?.name || networks[0].name}</div>
                    <div className="text-xs text-gray-400">{selectedNetwork?.symbol || networks[0].symbol}</div>
                  </div>
                  <HiChevronDown
                    className={`transform transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                    {networks.map((network) => (
                      <button
                        key={network.name}
                        onClick={async () => {
                          await switchNetwork(network);
                          setIsOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <img 
                          src={network.icon} 
                          alt={network.name}
                          className="w-6 h-6 rounded-full"
                        />
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

            {/* Profile Link in Mobile Menu */}
            <Link
              to="/profile"
              onClick={toggleMobileMenu}
              className="flex items-center space-x-3 py-3 border-b border-gray-800"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-violet-700 via-blue-400 to-fuchsia-700"></div>
              <span className="text-gray-300">My Profile</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// import { useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { FiSearch, FiShoppingBag } from "react-icons/fi";
// import { HiChevronDown } from "react-icons/hi";
// import { BiLinkAlt } from "react-icons/bi";
// import LOGO from "../assets/LOGO.png";

// export default function Navbar() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedChain, setSelectedChain] = useState("Polygon");
//   const location = useLocation();

//   const chains = [
//     "Polygon",
//     "Ethereum",
//     "Binance Smart Chain",
//     "Solana",
//     "Avalanche",
//   ];
//   // Navigation items array
//   const navItems = [
//     { name: "Explore", path: "/" },
//     { name: "Create", path: "/studio" },
//     // { name: "Stats", path: "/stats" },
//   ];

//   return (
//     <nav className="bg-black px-4 py-10">
//       <div className="max-w7xl mx-auto flex items-center justify-between">
//         {/* Logo */}
//         <div className="flex items-center space-x-2">
//           <img src={LOGO} alt="DURCHEX Logo" className="h-8 w-8" />
//           <div className="text-violet-500 font-bold text-2xl">DURCHEX</div>
//         </div>

//         <div className="flex justify-center">
//           {/* Search Bar */}
//           <div className="flex-1 max-w-2xl mx-4 w-[500px]">
//             <div className="relative">
//               <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search for collections, NFTs or Artists"
//                 className="w-full bg-transparent border border-[#4A4554] rounded-lg pl-10 pr-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
//               />
//             </div>
//           </div>

//           {/* Navigation Items */}
//           <div className="flex items-center space-x-6 font-medium">
//             {navItems.map((item) => (
//               <Link
//                 key={item.name}
//                 to={item.path}
//                 className={`relative px-1 py-2 text-gray-300 hover:text-white group ${
//                   location.pathname === item.path ? "text-[#8149F4]" : ""
//                 }`}
//               >
//                 {item.name}
//                 <span
//                   className={`absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 transform origin-left transition-transform duration-300 ease-out ${
//                     location.pathname === item.path
//                       ? "scale-x-100"
//                       : "scale-x-0 group-hover:scale-x-100"
//                   }`}
//                 />
//               </Link>
//             ))}

//             {/* Blockchain Selector */}
//             <div className="relative">
//               <button
//                 onClick={() => setIsOpen(!isOpen)}
//                 className="flex items-center space-x-2 bg-[#19171C] text-white px-4 py-2 rounded-lg"
//               >
//                 <BiLinkAlt className="text-violet-500" />
//                 <span>{selectedChain}</span>
//                 <HiChevronDown
//                   className={`transform transition-transform ${
//                     isOpen ? "rotate-180" : ""
//                   }`}
//                 />
//               </button>

//               {/* Dropdown Menu */}
//               {isOpen && (
//                 <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg py-1 z-50">
//                   {chains.map((chain) => (
//                     <button
//                       key={chain}
//                       onClick={() => {
//                         setSelectedChain(chain);
//                         setIsOpen(false);
//                       }}
//                       className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
//                     >
//                       {chain}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-5 items-center">
//           {/* Cart Icon */}
//           <Link to="/admin">
//             <button className="text-gray-300 hover:text-white">
//               <FiShoppingBag className="w-6 h-6" />
//             </button>
//           </Link>

//           {/* Profile Icon */}
//           <Link to="/profile">
//             <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-violet-700 via-blue-400 to-fuchsia-700 mb-1"></div>
//           </Link>
//         </div>
//       </div>
//     </nav>
//   );
// }
