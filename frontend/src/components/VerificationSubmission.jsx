import React, { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import { verificationAPI } from '../services/verificationAPI';
import { FiCheck, FiX, FiAlertCircle, FiUpload, FiMail, FiMapPin, FiHome, FiGlobe, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

const VerificationSubmission = () => {
  const { address } = useContext(ICOContent);
  const [tier, setTier] = useState('premium');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [nftCount, setNftCount] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    location: '',
    address: '',
    country: '',
    houseAddress: '',
    idVerification: {
      documentType: '',
      documentNumber: '',
      documentImage: null,
    },
  });

  useEffect(() => {
    if (address) {
      loadVerificationStatus();
    }
  }, [address]);

  const loadVerificationStatus = async () => {
    try {
      const data = await verificationAPI.getVerificationStatus(address);
      setStatus(data);
      setNftCount(data.nftCount || 0);
      
      // Pre-fill form if verification data exists
      if (data.verificationData) {
        setFormData({
          email: data.verificationData.email || '',
          location: data.verificationData.location || '',
          address: data.verificationData.address || '',
          country: data.verificationData.country || '',
          houseAddress: data.verificationData.houseAddress || '',
          idVerification: {
            documentType: data.verificationData.idVerification?.documentType || '',
            documentNumber: data.verificationData.idVerification?.documentNumber || '',
            documentImage: data.verificationData.idVerification?.documentImage || null,
          },
        });
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload to a file storage service (e.g., IPFS, S3)
      // For now, we'll store the file object
      handleInputChange('idVerification.documentImage', file);
      toast.success('ID document uploaded');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate form based on tier
    if (tier === 'premium') {
      if (!formData.email || !formData.location || !formData.address) {
        toast.error('Please fill in all required fields for Premium verification');
        return;
      }
      if (nftCount < 20) {
        toast.error(`Premium verification requires at least 20 NFTs. You currently have ${nftCount}.`);
        return;
      }
    } else if (tier === 'super_premium') {
      if (!formData.email || !formData.country || !formData.houseAddress) {
        toast.error('Please fill in all required fields for Super Premium verification');
        return;
      }
      if (!formData.idVerification.documentType || !formData.idVerification.documentNumber || !formData.idVerification.documentImage) {
        toast.error('Please provide ID verification documents for Super Premium verification');
        return;
      }
      if (nftCount < 100) {
        toast.error(`Super Premium verification requires at least 100 NFTs. You currently have ${nftCount}.`);
        return;
      }
    }

    setLoading(true);
    try {
      // In production, upload the ID image to a storage service first
      let documentImageUrl = null;
      if (formData.idVerification.documentImage && typeof formData.idVerification.documentImage === 'object') {
        // TODO: Upload to IPFS or cloud storage
        // For now, we'll need to handle this on the backend
        documentImageUrl = 'pending_upload';
      } else {
        documentImageUrl = formData.idVerification.documentImage;
      }

      const submissionData = {
        tier,
        email: formData.email,
        location: tier === 'premium' ? formData.location : undefined,
        address: tier === 'premium' ? formData.address : undefined,
        country: tier === 'super_premium' ? formData.country : undefined,
        houseAddress: tier === 'super_premium' ? formData.houseAddress : undefined,
        idVerification: tier === 'super_premium' ? {
          documentType: formData.idVerification.documentType,
          documentNumber: formData.idVerification.documentNumber,
          documentImage: documentImageUrl,
        } : undefined,
      };

      await verificationAPI.submitVerification(address, submissionData);
      toast.success('Verification request submitted successfully! Admin will review your request.');
      await loadVerificationStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;
    
    const statusMap = {
      none: { label: 'Not Verified', color: 'gray', icon: FiX },
      pending: { label: 'Pending Review', color: 'yellow', icon: FiAlertCircle },
      premium: { label: 'Premium Verified', color: 'blue', icon: FiCheck },
      super_premium: { label: 'Super Premium Verified', color: 'gold', icon: FiShield },
      rejected: { label: 'Rejected', color: 'red', icon: FiX },
    };

    const statusInfo = statusMap[status.verificationStatus] || statusMap.none;
    const Icon = statusInfo.icon;

    return (
      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
        <Icon className="w-4 h-4" />
        <span className="font-medium">{statusInfo.label}</span>
      </div>
    );
  };

  if (!address) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">Please connect your wallet to submit a verification request.</p>
      </div>
    );
  }

  if (status?.verificationStatus === 'premium' || status?.verificationStatus === 'super_premium') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verification Status</h2>
          {getStatusBadge()}
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FiCheck className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">
              You are {status.verificationStatus === 'super_premium' ? 'Super Premium' : 'Premium'} Verified!
            </h3>
          </div>
          <p className="text-green-800">
            Your verification was approved on {status.verificationData?.verifiedAt ? new Date(status.verificationData.verifiedAt).toLocaleDateString() : 'N/A'}.
            You have access to all {status.verificationStatus === 'super_premium' ? 'Super Premium' : 'Premium'} features.
          </p>
        </div>
      </div>
    );
  }

  if (status?.verificationStatus === 'pending') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verification Status</h2>
          {getStatusBadge()}
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FiAlertCircle className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">Verification Under Review</h3>
          </div>
          <p className="text-yellow-800">
            Your verification request is being reviewed by our admin team. You will receive an email notification once the review is complete.
          </p>
          <p className="text-yellow-800 mt-2 text-sm">
            Submitted on: {status.verificationData?.submittedAt ? new Date(status.verificationData.submittedAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Verified</h2>
        <p className="text-gray-600">Choose your verification tier and submit your information for admin review.</p>
      </div>

      {/* Tier Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Verification Tier</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTier('premium')}
            className={`p-4 rounded-lg border-2 transition-all ${
              tier === 'premium'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                P
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Premium</h3>
                <p className="text-sm text-gray-600">20+ NFTs required</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li className="flex items-center space-x-2">
                <FiMail className="w-4 h-4" />
                <span>Email registration</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiMapPin className="w-4 h-4" />
                <span>Location</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiHome className="w-4 h-4" />
                <span>Address</span>
              </li>
            </ul>
          </button>

          <button
            type="button"
            onClick={() => setTier('super_premium')}
            className={`p-4 rounded-lg border-2 transition-all ${
              tier === 'super_premium'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                G
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Super Premium</h3>
                <p className="text-sm text-gray-600">100+ NFTs required</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li className="flex items-center space-x-2">
                <FiMail className="w-4 h-4" />
                <span>Email address</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiGlobe className="w-4 h-4" />
                <span>Country location</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiHome className="w-4 h-4" />
                <span>House address</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiShield className="w-4 h-4" />
                <span>ID verification</span>
              </li>
            </ul>
          </button>
        </div>
      </div>

      {/* NFT Count Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Your NFT Collection:</span> {nftCount} NFTs
        </p>
        {tier === 'premium' && (
          <p className={`text-sm mt-1 ${nftCount >= 20 ? 'text-green-600' : 'text-red-600'}`}>
            {nftCount >= 20 ? '✓' : '✗'} {nftCount >= 20 ? 'Eligible' : `Need ${20 - nftCount} more NFTs`}
          </p>
        )}
        {tier === 'super_premium' && (
          <p className={`text-sm mt-1 ${nftCount >= 100 ? 'text-green-600' : 'text-red-600'}`}>
            {nftCount >= 100 ? '✓' : '✗'} {nftCount >= 100 ? 'Eligible' : `Need ${100 - nftCount} more NFTs`}
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email (required for both) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        {/* Premium fields */}
        {tier === 'premium' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, State/Province"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full address"
              />
            </div>
          </>
        )}

        {/* Super Premium fields */}
        {tier === 'super_premium' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Your country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.houseAddress}
                onChange={(e) => handleInputChange('houseAddress', e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Your house address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.idVerification.documentType}
                onChange={(e) => handleInputChange('idVerification.documentType', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select document type</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="national_id">National ID</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Document Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.idVerification.documentNumber}
                onChange={(e) => handleInputChange('idVerification.documentNumber', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Document number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Document Image <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="id-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="id-upload"
                        name="id-upload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="sr-only"
                        required={tier === 'super_premium'}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  {formData.idVerification.documentImage && (
                    <p className="text-sm text-green-600 mt-2">
                      File selected: {typeof formData.idVerification.documentImage === 'object' ? formData.idVerification.documentImage.name : 'Uploaded'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading || (tier === 'premium' && nftCount < 20) || (tier === 'super_premium' && nftCount < 100)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Verification Request'}
        </button>
      </form>
    </div>
  );
};

export default VerificationSubmission;

