import React, { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import { ICOContent } from "../Context";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";

const Admin = () => {
  const contexts = useContext(ICOContent);
  const {
    shortenAddress,
    address,
    withdraw,
    isAuthorizedVendor,
    getAllVendors,
    setMintingFee,
    removeVendor,
    addVendor,
    connectWallet,
    checkEligibleForAirdrop,
    updatePointsPerTransaction,
    updatePointThreshold,
    updateListingFee,
  } = contexts;

  const [listingFee, setListingFee] = useState("");
  const [mistingFee, setMistingFee] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorAddres, setVendorAddres] = useState("");
  const [pointsPerTransaction, setPointsPerTransaction] = useState("");
  const [pointThreshold, setPointThreshold] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userAddres, setUserAddres] = useState("");
  const [AllVendors, setAllVendors] = useState([]);
  const [airdropEligibility, setAirdropEligibility] = useState(null);
  const [authorisedVendor, setAuthorizedVendor] = useState(null);

  useEffect(() => {
    getAllVendors()
      .then((vendors) => {
        setAllVendors(vendors);
      })
      .catch((error) => {
        ErrorToast("Error fetching vendors:")
        console.log("Error fetching vendors: ", error);
      });
  }, []);

  const updateListingFees = () => {
    updateListingFee(listingFee);
  };

  const updateMistingFees = () => {
    setMintingFee(mistingFee);
  };

  const withdrawFunds = async () => {
    await withdraw();
    console.log("Withdrawing funds...");
  };

  const checkAirdropEligibility = async () => {
    const response = await checkEligibleForAirdrop(userAddress);
    setAirdropEligibility(response);
  };
  const checkAuthorizedVendor = async () => {
    const response = await isAuthorizedVendor(userAddres);
    console.log("🚀 ~ checkAirdropEligibility ~ response:", response);
    setAuthorizedVendor(response);
  };

  const HandleAddVendor = async (event) => {
    event.preventDefault();

    try {
      const vendorNFTAddress = import.meta.env
        .VITE_APP_VENDORNFT_CONTRACT_ADDRESS;
      console.log("🚀 ~ HandleMintNFT ~ vendorNFTAddress:", vendorNFTAddress);

      await addVendor(vendorAddress)
      .then((response) => {
        SuccessToast(
          <div>
            Vendor added successfully 🎉 
          </div>
        );
      })
      .catch((error) => {
        console.error(error);
        ErrorToast(<div>Something error happen try agin 💔 !</div>);
      });
    } catch (error) {
      console.error(error);
    }
  };
  const HandleRemoveVendor = async (event) => {
    event.preventDefault();

    try {
      await removeVendor(vendorAddres).then((response) => {
        SuccessToast(
          <div>
            Vendor Removed successfully 🎉 
          </div>
        );
      })
      .catch((error) => {
        console.error(error);
        ErrorToast(<div>Something error happen try agin 💔 !</div>);
      });
    } catch (error) {
      console.error(error);
    }
  };
  const HandleOnChange = (e) => {
    setVendorAddress(e.target.value);
  };
  const HandleOnChanges = (e) => {
    setVendorAddres(e.target.value);
  };

  const updatePointsPerTransactions = () => {
    updatePointsPerTransaction(pointsPerTransaction).then((response) => {
      SuccessToast(
        <div>
          Points successfully Updated 🎉 
        </div>
      );
    })
    .catch((error) => {
      console.error(error);
      ErrorToast(<div>Something error happen try agin 💔 !</div>);
    });
    console.log("Setting points per transaction to:", pointsPerTransaction);
  };

  const updatePointThresholds = () => {
    // Call contract function to set point threshold
    updatePointThreshold(pointThreshold).then((response) => {
      if(response){
      SuccessToast(

        <div>
          Point Threshold successfully Updated 🎉 
        </div>
      );
    }
    })
    .catch((error) => {
      console.error(error);
      ErrorToast(<div>Something error happen try agin 💔 !</div>);
    });
  };

  return (
    <div className="min-h-screen bg-black w-min-7xl text-white">
      <Header />
      <h1 className="text-2xl mx-auto font-bold mb-4">
        Contract Interaction Interface
      </h1>

      <div className="max-w-6xl mx-auto mt-5">
        {/* add vendor */}
        <div className="mb-6 p-4  rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Add Vendor</h2>
          <input
            type="text"
            className="border p-2 rounded text-black w-full mb-2"
            placeholder="Enter Vendor address"
            value={vendorAddress}
            onChange={HandleOnChange}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={HandleAddVendor}
          >
            Add Vendor
          </button>
        </div>
        {/* Remove vendor */}
        <div className="mb-6 p-4  rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Remove Vendor</h2>
          <input
            type="text"
            className="border p-2 rounded text-black w-full mb-2"
            placeholder="Enter Vendor address"
            value={vendorAddres}
            onChange={HandleOnChanges}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={HandleRemoveVendor}
          >
            Remove Vendor
          </button>
        </div>

        {/* Update Minting Fee */}
        <div className="mb-6 p-4  rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Update Mint Fee</h2>
          <input
            type="number"
            className="border p-2 rounded text-black w-full mb-2"
            placeholder="Enter new listing fee"
            value={mistingFee}
            onChange={(e) => setMistingFee(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={updateMistingFees}
          >
            Update Minting Fee
          </button>
        </div>
        {/* Update Listing Fee */}
        <div className="mb-6 p-4  rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Update Listing Fee</h2>
          <input
            type="number"
            className="border p-2 rounded text-black w-full mb-2"
            placeholder="Enter new listing fee"
            value={listingFee}
            onChange={(e) => setListingFee(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={updateListingFees}
          >
            Update Listing Fee
          </button>
        </div>

        {/* Withdraw Funds */}
        <div className="mb-6 p-4  rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Withdraw Funds</h2>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={withdrawFunds}
          >
            Withdraw
          </button>
        </div>

        {/* is Authorised Vendor */}
        <div className="mb-6 p-4  rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">
            Authorized as a Vendor
          </h2>
          <input
            type="text"
            className="border text-black p-2 rounded w-full mb-2"
            placeholder="Enter user address"
            value={userAddres}
            onChange={(e) => setUserAddres(e.target.value)}
          />
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            onClick={checkAuthorizedVendor}
          >
            Check Authorization
          </button>
          {authorisedVendor !== null && (
            <p className="mt-2 text-lg">
              {authorisedVendor ? (
                <span className="text-green-500">Authorized as a Vendor</span>
              ) : (
                <span className="text-red-500">UnAuthorized Vendor</span>
              )}
            </p>
          )}
        </div>
        {/* Check Airdrop Eligibility */}
        <div className="mb-6 p-4  rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">
            Check Airdrop Eligibility
          </h2>
          <input
            type="text"
            className="border text-black p-2 rounded w-full mb-2"
            placeholder="Enter user address"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
          />
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            onClick={checkAirdropEligibility}
          >
            Check Eligibility
          </button>
          {airdropEligibility !== null && (
            <p className="mt-2 text-lg">
              {airdropEligibility ? (
                <span className="text-green-500">Eligible for Airdrop</span>
              ) : (
                <span className="text-red-500">Not Eligible for Airdrop</span>
              )}
            </p>
          )}
        </div>

        {/* Set Points Per Transaction */}
        <div className="mb-6 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">
            Set Points Per Transaction
          </h2>
          <input
            type="number"
            className="border p-2 text-black rounded w-full mb-2"
            placeholder="Enter points per transaction"
            value={pointsPerTransaction}
            onChange={(e) => setPointsPerTransaction(e.target.value)}
          />
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            onClick={updatePointsPerTransactions}
          >
            Update Points
          </button>
        </div>

        {/* Set Point Threshold */}
        <div className="mb-6 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Set Point Threshold</h2>
          <input
            type="number"
            className="border p-2 text-black rounded w-full mb-2"
            placeholder="Enter new point threshold"
            value={pointThreshold}
            onChange={(e) => setPointThreshold(e.target.value)}
          />
          <button
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
            onClick={updatePointThresholds}
          >
            Update Threshold
          </button>
        </div>
        {/* All vendors */}
        <div className="mb-6 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">List of All vendors</h2>
          {AllVendors ? (
            <div>
              {AllVendors.map((item, i) => (
                <div key={i} className="border p-2 rounded my-2">
                  <span>Vendor Address: {item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
