import Header from "../components/Header";
import { useContext, useEffect, useState } from "react";
import { ICOContent } from "../Context";
import { ErrorToast } from "../app/Toast/Error";
import { SuccessToast } from "../app/Toast/Success";

const Admin = () => {
  const contexts = useContext(ICOContent);
  const {
    withdraw,
    isAuthorizedVendor,
    getAllVendors,
    setMintingFee,
    removeVendor,
    addVendor,
    checkEligibleForAirdrop,
    updatePointsPerTransaction,
    updatePointThreshold,
    updateListingFee,
  } = contexts;

  const [listingFee, setListingFee] = useState("");
  const [mintingFee, setMintingFeeState] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorRemoveAddress, setVendorRemoveAddress] = useState("");
  const [pointsPerTransaction, setPointsPerTransaction] = useState("");
  const [pointThreshold, setPointThreshold] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [checkVendorAddress, setCheckVendorAddress] = useState("");
  const [allVendors, setAllVendors] = useState([]);
  const [airdropEligibility, setAirdropEligibility] = useState(null);
  const [authorizedVendor, setAuthorizedVendor] = useState(null);

  useEffect(() => {
    getAllVendors()
      .then((vendors) => {
        setAllVendors(vendors);
      })
      .catch((error) => {
        ErrorToast("Error fetching vendors");
        console.error("Error fetching vendors: ", error);
      });
  }, [getAllVendors]);

  const updateListingFees = () => {
    updateListingFee(listingFee)
      .then(() => {
        SuccessToast(<div>Listing fee updated successfully 🎉</div>);
      })
      .catch((error) => {
        console.error(error);
        ErrorToast(<div>Something went wrong, please try again 💔</div>);
      });
  };

  const updateMintingFees = () => {
    setMintingFee(mintingFee)
      .then(() => {
        SuccessToast(<div>Minting fee updated successfully 🎉</div>);
      })
      .catch((error) => {
        console.error(error);
        ErrorToast(<div>Something went wrong, please try again 💔</div>);
      });
  };

  const withdrawFunds = async () => {
    try {
      await withdraw();
      SuccessToast(<div>Funds withdrawn successfully 🎉</div>);
    } catch (error) {
      console.error(error);
      ErrorToast(<div>Something went wrong, please try again 💔</div>);
    }
  };

  const checkAirdropEligibility = async () => {
    try {
      const response = await checkEligibleForAirdrop(userAddress);
      setAirdropEligibility(response);
    } catch (error) {
      console.error(error);
      ErrorToast(<div>Error checking eligibility 💔</div>);
    }
  };

  const checkAuthorizedVendor = async () => {
    try {
      const response = await isAuthorizedVendor(checkVendorAddress);
      setAuthorizedVendor(response);
    } catch (error) {
      console.error(error);
      ErrorToast(<div>Error checking vendor authorization 💔</div>);
    }
  };

  const handleAddVendor = async (event) => {
    event.preventDefault();

    try {
      await addVendor(vendorAddress);
      SuccessToast(<div>Vendor added successfully 🎉</div>);
      const vendors = await getAllVendors();
      setAllVendors(vendors);
    } catch (error) {
      console.error(error);
      ErrorToast(<div>Something went wrong, please try again 💔</div>);
    }
  };

  const handleRemoveVendor = async (event) => {
    event.preventDefault();

    try {
      await removeVendor(vendorRemoveAddress);
      SuccessToast(<div>Vendor removed successfully 🎉</div>);
      const vendors = await getAllVendors();
      setAllVendors(vendors);
    } catch (error) {
      console.error(error);
      ErrorToast(<div>Something went wrong, please try again 💔</div>);
    }
  };

  const handleVendorAddressChange = (e) => {
    setVendorAddress(e.target.value);
  };

  const handleVendorRemoveAddressChange = (e) => {
    setVendorRemoveAddress(e.target.value);
  };

  const updatePointsPerTransactions = () => {
    updatePointsPerTransaction(pointsPerTransaction)
      .then(() => {
        SuccessToast(<div>Points successfully updated 🎉</div>);
      })
      .catch((error) => {
        console.error(error);
        ErrorToast(<div>Something went wrong, please try again 💔</div>);
      });
  };

  const updatePointThresholds = () => {
    updatePointThreshold(pointThreshold)
      .then((response) => {
        if (response) {
          SuccessToast(<div>Point threshold successfully updated 🎉</div>);
        }
      })
      .catch((error) => {
        console.error(error);
        ErrorToast(<div>Something went wrong, please try again 💔</div>);
      });
  };

  return (
    <div className="min-h-screen bg-[#121212]  w-min-7xl text-white font-sans">
      <Header />
      <h1 className="text-3xl mx-auto font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Contract Interaction Interface
      </h1>

      <div className="max-w-6xl mx-auto mt-5 px-4">
        {/* add vendor */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">
            Add Vendor
          </h2>
          <input
            type="text"
            className="border p-3 rounded-lg bg-transparent border-gray-600 focus:border-blue-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter Vendor address"
            value={vendorAddress}
            onChange={handleVendorAddressChange}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={handleAddVendor}
          >
            Add Vendor
          </button>
        </div>
        {/* Remove vendor */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">
            Remove Vendor
          </h2>
          <input
            type="text"
            className="border p-3 rounded-lg bg-transparent border-gray-600 focus:border-blue-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter Vendor address"
            value={vendorRemoveAddress}
            onChange={handleVendorRemoveAddressChange}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={handleRemoveVendor}
          >
            Remove Vendor
          </button>
        </div>

        {/* Update Minting Fee */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">
            Update Mint Fee
          </h2>
          <input
            type="number"
            className="border p-3 rounded-lg bg-transparent border-gray-600 focus:border-blue-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter new minting fee"
            value={mintingFee}
            onChange={(e) => setMintingFeeState(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={updateMintingFees}
          >
            Update Minting Fee
          </button>
        </div>
        {/* Update Listing Fee */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">
            Update Listing Fee
          </h2>
          <input
            type="number"
            className="border p-3 rounded-lg bg-transparent border-gray-600 focus:border-blue-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter new listing fee"
            value={listingFee}
            onChange={(e) => setListingFee(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={updateListingFees}
          >
            Update Listing Fee
          </button>
        </div>

        {/* Withdraw Funds */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-green-300">
            Withdraw Funds
          </h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            onClick={withdrawFunds}
          >
            Withdraw
          </button>
        </div>

        {/* is Authorised Vendor */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">
            Authorized as a Vendor
          </h2>
          <input
            type="text"
            className="border p-3 rounded-lg bg-gradient-to-t from-[#1D0E35] to-[#161622] border-gray-600 focus:border-yellow-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter user address"
            value={checkVendorAddress}
            onChange={(e) => setCheckVendorAddress(e.target.value)}
          />
          <button
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            onClick={checkAuthorizedVendor}
          >
            Check Authorization
          </button>
          {authorizedVendor !== null && (
            <p className="mt-3 text-lg text-center">
              {authorizedVendor ? (
                <span className="text-green-400">✓ Authorized as a Vendor</span>
              ) : (
                <span className="text-red-400">✗ UnAuthorized Vendor</span>
              )}
            </p>
          )}
        </div>
        {/* Check Airdrop Eligibility */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">
            Check Airdrop Eligibility
          </h2>
          <input
            type="text"
            className="border p-3 rounded-lg bg-gradient-to-t from-[#1D0E35] to-[#161622] border-gray-600 focus:border-yellow-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter user address"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
          />
          <button
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            onClick={checkAirdropEligibility}
          >
            Check Eligibility
          </button>
          {airdropEligibility !== null && (
            <p className="mt-3 text-lg text-center">
              {airdropEligibility ? (
                <span className="text-green-400">✓ Eligible for Airdrop</span>
              ) : (
                <span className="text-red-400">✗ Not Eligible for Airdrop</span>
              )}
            </p>
          )}
        </div>

        {/* Set Points Per Transaction */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-300">
            Set Points Per Transaction
          </h2>
          <input
            type="number"
            className="border p-3 rounded-lg bg-transparent border-gray-600 focus:border-purple-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter points per transaction"
            value={pointsPerTransaction}
            onChange={(e) => setPointsPerTransaction(e.target.value)}
          />
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            onClick={updatePointsPerTransactions}
          >
            Update Points
          </button>
        </div>

        {/* Set Point Threshold */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-t from-[#1D0E35] to-[#161622] shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-indigo-300">
            Set Point Threshold
          </h2>
          <input
            type="number"
            className="border p-3 rounded-lg bg-transparent border-gray-600 focus:border-indigo-500 focus:outline-none w-full mb-4 text-white placeholder-gray-400"
            placeholder="Enter new point threshold"
            value={pointThreshold}
            onChange={(e) => setPointThreshold(e.target.value)}
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            onClick={updatePointThresholds}
          >
            Update Threshold
          </button>
        </div>
        {/* All vendors */}
        <div className="mb-6 p-6 rounded-xl bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">
            List of All Vendors
          </h2>
          {allVendors && allVendors.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {allVendors.map((item, i) => (
                <div
                  key={i}
                  className="border p-3 rounded-lg bg-gray-700 border-gray-600"
                >
                  <span className="text-gray-200">Vendor Address: {item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center">No vendors found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

// import Header from "../components/Header";
// import { useContext, useEffect, useState } from "react";
// import { ICOContent } from "../Context";
// import { ErrorToast } from "../app/Toast/Error";
// import { SuccessToast } from "../app/Toast/Success";

// const Admin = () => {
//   const contexts = useContext(ICOContent);
//   const {
//     withdraw,
//     isAuthorizedVendor,
//     getAllVendors,
//     setMintingFee,
//     removeVendor,
//     addVendor,
//     checkEligibleForAirdrop,
//     updatePointsPerTransaction,
//     updatePointThreshold,
//     updateListingFee,
//   } = contexts;

//   const [listingFee, setListingFee] = useState("");
//   const [mintingFee, setMintingFeeState] = useState("");
//   const [vendorAddress, setVendorAddress] = useState("");
//   const [vendorRemoveAddress, setVendorRemoveAddress] = useState("");
//   const [pointsPerTransaction, setPointsPerTransaction] = useState("");
//   const [pointThreshold, setPointThreshold] = useState("");
//   const [userAddress, setUserAddress] = useState("");
//   const [checkVendorAddress, setCheckVendorAddress] = useState("");
//   const [allVendors, setAllVendors] = useState([]);
//   const [airdropEligibility, setAirdropEligibility] = useState(null);
//   const [authorizedVendor, setAuthorizedVendor] = useState(null);

//   useEffect(() => {
//     getAllVendors()
//       .then((vendors) => {
//         setAllVendors(vendors);
//       })
//       .catch((error) => {
//         ErrorToast("Error fetching vendors");
//         console.error("Error fetching vendors: ", error);
//       });
//   }, [getAllVendors]);

//   const updateListingFees = () => {
//     updateListingFee(listingFee)
//       .then(() => {
//         SuccessToast(
//           <div>
//             Listing fee updated successfully 🎉
//           </div>
//         );
//       })
//       .catch((error) => {
//         console.error(error);
//         ErrorToast(<div>Something went wrong, please try again 💔</div>);
//       });
//   };

//   const updateMintingFees = () => {
//     setMintingFee(mintingFee)
//       .then(() => {
//         SuccessToast(
//           <div>
//             Minting fee updated successfully 🎉
//           </div>
//         );
//       })
//       .catch((error) => {
//         console.error(error);
//         ErrorToast(<div>Something went wrong, please try again 💔</div>);
//       });
//   };

//   const withdrawFunds = async () => {
//     try {
//       await withdraw();
//       SuccessToast(
//         <div>
//           Funds withdrawn successfully 🎉
//         </div>
//       );
//     } catch (error) {
//       console.error(error);
//       ErrorToast(<div>Something went wrong, please try again 💔</div>);
//     }
//   };

//   const checkAirdropEligibility = async () => {
//     try {
//       const response = await checkEligibleForAirdrop(userAddress);
//       setAirdropEligibility(response);
//     } catch (error) {
//       console.error(error);
//       ErrorToast(<div>Error checking eligibility 💔</div>);
//     }
//   };

//   const checkAuthorizedVendor = async () => {
//     try {
//       const response = await isAuthorizedVendor(checkVendorAddress);
//       setAuthorizedVendor(response);
//     } catch (error) {
//       console.error(error);
//       ErrorToast(<div>Error checking vendor authorization 💔</div>);
//     }
//   };

//   const handleAddVendor = async (event) => {
//     event.preventDefault();

//     try {
//       await addVendor(vendorAddress);
//       SuccessToast(
//         <div>
//           Vendor added successfully 🎉
//         </div>
//       );
//       // Refresh vendor list
//       const vendors = await getAllVendors();
//       setAllVendors(vendors);
//     } catch (error) {
//       console.error(error);
//       ErrorToast(<div>Something went wrong, please try again 💔</div>);
//     }
//   };

//   const handleRemoveVendor = async (event) => {
//     event.preventDefault();

//     try {
//       await removeVendor(vendorRemoveAddress);
//       SuccessToast(
//         <div>
//           Vendor removed successfully 🎉
//         </div>
//       );
//       // Refresh vendor list
//       const vendors = await getAllVendors();
//       setAllVendors(vendors);
//     } catch (error) {
//       console.error(error);
//       ErrorToast(<div>Something went wrong, please try again 💔</div>);
//     }
//   };

//   const handleVendorAddressChange = (e) => {
//     setVendorAddress(e.target.value);
//   };

//   const handleVendorRemoveAddressChange = (e) => {
//     setVendorRemoveAddress(e.target.value);
//   };

//   const updatePointsPerTransactions = () => {
//     updatePointsPerTransaction(pointsPerTransaction)
//       .then(() => {
//         SuccessToast(
//           <div>
//             Points successfully updated 🎉
//           </div>
//         );
//       })
//       .catch((error) => {
//         console.error(error);
//         ErrorToast(<div>Something went wrong, please try again 💔</div>);
//       });
//   };

//   const updatePointThresholds = () => {
//     updatePointThreshold(pointThreshold)
//       .then((response) => {
//         if(response) {
//           SuccessToast(
//             <div>
//               Point threshold successfully updated 🎉
//             </div>
//           );
//         }
//       })
//       .catch((error) => {
//         console.error(error);
//         ErrorToast(<div>Something went wrong, please try again 💔</div>);
//       });
//   };

//   return (
//     <div className="min-h-screen bg-black w-min-7xl text-white">
//       <Header />
//       <h1 className="text-2xl mx-auto font-bold mb-4">
//         Contract Interaction Interface
//       </h1>

//       <div className="max-w-6xl mx-auto mt-5">
//         {/* add vendor */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">Add Vendor</h2>
//           <input
//             type="text"
//             className="border p-2 rounded text-black w-full mb-2"
//             placeholder="Enter Vendor address"
//             value={vendorAddress}
//             onChange={handleVendorAddressChange}
//           />
//           <button
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             onClick={handleAddVendor}
//           >
//             Add Vendor
//           </button>
//         </div>
//         {/* Remove vendor */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">Remove Vendor</h2>
//           <input
//             type="text"
//             className="border p-2 rounded text-black w-full mb-2"
//             placeholder="Enter Vendor address"
//             value={vendorRemoveAddress}
//             onChange={handleVendorRemoveAddressChange}
//           />
//           <button
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             onClick={handleRemoveVendor}
//           >
//             Remove Vendor
//           </button>
//         </div>

//         {/* Update Minting Fee */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">Update Mint Fee</h2>
//           <input
//             type="number"
//             className="border p-2 rounded text-black w-full mb-2"
//             placeholder="Enter new minting fee"
//             value={mintingFee}
//             onChange={(e) => setMintingFeeState(e.target.value)}
//           />
//           <button
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             onClick={updateMintingFees}
//           >
//             Update Minting Fee
//           </button>
//         </div>
//         {/* Update Listing Fee */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">Update Listing Fee</h2>
//           <input
//             type="number"
//             className="border p-2 rounded text-black w-full mb-2"
//             placeholder="Enter new listing fee"
//             value={listingFee}
//             onChange={(e) => setListingFee(e.target.value)}
//           />
//           <button
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             onClick={updateListingFees}
//           >
//             Update Listing Fee
//           </button>
//         </div>

//         {/* Withdraw Funds */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">Withdraw Funds</h2>
//           <button
//             className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
//             onClick={withdrawFunds}
//           >
//             Withdraw
//           </button>
//         </div>

//         {/* is Authorised Vendor */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-2xl font-semibold mb-2">
//             Authorized as a Vendor
//           </h2>
//           <input
//             type="text"
//             className="border text-black p-2 rounded w-full mb-2"
//             placeholder="Enter user address"
//             value={checkVendorAddress}
//             onChange={(e) => setCheckVendorAddress(e.target.value)}
//           />
//           <button
//             className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
//             onClick={checkAuthorizedVendor}
//           >
//             Check Authorization
//           </button>
//           {authorizedVendor !== null && (
//             <p className="mt-2 text-lg">
//               {authorizedVendor ? (
//                 <span className="text-green-500">Authorized as a Vendor</span>
//               ) : (
//                 <span className="text-red-500">UnAuthorized Vendor</span>
//               )}
//             </p>
//           )}
//         </div>
//         {/* Check Airdrop Eligibility */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-2xl font-semibold mb-2">
//             Check Airdrop Eligibility
//           </h2>
//           <input
//             type="text"
//             className="border text-black p-2 rounded w-full mb-2"
//             placeholder="Enter user address"
//             value={userAddress}
//             onChange={(e) => setUserAddress(e.target.value)}
//           />
//           <button
//             className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
//             onClick={checkAirdropEligibility}
//           >
//             Check Eligibility
//           </button>
//           {airdropEligibility !== null && (
//             <p className="mt-2 text-lg">
//               {airdropEligibility ? (
//                 <span className="text-green-500">Eligible for Airdrop</span>
//               ) : (
//                 <span className="text-red-500">Not Eligible for Airdrop</span>
//               )}
//             </p>
//           )}
//         </div>

//         {/* Set Points Per Transaction */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">
//             Set Points Per Transaction
//           </h2>
//           <input
//             type="number"
//             className="border p-2 text-black rounded w-full mb-2"
//             placeholder="Enter points per transaction"
//             value={pointsPerTransaction}
//             onChange={(e) => setPointsPerTransaction(e.target.value)}
//           />
//           <button
//             className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
//             onClick={updatePointsPerTransactions}
//           >
//             Update Points
//           </button>
//         </div>

//         {/* Set Point Threshold */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">Set Point Threshold</h2>
//           <input
//             type="number"
//             className="border p-2 text-black rounded w-full mb-2"
//             placeholder="Enter new point threshold"
//             value={pointThreshold}
//             onChange={(e) => setPointThreshold(e.target.value)}
//           />
//           <button
//             className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
//             onClick={updatePointThresholds}
//           >
//             Update Threshold
//           </button>
//         </div>
//         {/* All vendors */}
//         <div className="mb-6 p-4 rounded shadow">
//           <h2 className="text-xl font-semibold mb-2">List of All Vendors</h2>
//           {allVendors && allVendors.length > 0 ? (
//             <div>
//               {allVendors.map((item, i) => (
//                 <div key={i} className="border p-2 rounded my-2">
//                   <span>Vendor Address: {item}</span>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div>No vendors found</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Admin;
