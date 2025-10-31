import PropTypes from "prop-types";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { ICOContent } from "../Context";
import { ethers } from "ethers";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";

const NFTCard3 = ({
  collectionName,
  collection,
  currentlyListed,
  itemId,
  nftContract,
  image,
  metadata,
  owner,
  price,
  seller,
  tokenId,
  name,
  network,
}) => {
  const contexts = useContext(ICOContent);
  const { buyNFT, address, shortenAddress, setCartItems, cartItems, fetchCartItems } = contexts;

  // const prices = ethers.utils.formatEther(price);
  const prices = price;
 
  const handleBuy = async () => {
    if (!address) return ErrorToast("Connect your Wallet");
    const vendorNFTAddress = import.meta.env
      .VITE_APP_VENDORNFT_CONTRACT_ADDRESS;

    try {
      await buyNFT(vendorNFTAddress, itemId, price)
        .then(() => {
          SuccessToast("NFT added successfully!");
        })
        .catch((error) => {
          console.error(error);
          ErrorToast("Something went wrong! Try again.");
        });
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddToCart = async (event) => {
    event.stopPropagation(); // Prevents event bubbling
    event.preventDefault();

    const newItem = {
      nftId: itemId,
      contractAddress: nftContract, // contract address for the NFT
      name: name,
      price: ethers.utils.formatEther(price),
      collection: collectionName,
    };

    if(!address) {
      return ErrorToast("Please connect your wallet");
    }

    // // Add item to the state locally
    // setCartItems((prevItems) => {
    //   const updatedCart = [...prevItems, newItem];
    //   localStorage.setItem("cartItems", JSON.stringify(updatedCart)); // Store in localStorage
    //   return updatedCart;
    // });
    const addresses = address.toLowerCase().toString();

    try {
      // Send POST request to the API to save the item to the database
      const response = await fetch("https://backend-2wkx.onrender.com/api/v1/cart/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: addresses,
          nftId: Number(newItem.nftId),
          contractAddress: newItem.contractAddress.toString(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems((prevItems) => {
          const updatedCart = [...prevItems, newItem];
          // Update localStorage to reflect the new cart state
          localStorage.setItem("cartItems", JSON.stringify(updatedCart));
          // return updatedCart;
        });
        console.log("Item added to cart successfully in the database", data);
        await fetchCartItems();
        
        SuccessToast("Item added to cart successfully!");
      } else {
        console.error("Failed to add item to cart in the database", data);
        ErrorToast("Failed to add item to cart, please try again.");
      }
    } catch (error) {
      console.error("Error adding item to cart in database", error);
      ErrorToast("Error adding item to cart, please try again.");
    }
  };

  const addToCart = (item) => {
    // setCartItems([...cartItems, item]);
    setCartItems((prevItems) => [...prevItems, item]);
  };

  return (
    <div className="bg-gray- rounded-lg overflow-hidden relative shadow-md hover:shadow-lg transition-shadow duration-300  box-border">
      <Link to={`/nft/${tokenId}/${itemId}/${price}`} className="block">
      {/* to={``} */}
        {/* Image Section */}
        <div className="h-[230px] relative">
          <img src={image} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
        </div>

        {/* NFT Details */}
        <div className="px-2 py-1 bg-gray-950/10">
          <div className="flex justify-between items-center">
            <h4 className="text-white font-bold text-xs">{collection}</h4>
            {/* <p className="text-gray-400 text-sm">{collection}</p> */}
            {/* Price */}
          </div>
          {/* <div className="flex justify-between text-xs items-center">
            <span className="text-green-100 text-xs font-bold">{prices}</span>
            <p><b>Item ID:</b></p>
            <p>#233{itemId}</p>
          </div> */}
        </div>
      </Link>

      {/* Add to Cart Button */}
      {/* <button
        onClick={(e) => handleAddToCart(e)}
        // disabled
        className="w-full bg-purple-900 hover:bg-purple-950 text-white text-lg font-bold py-1 transition duration-300"
      >
        Add to Cart
      </button> */}
    </div>
  );
};

NFTCard3.propTypes = {
  // collectionName: PropTypes.string.isRequired,
  // name: PropTypes.string.isRequired,
};

export default NFTCard3;
