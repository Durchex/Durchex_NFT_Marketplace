import React, { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiLoader,
  FiMail,
  FiDollarSign,
  FiAward,
} from 'react-icons/fi';

const PartnerManagement = () => {
  const { address } = useContext(ICOContent);
  const [activeTab, setActiveTab] = useState('owned');
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [partnerAgreements, setPartnerAgreements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    partnerWallet: '',
    partnerName: '',
    partnerEmail: '',
    sharePercentage: 20,
    scope: 'all_nfts',
    description: '',
    network: 'all',
    appliedCollections: [],
    appliedNFTs: [],
  });

  useEffect(() => {
    if (address) {
      fetchPartners();
    }
  }, [address, activeTab]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      if (activeTab === 'owned') {
        const response = await cartAPI.get(`/partners/owner/${address}`);
        if (response.data.success) {
          setPartners(response.data.partners);
        }
      } else {
        const response = await cartAPI.get(`/partners/agreements/${address}`);
        if (response.data.success) {
          setPartnerAgreements(response.data.agreements);
        }
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();

    if (
      !formData.partnerWallet ||
      !formData.partnerName ||
      formData.sharePercentage === undefined
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await cartAPI.post('/partners/add', {
        ownerWallet: address,
        partnerWallet: formData.partnerWallet,
        partnerName: formData.partnerName,
        partnerEmail: formData.partnerEmail,
        sharePercentage: parseFloat(formData.sharePercentage),
        scope: formData.scope,
        description: formData.description,
        network: formData.network,
        appliedCollections: formData.appliedCollections,
        appliedNFTs: formData.appliedNFTs,
      });

      if (response.data.success) {
        toast.success('Partnership request sent to partner');
        setShowModal(false);
        resetForm();
        fetchPartners();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add partner';
      toast.error(errorMsg);
    }
  };

  const handleUpdatePartner = async (partnerWallet) => {
    try {
      const response = await cartAPI.patch(
        `/partners/owner/${address}/${partnerWallet}`,
        {
          profitShare: {
            percentage: parseFloat(formData.sharePercentage),
            description: formData.description,
          },
          network: formData.network,
        }
      );

      if (response.data.success) {
        toast.success('Partnership updated successfully');
        setEditingPartner(null);
        resetForm();
        fetchPartners();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update partner';
      toast.error(errorMsg);
    }
  };

  const handleDeactivatePartner = async (partnerWallet) => {
    if (!window.confirm('Are you sure you want to deactivate this partnership?')) {
      return;
    }

    try {
      const response = await cartAPI.patch(
        `/partners/deactivate/${address}/${partnerWallet}`
      );

      if (response.data.success) {
        toast.success('Partnership deactivated');
        fetchPartners();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to deactivate partnership';
      toast.error(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      partnerWallet: '',
      partnerName: '',
      partnerEmail: '',
      sharePercentage: 20,
      scope: 'all_nfts',
      description: '',
      network: 'all',
      appliedCollections: [],
      appliedNFTs: [],
    });
    setEditingPartner(null);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Partner Management</h1>
          <p className="text-gray-400">
            Manage profit-sharing partnerships with collaborators
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => {
              setActiveTab('owned');
              resetForm();
            }}
            className={`pb-4 px-2 font-semibold border-b-2 transition-all ${
              activeTab === 'owned'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUsers className="w-5 h-5" />
              My Partners
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('agreements');
              resetForm();
            }}
            className={`pb-4 px-2 font-semibold border-b-2 transition-all ${
              activeTab === 'agreements'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiAward className="w-5 h-5" />
              My Agreements
            </div>
          </button>
        </div>

        {/* Add Partner Button (for owned tab) */}
        {activeTab === 'owned' && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              Add Partner
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
              <p className="text-gray-400">Loading partnerships...</p>
            </div>
          </div>
        ) : activeTab === 'owned' ? (
          <OwnedPartnersView
            partners={partners}
            onEdit={(partner) => {
              setFormData({
                partnerWallet: partner.partnerWallet,
                partnerName: partner.partnerName,
                partnerEmail: partner.partnerEmail,
                sharePercentage: partner.profitShare.percentage,
                description: partner.profitShare.description,
                network: partner.network,
                scope: partner.scope,
                appliedCollections: partner.appliedTo.collections,
                appliedNFTs: partner.appliedTo.nftItemIds,
              });
              setEditingPartner(partner.partnerWallet);
              setShowModal(true);
            }}
            onDeactivate={handleDeactivatePartner}
          />
        ) : (
          <PartnersAgreementsView
            agreements={partnerAgreements}
          />
        )}

        {/* Modal */}
        {showModal && (
          <PartnerModal
            isEdit={!!editingPartner}
            formData={formData}
            onChange={handleFormChange}
            onSubmit={
              editingPartner
                ? () => handleUpdatePartner(editingPartner)
                : handleAddPartner
            }
            onClose={() => {
              setShowModal(false);
              resetForm();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Owned Partners View
const OwnedPartnersView = ({ partners, onEdit, onDeactivate }) => {
  const formatEther = (wei) => {
    try {
      return (parseFloat(wei) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  if (partners.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
        <FiUsers className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 mb-4">No partners yet</p>
        <p className="text-gray-500 text-sm">
          Add your first partner to start sharing profits
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {partners.map((partner) => (
        <div
          key={partner._id}
          className="bg-gray-900/50 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <FiUsers className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{partner.partnerName}</p>
                  <p className="text-xs text-gray-500">
                    {partner.partnerWallet.slice(0, 6)}...
                    {partner.partnerWallet.slice(-4)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Share %</p>
                  <p className="font-bold text-lg">
                    {partner.profitShare.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <div className="flex items-center gap-1">
                    {partner.status === 'active' ? (
                      <>
                        <FiCheck className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">
                          Active
                        </span>
                      </>
                    ) : partner.status === 'pending' ? (
                      <>
                        <FiLoader className="w-4 h-4 text-yellow-400 animate-spin" />
                        <span className="text-yellow-400 text-sm font-medium">
                          Pending
                        </span>
                      </>
                    ) : (
                      <>
                        <FiX className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm font-medium">
                          Inactive
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Pending</p>
                  <p className="font-bold">{formatEther(partner.pendingBalance)} ETH</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Total Earned</p>
                  <p className="font-bold">{formatEther(partner.totalEarned)} ETH</p>
                </div>
              </div>

              {partner.profitShare.description && (
                <p className="text-sm text-gray-400 mt-3">
                  {partner.profitShare.description}
                </p>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(partner)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-blue-400 transition-colors"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              {partner.status !== 'inactive' && (
                <button
                  onClick={() => onDeactivate(partner.partnerWallet)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-red-400 transition-colors"
                  title="Deactivate"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Partner Agreements View
const PartnersAgreementsView = ({ agreements }) => {
  const formatEther = (wei) => {
    try {
      return (parseFloat(wei) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  if (agreements.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
        <FiAward className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 mb-4">No partnership agreements</p>
        <p className="text-gray-500 text-sm">
          You haven't been added as a partner yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agreements.map((agreement) => (
        <div
          key={agreement._id}
          className="bg-gray-900/50 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FiAward className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{agreement.ownerName}</p>
                  <p className="text-xs text-gray-500">
                    {agreement.ownerWallet.slice(0, 6)}...
                    {agreement.ownerWallet.slice(-4)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Your Share %</p>
                  <p className="font-bold text-lg">
                    {agreement.profitShare.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <div className="flex items-center gap-1">
                    {agreement.status === 'active' ? (
                      <>
                        <FiCheck className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <FiLoader className="w-4 h-4 text-yellow-400 animate-spin" />
                        <span className="text-yellow-400 text-sm font-medium">
                          Pending
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Pending</p>
                  <p className="font-bold">{formatEther(agreement.pendingBalance)} ETH</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Total Earned</p>
                  <p className="font-bold">{formatEther(agreement.totalEarned)} ETH</p>
                </div>
              </div>

              {agreement.profitShare.description && (
                <p className="text-sm text-gray-400 mt-3">
                  {agreement.profitShare.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Partner Modal Component
const PartnerModal = ({ isEdit, formData, onChange, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">
            {isEdit ? 'Edit Partnership' : 'Add Partner'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {!isEdit && (
            <>
              {/* Partner Wallet */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Partner Wallet Address *
                </label>
                <input
                  type="text"
                  value={formData.partnerWallet}
                  onChange={(e) => onChange('partnerWallet', e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Partner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Partner Name *
                </label>
                <input
                  type="text"
                  value={formData.partnerName}
                  onChange={(e) => onChange('partnerName', e.target.value)}
                  placeholder="e.g., John Designer"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Partner Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Partner Email
                </label>
                <input
                  type="email"
                  value={formData.partnerEmail}
                  onChange={(e) => onChange('partnerEmail', e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
            </>
          )}

          {/* Share Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Share Percentage * ({formData.sharePercentage}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={formData.sharePercentage}
              onChange={(e) => onChange('sharePercentage', e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <p className="text-xs text-gray-500 mt-2">
              Partner will receive {formData.sharePercentage}% of NFT sales
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Partnership Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="e.g., Illustrator - responsible for artwork"
              rows="3"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>

          {!isEdit && (
            <>
              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apply to
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) => onChange('scope', e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="all_nfts">All NFTs</option>
                  <option value="collection">Specific Collection</option>
                  <option value="specific_nfts">Specific NFTs</option>
                </select>
              </div>

              {/* Network */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Network
                </label>
                <select
                  value={formData.network}
                  onChange={(e) => onChange('network', e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Networks</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="base">Base</option>
                </select>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              {isEdit ? 'Update Partnership' : 'Add Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerManagement;
