import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiShoppingBag } from "react-icons/fi";
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
    { name: "Stats", path: "/stats" },
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
          {/* Cart Icon */}
          <button className="text-gray-300 hover:text-white">
            <FiShoppingBag className="w-6 h-6" />
          </button>

          {/* Profile Icon */}
          <Link to="/profile">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-violet-700 via-blue-400 to-fuchsia-700"></div>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// // import metamask from "../assets/metamask.png";
// import { Link } from "react-router-dom";
// import { ICOContent } from "../Context/index";
// import { HiMenu, HiX } from "react-icons/hi";
// import { useContext, useState } from "react";

// function Header() {
//   const contexts = useContext(ICOContent);
//   const {
//     shortenAddress,
//     accountBalance,
//     // setAccountBalance,
//     address,
//     connectWallet,
//   } = contexts;
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   return (
//     <header className="px-6 py-4">
//       <div className="flex items-center justify-between">
//         <div className="flex gap-2 md:hidden bloc">
//           <img src={LOGO} alt="" />
//           <h1 className="text-2xl font-bold">DURCHEX</h1>
//         </div>

//         <button
//           className="lg:hidden text-white"
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//         >
//           {isMenuOpen ? (
//             <HiX className="h-6 w-6" />
//           ) : (
//             <HiMenu className="h-6 w-6" />
//           )}
//         </button>
//       </div>
//       <div className="mt-4 lg:mt-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
//         {/* DURCHEX and Search Bar */}
//         <div className=" hidden md:block">
//           <div className="flex gap-2">
//             <img src={LOGO} alt="" />
//             <h1 className="text-2xl font-bold">DURCHEX</h1>
//           </div>
//         </div>
//         <div className="flex items-center space-x-6 w-full lg:w-auto">
//           <div className="w-full">
//             <div className="flex justify-center">
//               <input
//                 type="text"
//                 placeholder="Search for collections, NFTs or Artists"
//                 className="md:w-[500px] w-full bg-transparent border border-[#79718A] rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
//               />
//             </div>
//           </div>
//         </div>
//         {/* Navigation */}
//         <nav
//           className={`${
//             isMenuOpen ? "block" : "hidden"
//           } mt-4 lg:mt-0 lg:flex items-center space-y-4 lg:space-y-0 lg:space-x-6 text-center`}
//         >
//           <Link
//             to="/"
//             className="block hover:text-purple-500 transition-colors lg:inline-block"
//           >
//             Explore
//           </Link>
//           {/* <Link to="/create"> */}
//           <Link
//             to="/create"
//             className="block hover:text-purple-500 transition-colors lg:inline-block"
//           >
//             Create
//           </Link>
//           {/* </Link> */}

//           {/* <Link to="/stats"> */}
//           <Link
//             to="/stats"
//             className="block hover:text-purple-500 transition-colors lg:inline-block"
//           >
//             Stats
//           </Link>
//           {/* <Link to="/listnft"> */}
//           {/* <Link
//             to="/listnft"
//             className="block hover:text-purple-500 transition-colors lg:inline-block"
//           >
//             List NFTs
//           </Link> */}
//           {/* <Link to="/mynfts"> */}
//           {/* <Link
//             to="/mynfts"
//             className="block hover:text-purple-500 transition-colors lg:inline-block"
//           >
//             MyNfts
//           </Link> */}
//           {/* <Link to="/admin"> */}
//           {/* <Link
//             to="/admin"
//             className="block hover:text-purple-500 transition-colors lg:inline-block"
//           >
//             Admin
//           </Link> */}
//           {/* </Link> */}
//           {address ? (
//             <li>
//               <button className="bg-[#8149F4] hover:bg-purple-700 text-white gap-2 font-bold py-3 px-4 rounded-lg flex items-center mx-auto lg:mx-0">
//                 {`${shortenAddress(address)} : ${accountBalance?.slice(0, 5)}`}
//               </button>
//             </li>
//           ) : (
//             <button
//               className="bg-[#8149F4] hover:bg-purple-700 text-white gap-2 font-bold py-3 px-4 rounded-lg flex items-center mx-auto lg:mx-0"
//               onClick={connectWallet}
//             >
//               {/* <img src={metamask} alt="" /> */}
//               Connect Wallet
//             </button>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;
