import React, { useState, useContext } from 'react';
import { ICOContent } from '../Context';
import pinataService from '../services/pinataService';
import socketService from '../services/socketService';
import { FiUpload, FiImage, FiDollarSign, FiPercent, FiGlobe, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NFTMintingInterface = () => {
  const { address, connectWallet } = useContext(ICOContent);
  const [isMinting, setIsMinting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    imagePreview: null,
    network: 'ethereum',
    price: '',
    royalty: 2.5,
    attributes: [],
    externalUrl: '',
    animationUrl: '',
    backgroundColor: '#000000'
  });
  const [errors, setErrors] = useState({});

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: '🔷' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: '🟣' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB', icon: '🟡' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', icon: '🔵' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: 'Please upload a valid image file (JPEG, PNG, GIF, WebP)'
        }));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 10MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: e.target.result
        }));
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const updateAttribute = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'NFT name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.image) newErrors.image = 'Image is required';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (formData.royalty < 0 || formData.royalty > 10) {
      newErrors.royalty = 'Royalty must be between 0% and 10%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMint = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      await connectWallet();
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before minting');
      return;
    }

    setIsMinting(true);
    
    try {
      // Step 1: Upload image to IPFS
      toast.loading('Uploading image to IPFS...');
      const imageResult = await pinataService.uploadImage(formData.image);
      
      if (!imageResult.success) {
        throw new Error(imageResult.error);
      }

      // Step 2: Create metadata
      const metadata = pinataService.createNFTMetadata({
        name: formData.name,
        description: formData.description,
        image: pinataService.getIPFSUrl(imageResult.ipfsHash),
        attributes: formData.attributes.filter(attr => attr.trait_type && attr.value),
        external_url: formData.externalUrl,
        animation_url: formData.animationUrl,
        background_color: formData.backgroundColor
      });

      // Step 3: Upload metadata to IPFS
      toast.loading('Uploading metadata to IPFS...');
      const metadataResult = await pinataService.uploadMetadata(metadata);
      
      if (!metadataResult.success) {
        throw new Error(metadataResult.error);
      }

      // Step 4: Mint NFT (This would integrate with your smart contract)
      toast.loading('Minting NFT on blockchain...');
      
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 5: Send real-time notification
      socketService.sendUserActivity({
        type: 'nft_minted',
        user: address,
        nftName: formData.name,
        tokenUri: pinataService.getIPFSUrl(metadataResult.ipfsHash),
        network: formData.network,
        price: formData.price
      });

      toast.success('NFT minted successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        image: null,
        imagePreview: null,
        network: 'ethereum',
        price: '',
        royalty: 2.5,
        attributes: [],
        externalUrl: '',
        animationUrl: '',
        backgroundColor: '#000000'
      });
      setCurrentStep(1);

    } catch (error) {
      console.error('Minting error:', error);
      toast.error(`Minting failed: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-display font-semibold text-gray-900">Basic Information</h3>
      
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          NFT Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter NFT name"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1 font-display">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe your NFT"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1 font-display">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Image *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {formData.imagePreview ? (
            <div className="space-y-4">
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="mx-auto h-48 w-48 object-cover rounded-lg"
              />
              <button
                onClick={() => handleInputChange('image', null)}
                className="text-red-500 hover:text-red-700 font-display"
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-800 font-display font-medium">
                    Click to upload
                  </span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 text-sm font-display">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          )}
        </div>
        {errors.image && <p className="text-red-500 text-sm mt-1 font-display">{errors.image}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-display font-semibold text-gray-900">Pricing & Network</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Network
          </label>
          <select
            value={formData.network}
            onChange={(e) => handleInputChange('network', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          >
            {networks.map(network => (
              <option key={network.id} value={network.id}>
                {network.icon} {network.name} ({network.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Mint Price *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.001"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-500 font-display text-sm">
                {networks.find(n => n.id === formData.network)?.symbol}
              </span>
            </div>
          </div>
          {errors.price && <p className="text-red-500 text-sm mt-1 font-display">{errors.price}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Royalty Percentage
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.royalty}
            onChange={(e) => handleInputChange('royalty', parseFloat(e.target.value))}
            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
              errors.royalty ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-gray-500 font-display text-sm">%</span>
          </div>
        </div>
        {errors.royalty && <p className="text-red-500 text-sm mt-1 font-display">{errors.royalty}</p>}
        <p className="text-gray-500 text-sm mt-1 font-display">
          Percentage you'll earn from future sales (0-10%)
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-display font-semibold text-gray-900">Attributes & Details</h3>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-display font-medium text-gray-700">
            Attributes
          </label>
          <button
            onClick={addAttribute}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display text-sm"
          >
            Add Attribute
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.attributes.map((attr, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="text"
                value={attr.trait_type}
                onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                placeholder="Trait Type"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
              />
              <input
                type="text"
                value={attr.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
              />
              <button
                onClick={() => removeAttribute(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            External URL
          </label>
          <input
            type="url"
            value={formData.externalUrl}
            onChange={(e) => handleInputChange('externalUrl', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Animation URL
          </label>
          <input
            type="url"
            value={formData.animationUrl}
            onChange={(e) => handleInputChange('animationUrl', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            placeholder="https://your-animation.mp4"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={formData.backgroundColor}
            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
            className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={formData.backgroundColor}
            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Create NFT</h1>
          <p className="text-gray-600 font-display">Mint your unique NFT and list it on the marketplace</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-semibold ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? <FiCheck className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-display text-gray-600">Basic Info</span>
            <span className="text-sm font-display text-gray-600">Pricing</span>
            <span className="text-sm font-display text-gray-600">Attributes</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={isMinting || !address}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display flex items-center space-x-2"
            >
              {isMinting ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Minting...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>Mint NFT</span>
                </>
              )}
            </button>
          )}
        </div>

        {!address && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-display">
              Please connect your wallet to mint NFTs
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTMintingInterface;
