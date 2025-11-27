import React, { useContext, useEffect, useState } from "react";
import { ICOContent } from "../../Context";
import { contractAddresses } from "../../Context/constants";
import { ErrorToast } from "../../app/Toast/Error";
import { SuccessToast } from "../../app/Toast/Success";
import TezosWithdrawUI from "../../components/TezosWithdrawUI";
import { 
  FiDollarSign, 
  FiUsers, 
  FiSettings, 
  FiDownload,
  FiPlus,
  FiMinus,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp
} from "react-icons/fi";

const ContractManagement = () => {
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
  } = contexts || {};

  const [listingFee, setListingFee] = useState("");
  const [mintingFee, setMintingFeeState] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorRemoveAddress, setVendorRemoveAddress] = useState("");
  const [pointsPerTransaction, setPointsPerTransaction] = useState("");
  const [pointThreshold, setPointThreshold] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [allVendors, setAllVendors] = useState([]);
  const [airdropEligibility, setAirdropEligibility] = useState(null);
  const [authorizedVendor, setAuthorizedVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(contexts?.selectedChain || 'polygon');

  useEffect(() => {
    if (getAllVendors) {
      getAllVendors()
        .then((vendors) => setAllVendors(vendors || []))
        .catch((error) => ErrorToast("Error fetching vendors: " + error));
    }
  }, [getAllVendors]);

  const updateListingFees = async () => {
    if (!updateListingFee) {
      ErrorToast("Update listing fee function not available");
      return;
    }
    setIsLoading(true);
    try {
      await updateListingFee(listingFee);
      SuccessToast("Listing fee updated successfully! 🎉");
      setListingFee("");
    } catch (error) {
      ErrorToast("Failed to update listing fee");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMintingFees = async () => {
    if (!setMintingFee) {
      ErrorToast("Set minting fee function not available");
      return;
    }
    setIsLoading(true);
    try {
      await setMintingFee(mintingFee);
      SuccessToast("Minting fee updated successfully! 🎉");
      setMintingFeeState("");
    } catch (error) {
      ErrorToast("Failed to update minting fee");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawFunds = async () => {
    if (!withdraw) {
      ErrorToast("Withdraw function not available");
      return;
    }
    setIsLoading(true);
    try {
      // Ensure the context is set to the selected network before withdrawing
      if (contexts?.setSelectedChain) {
        contexts.setSelectedChain(selectedNetwork);
        // small delay to allow context to update if needed
        await new Promise((r) => setTimeout(r, 300));
      }
      await withdraw();
      SuccessToast("Funds withdrawn successfully! 🎉");
    } catch (error) {
      ErrorToast("Failed to withdraw funds");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAirdropEligibility = async () => {
    if (!checkEligibleForAirdrop) {
      ErrorToast("Check airdrop eligibility function not available");
      return;
    }
    setIsLoading(true);
    try {
      const response = await checkEligibleForAirdrop(userAddress);
      setAirdropEligibility(response);
      if (response) {
        SuccessToast("User is eligible for airdrop! ✅");
      } else {
        ErrorToast("User is not eligible for airdrop ❌");
      }
    } catch (error) {
      ErrorToast("Failed to check airdrop eligibility");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthorizedVendor = async () => {
    if (!isAuthorizedVendor) {
      ErrorToast("Check authorized vendor function not available");
      return;
    }
    setIsLoading(true);
    try {
      const response = await isAuthorizedVendor(vendorRemoveAddress);
      setAuthorizedVendor(response);
      if (response) {
        SuccessToast("Address is authorized as vendor! ✅");
      } else {
        ErrorToast("Address is not authorized as vendor ❌");
      }
    } catch (error) {
      ErrorToast("Failed to check vendor authorization");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!addVendor) {
      ErrorToast("Add vendor function not available");
      return;
    }
    if (!vendorAddress) {
      ErrorToast("Please enter vendor address");
      return;
    }
    setIsLoading(true);
    try {
      await addVendor(vendorAddress);
      SuccessToast("Vendor added successfully! 🎉");
      setVendorAddress("");
      // Refresh vendor list
      if (getAllVendors) {
        getAllVendors()
          .then((vendors) => setAllVendors(vendors || []))
          .catch((error) => console.error("Error refreshing vendors:", error));
      }
    } catch (error) {
      ErrorToast("Failed to add vendor");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVendor = async (e) => {
    e.preventDefault();
    if (!removeVendor) {
      ErrorToast("Remove vendor function not available");
      return;
    }
    if (!vendorRemoveAddress) {
      ErrorToast("Please enter vendor address");
      return;
    }
    setIsLoading(true);
    try {
      await removeVendor(vendorRemoveAddress);
      SuccessToast("Vendor removed successfully! 🎉");
      setVendorRemoveAddress("");
      // Refresh vendor list
      if (getAllVendors) {
        getAllVendors()
          .then((vendors) => setAllVendors(vendors || []))
          .catch((error) => console.error("Error refreshing vendors:", error));
      }
    } catch (error) {
      ErrorToast("Failed to remove vendor");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePointsPerTransactions = async () => {
    if (!updatePointsPerTransaction) {
      ErrorToast("Update points per transaction function not available");
      return;
    }
    setIsLoading(true);
    try {
      await updatePointsPerTransaction(pointsPerTransaction);
      SuccessToast("Points per transaction updated successfully! 🎉");
      setPointsPerTransaction("");
    } catch (error) {
      ErrorToast("Failed to update points per transaction");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePointThresholds = async () => {
    if (!updatePointThreshold) {
      ErrorToast("Update point threshold function not available");
      return;
    }
    setIsLoading(true);
    try {
      const response = await updatePointThreshold(pointThreshold);
      if (response) {
        SuccessToast("Point threshold updated successfully! 🎉");
        setPointThreshold("");
      }
    } catch (error) {
      ErrorToast("Failed to update point threshold");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 min-h-full">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Contract Management</h2>
            <p className="text-gray-600 font-display text-sm mt-1">Manage smart contract settings and vendors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Vendor */}
          <Card title="Add Vendor" icon={FiPlus} color="blue">
            <input
              type="text"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Vendor Address"
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
            />
            <button
              onClick={handleAddVendor}
              disabled={isLoading || !vendorAddress}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Add Vendor
            </button>
          </Card>

          {/* Remove Vendor */}
          <Card title="Remove Vendor" icon={FiMinus} color="red">
            <input
              type="text"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter Vendor Address"
              value={vendorRemoveAddress}
              onChange={(e) => setVendorRemoveAddress(e.target.value)}
            />
            <button
              onClick={handleRemoveVendor}
              disabled={isLoading || !vendorRemoveAddress}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Remove Vendor
            </button>
          </Card>

          {/* Update Minting Fee */}
          <Card title="Update Minting Fee" icon={FiDollarSign} color="purple">
            <input
              type="number"
              step="0.0001"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter new minting fee (ETH)"
              value={mintingFee}
              onChange={(e) => setMintingFeeState(e.target.value)}
            />
            <button
              onClick={updateMintingFees}
              disabled={isLoading || !mintingFee}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Update Minting Fee
            </button>
          </Card>

          {/* Update Listing Fee */}
          <Card title="Update Listing Fee" icon={FiDollarSign} color="green">
            <input
              type="number"
              step="0.0001"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter new listing fee (ETH)"
              value={listingFee}
              onChange={(e) => setListingFee(e.target.value)}
            />
            <button
              onClick={updateListingFees}
              disabled={isLoading || !listingFee}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Update Listing Fee
            </button>
          </Card>

          {/* Update Points Per Transaction */}
          <Card title="Update Points Per Transaction" icon={FiTrendingUp} color="orange">
            <input
              type="number"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter points per transaction"
              value={pointsPerTransaction}
              onChange={(e) => setPointsPerTransaction(e.target.value)}
            />
            <button
              onClick={updatePointsPerTransactions}
              disabled={isLoading || !pointsPerTransaction}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Update Points
            </button>
          </Card>

          {/* Update Point Threshold */}
          <Card title="Update Point Threshold" icon={FiSettings} color="indigo">
            <input
              type="number"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new point threshold"
              value={pointThreshold}
              onChange={(e) => setPointThreshold(e.target.value)}
            />
            <button
              onClick={updatePointThresholds}
              disabled={isLoading || !pointThreshold}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Update Threshold
            </button>
          </Card>

          {/* Withdraw Funds */}
          {selectedNetwork === 'tezos' ? (
            <div className="col-span-1">
              <TezosWithdrawUI />
            </div>
          ) : (
            <Card title="Withdraw Funds" icon={FiDownload} color="green">
              <p className="text-sm text-gray-600 mb-4 font-display">
                Withdraw accumulated funds from the contract
              </p>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-2">Network</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full p-3 mb-2 rounded-lg bg-white border border-gray-300 text-gray-900"
                >
                  {Object.keys(contractAddresses).map((net) => (
                    <option key={net} value={net}>{net}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  Contract: {contractAddresses[selectedNetwork]?.vendorNFT || 'Not configured'}
                </div>
              </div>
              <button
                onClick={withdrawFunds}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
              >
                {isLoading ? "Processing..." : "Withdraw Funds"}
              </button>
            </Card>
          )}

          {/* Check Airdrop Eligibility */}
          <Card title="Check Airdrop Eligibility" icon={FiCheckCircle} color="blue">
            <input
              type="text"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter user address"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
            />
            <button
              onClick={checkAirdropEligibility}
              disabled={isLoading || !userAddress}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Check Eligibility
            </button>
            {airdropEligibility !== null && (
              <div className={`mt-3 p-3 rounded-lg ${airdropEligibility ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} font-display`}>
                {airdropEligibility ? (
                  <span className="flex items-center gap-2">
                    <FiCheckCircle /> Eligible for Airdrop
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiXCircle /> Not Eligible for Airdrop
                  </span>
                )}
              </div>
            )}
          </Card>

          {/* Check Authorized Vendor */}
          <Card title="Check Authorized Vendor" icon={FiUsers} color="purple">
            <input
              type="text"
              className="w-full p-3 mb-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter address to check"
              value={vendorRemoveAddress}
              onChange={(e) => setVendorRemoveAddress(e.target.value)}
            />
            <button
              onClick={checkAuthorizedVendor}
              disabled={isLoading || !vendorRemoveAddress}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-display font-medium transition-colors"
            >
              Check Authorization
            </button>
            {authorizedVendor !== null && (
              <div className={`mt-3 p-3 rounded-lg ${authorizedVendor ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} font-display`}>
                {authorizedVendor ? (
                  <span className="flex items-center gap-2">
                    <FiCheckCircle /> Authorized as Vendor
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiXCircle /> Not Authorized as Vendor
                  </span>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* List of All Vendors */}
        <Card title="All Vendors" icon={FiUsers} color="gray" className="mt-6">
          {allVendors.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allVendors.map((vendor, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <span className="font-mono text-sm text-gray-700 font-display">{vendor}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-display font-medium">
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 font-display">No vendors available</p>
          )}
        </Card>
      </div>
    </div>
  );
};

const Card = ({ title, icon: Icon, color, children, className = "" }) => {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    red: "border-red-200 bg-red-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
    orange: "border-orange-200 bg-orange-50",
    indigo: "border-indigo-200 bg-indigo-50",
    gray: "border-gray-200 bg-gray-50",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    red: "text-red-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    indigo: "text-indigo-600",
    gray: "text-gray-600",
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-2 ${colorClasses[color]} ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />}
        <h3 className="text-lg font-display font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export default ContractManagement;

