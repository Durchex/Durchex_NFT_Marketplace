import React, { useState, useEffect } from "react";
import { FaEthereum, FaRegHeart } from "react-icons/fa";
import { BuyNFT } from "../../../hooks/ContractControllers/useBuyNFT";
import store from "../../../app/redux/ReduxStore";
import { SuccessToast } from "../../../app/Toast/Success";
import { Toaster } from "react-hot-toast";
import { ErrorToast } from "../../../app/Toast/Error";
import { ethereumUsd } from "../../../hooks/useEtherUsdPrice";
import { Tooltip } from "flowbite-react";

function NftBuy({ price, nftId, ComponentLoad, isListed }) {
  const [usdPrice, setUsdPrice] = useState(0);

  useEffect(() => {
    const converting = async () => {
      setUsdPrice(await ethereumUsd());
    };
    converting();
  }, []);

  const HandleBuyNFT = async () => {
    try {
      const response = await BuyNFT(nftId);
      ComponentLoad((pre) => pre + 1);
      SuccessToast(
        <div>
          NFT Buy successfully 🎉 ! <br />
        </div>
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg p-4 flex-aut border-darkBlue-300/50 border-[1px] bg-darkBlue-500/70 sm:w-auto w-full">
      <Toaster position="leftbottom" />
      <span className="dark:text-white/80 sm:text-base text-sm font-semibold">
        Current Price
      </span>
      <div className="flex gap-3 items-baseline">
        <Tooltip
          className="dark:bg-darkBlue-400 text-pink-500"
          theme={{
            arrow: {
              style: {
                dark: "bg-gray-900 dark:bg-darkBlue-400",
                light: "bg-white",
              },
            },
          }}
          content={`${price} ETH`}
        >
          <b className="text-2xl cursor-pointer sm:text-5xl dark:text-white/90">
            ~{Number(price).toFixed(4)} ETH
          </b>
        </Tooltip>
        <Tooltip
          className="dark:bg-darkBlue-400 text-pink-500"
          theme={{
            arrow: {
              style: {
                dark: "bg-gray-900 dark:bg-darkBlue-400",
                light: "bg-white",
              },
            },
          }}
          content={`${usdPrice * price} $`}
        >
          <span className="dark:text-white/60 cursor-pointer text-sm sm:text-base">
            (${Number(usdPrice * price).toFixed(1)})
          </span>
        </Tooltip>
      </div>
      <b className="dark:text-white/50 font-normal text-sm sm:text-base">
        Rare NFT with Best Price!
      </b>
      {isListed ? (
        <button
          type="button"
          className="py-2.5 w-full px-5 text-sm sm:text-lg justify-evenly font-medium flex items-center gap-3 text-white focus:outline-none bg-white border-2 border-purple-600 hover:bg-purple-50 hover:text-purple-700 focus:z-10 focus:ring-4 focus:ring-purple-200 transition-colors rounded-lg"
          onClick={HandleBuyNFT}
        >
          <span className="text-purple-600">Buy now for</span>
          <div className="flex gap-2 items-center text-purple-600">
            <FaEthereum /> {Number(price).toFixed(4)} ETH
          </div>
        </button>
      ) : (
        <button
          onClick={() => ErrorToast("This NFT is not listed")}
          type="button"
          className="py-2.5 w-full px-5 text-sm sm:text-lg justify-evenly font-medium flex items-center gap-3 text-gray-400 focus:outline-none bg-white border-2 border-gray-300 rounded-lg cursor-not-allowed"
        >
          This NFT is not listed
        </button>
      )}
    </div>
  );
}

export default NftBuy;