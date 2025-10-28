import React, { useContext, useState } from "react";
import { BsStars } from "react-icons/bs";

import { Toaster } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import { ICOContent } from "../Context/index.jsx";
import Header from "../components/Header.jsx";

function ListNft() {
    const contexts = useContext(ICOContent);
      const {
          accountBalance,
          setAccountBalance,
          address,
          listNFT,
          setMintingFee,
          connectWallet,
      } = contexts;

  // const { id } = useParams();
  const Navigate = useNavigate();

  const [formNftData, setFormNftData] = useState({
    price: "",
    tokenId: " ",
    image: "",
  });
  // useEffect(() => {
  //   Fetching();
  // }, [id]);

  // useEffect(() => {
  //   if (UserEthAccount) {
  //     IsCheckOwner();
  //   }
  // }, [UserEthAccount]);


  const HandleOnChange = (e) => {
    setFormNftData({
      ...formNftData,
      [e.target.name]: e.target.value,
    });
  };


  // const IsCheckOwner = async () => {
  //   try {
  //     const result = await CheckIsOwner(id, UserEthAccount);
  //     setNftAuth(result);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const HandleListing = async (event) => {
    event.preventDefault();
    const vendorNFTAddress = import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS;
      console.log("🚀 ~ HandleMintNFT ~ vendorNFTAddress:", vendorNFTAddress);

    try {
        await listNFT(vendorNFTAddress, formNftData.tokenId, formNftData.price)
          .then((response) => {
            SuccessToast(
              <div>
                NFT Listed successfully 🎉 ! <br />
              </div>
            );
            setTimeout(() => {
              Navigate("/");
            }, 3000);
          })
          .catch((error) => {
            console.error(error);
            ErrorToast(<div>Something error happen try agin 💔 !</div>);
          });
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white">
     <Header/>
    <div className="min-h-screen px-10 bg-black text-white">
      <Toaster position="left" />
      <h1 className="transition-all text-white/90 font-semibold text-xl sm:text-2xl mt-4">
        List your NFT{" "}
        <span className="transition-all text-xl font-medium text-white/60">
          {" "}
          
        </span>
        <br />
      </h1>
      <div className="flex flex-row gap-2 items-center text-sm sm:text-base sm:mt-4  text-white/70">
        <BsStars />
        <p>List your NFT, buyers are waiting </p>
      </div>
      <Link
        // to={`/nft/${id}`}
        className="p-1 w-min py-3 cursor-pointer hover:bg-pink-600 font-semibold text-darkBlue-400 text-xs hover:text-white text-white/80 bg-white/840 bg-darkBlue-300 backdrop-blur-lg flex items-center justify-center  rounded-lg hover:scale-90 transition-all px-6 h-full "
      >
        View
      </Link>
      <div className="flex lg:flex-row flex-col gap-8">
       
        <div className="flex-auto">
          <form onSubmit={HandleListing} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
            <label
                htmlFor=""
                className="text-black font-semibold text-sm sm:text-base"
              >
                tokenId *
              </label>
              <input
                className="bg-gray-50 text-gray-900 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-black text-sm sm:text-base"
                type="text"
                placeholder="tokenId"
                name="tokenId"
                defaultValue={formNftData.price}
                onChange={HandleOnChange}
                required
              />
            </div>

            <div className="flex flex-col gap-4">
            <label
                htmlFor=""
                className="text-white/70 font-semibold text-sm sm:text-base"
              >
                Price ( in USD ) *
              </label>
              <input
                className="bg-gray-50 text-gray-900 rounded-lg focus:ring-0 focus:dark:border-pink-500 block w-full p-2.5 dark:bg-darkBlue-600 dark:border-gray-600/30 dark:placeholder-gray-500 dark:text-black text-sm sm:text-base"
                type="text"
                placeholder="Price"
                name="price"
                defaultValue={formNftData.price}
                onChange={HandleOnChange}
                required
              />
            </div>
            <div className="flex gap-5 mb-5">
              {formNftData.price ? (
                <button
                  type="submit"
                  className="text-white bg-pink-700 hover:bg-pink-800 focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-pink-600 dark:hover:bg-pink-700 dark:focus:ring-pink-800"
                >
                  Submit
                </button>
              ) : (
                <button
                  disabled
                  className="cursor-not-allowed text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                >
                  Submit
                </button>
              )}
              <Link
                type="submit"
                to="/myProfile"
                className="text-white bg-darkBlue-700 hover:bg-darkBlue-800 focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 cursor-pointer text-center dark:bg-darkBlue-500 dark:hover:bg-darkBlue-600 dark:focus:ring-darkBlue-400"
              >
                Cancel
              </Link>
            </div>
          </form>
          <div className="flex justify-between gap-6 flex-col sm:flex-row">
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ListNft;
