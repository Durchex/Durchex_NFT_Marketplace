import React, { useContext, useState } from "react";
import { Toaster } from "react-hot-toast";
import { BsStars } from "react-icons/bs";
import { ICOContent } from "../Context/index.jsx";

import { Link, useNavigate } from "react-router-dom";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import { getCurrencySymbol } from "../Context/constants.jsx";


const ListNft = () => {
  const contexts = useContext(ICOContent);
  const { listNFT, contractAddressMarketplace, selectedChain } = contexts;
  const navigate = useNavigate();
  const [formNftData, setFormNftData] = useState({ price: "", tokenId: "" });

  const HandleOnChange = (e) => {
    setFormNftData({ ...formNftData, [e.target.name]: e.target.value });
  };

  const HandleListing = async (event) => {
    const nftContractAddress = contractAddressMarketplace;
        if(!nftContractAddress) return ErrorToast("No contract Address")
        console.log("🚀 ~ HandleMintNFT ~ nftmarketplace:", nftContractAddress)
    event.preventDefault();
    try {
      await listNFT(
        nftContractAddress,
        formNftData.tokenId,
        formNftData.price
      )
        .then((response) => {
          if (response.status === 1) {
            SuccessToast(
              <div className="font-bold">NFT Listed successfully 🎉 !</div>
            );
            setTimeout(() => navigate("/"), 3000);
          } else {
            ErrorToast(<div>Something went wrong, try again 💔 !</div>);
            // return null;
          }
        })
        .catch(() =>
          ErrorToast(<div>Something went wrong, try again 💔 !</div>)
        );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <Toaster position="left" />

        {/* Header Section */}
        <div className="max-w-xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            List Your NFT
          </h1>
          <div className="flex items-center gap-2 mt-4 text-gray-400">
            <BsStars className="text-pink-400" />
            <p className="text-sm md:text-base">Reach buyers instantly</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-xl mx-auto">
          <form onSubmit={HandleListing} className="space-y-6">
            {/* Token ID Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Token ID *
              </label>
              <input
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-pink-500 text-white placeholder-gray-500 transition-all duration-200"
                type="text"
                placeholder="Enter token ID"
                name="tokenId"
                defaultValue={formNftData.tokenId}
                onChange={HandleOnChange}
                required
              />
            </div>

            {/* Price Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
              {`Enter price in ${getCurrencySymbol(selectedChain)}`} *
              </label>
              <input
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-pink-500 text-white placeholder-gray-500 transition-all duration-200"
                type="text"
                placeholder={`Enter price in ${getCurrencySymbol(selectedChain)}`}
                name="price"
                defaultValue={formNftData.price}
                onChange={HandleOnChange}
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={!formNftData.price}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-medium text-white hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-pink-500/20"
              >
                List NFT
              </button>
              <Link
                to="/myProfile"
                className="flex-1 px-6 py-3 bg-gray-800/50 border border-gray-700 rounded-xl font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* View Link */}
          <div className="mt-10 text-center">
            <Link className="inline-block px-6 py-2 bg-gray-800/30 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200">
              View Listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListNft