import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { HiChevronDown } from "react-icons/hi";
import { BiLinkAlt } from "react-icons/bi";
import LOGO from "../assets/LOGO.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState("Polygon");
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

  return (
    <nav className="bg-black px-4 py-10">
      <div className="max-w7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src={LOGO} alt="DURCHEX Logo" className="h-8 w-8" />
          <div className="text-violet-500 font-bold text-2xl">DURCHEX</div>
        </div>

        <div className="flex justify-center">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 w-[500px]">
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

        <div className="flex gap-5">
          <button className="flex items-center gap-2 text-white bg-[#8149F4] p-2 rounded-lg hover:bg-purple-700 transition-colors">
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>
    </nav>
  );
}