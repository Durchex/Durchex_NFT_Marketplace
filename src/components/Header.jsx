import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiShoppingBag } from "react-icons/fi";
import { HiChevronDown } from "react-icons/hi";
import { BiLinkAlt } from "react-icons/bi";
import { HiMenu, HiX } from "react-icons/hi";
import LOGO from "../assets/LOGO.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState("Polygon");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const chains = [
    "Polygon",
    "Ethereum",
    "Binance Smart Chain",
    "Solana",
    "Avalanche",
  ];
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
    <nav className="bg-black px-4 py-6 md:py-10 relative">
      <div className="max-w7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 z-10">
          <img src={LOGO} alt="DURCHEX Logo" className="h-8 w-8" />
          <div className="text-violet-500 font-bold text-xl md:text-2xl">
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

            {/* Blockchain Selector */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-[#19171C] text-white px-4 py-2 rounded-lg"
              >
                <BiLinkAlt className="text-violet-500" />
                <span>{selectedChain}</span>
                <HiChevronDown
                  className={`transform transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg py-1 z-50">
                  {chains.map((chain) => (
                    <button
                      key={chain}
                      onClick={() => {
                        setSelectedChain(chain);
                        setIsOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      {chain}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Cart and Profile */}
        <div className="hidden md:flex gap-5 items-center">
          <Link to="/admin">
            <button className="text-gray-300 hover:text-white">
              <FiShoppingBag className="w-6 h-6" />
            </button>
          </Link>

          <Link to="/profile">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-violet-700 via-blue-400 to-fuchsia-700"></div>
          </Link>
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

            {/* Mobile Blockchain Selector */}
            <div className="py-3 border-b border-gray-800">
              <div className="text-gray-400 text-sm mb-2">
                Select Blockchain
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-2 bg-[#19171C] text-white px-4 py-2 rounded-lg w-full"
                >
                  <BiLinkAlt className="text-violet-500" />
                  <span>{selectedChain}</span>
                  <HiChevronDown
                    className={`ml-auto transform transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-gray-900 rounded-lg shadow-lg py-1 z-50">
                    {chains.map((chain) => (
                      <button
                        key={chain}
                        onClick={() => {
                          setSelectedChain(chain);
                          setIsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        {chain}
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
