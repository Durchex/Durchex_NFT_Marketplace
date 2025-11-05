import LOGO from "../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiShoppingBag } from "react-icons/fi";

export default function Navbar() {
  const location = useLocation();

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
          </div>
        </div>

        <div className="flex gap-5">
          {/* Cart Icon */}
          <button className="text-gray-300 hover:text-white">
            <FiShoppingBag className="w-6 h-6" />
          </button>

          {/* Profile Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-violet-700 via-blue-400 to-fuchsia-700"></div>
        </div>
      </div>
    </nav>
  );
}