import React, { useState, useRef } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';
import { coverPhotoAPI } from '../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

const CoverPhotoUploader = ({ isOpen, onClose, onSuccess, type = 'user', entityId }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadToIPFS = async (file) => {
    // Check if Pinata credentials are configured
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
      throw new Error('IPFS upload not configured. Please set up Pinata API credentials in environment variables.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const headers = PINATA_JWT
      ? {
          Authorization: `Bearer ${PINATA_JWT}`,
          'Content-Type': 'multipart/form-data',
        }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
          'Content-Type': 'multipart/form-data',
        };

    try {
      console.log('Uploading to IPFS with headers:', Object.keys(headers));
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers,
        timeout: 30000, // 30 second timeout
      });

      if (!response.data?.IpfsHash) {
        throw new Error('Invalid response from IPFS service');
      }

      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error('IPFS upload error:', error);

      // Provide specific error messages based on error type
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_EMPTY_RESPONSE') {
        throw new Error('IPFS service is currently unavailable. Please try again later or contact support.');
      } else if (error.response?.status === 401) {
        throw new Error('IPFS authentication failed. Please check API credentials.');
      } else if (error.response?.status === 429) {
        throw new Error('IPFS upload rate limit exceeded. Please try again in a few minutes.');
      } else if (error.response?.status >= 500) {
        throw new Error('IPFS service error. Please try again later.');
      } else {
        throw new Error(`IPFS upload failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      toast.error('Please select an image');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl;

      // Try to upload to IPFS first
      try {
        imageUrl = await uploadToIPFS(selectedImage);
        console.log('Successfully uploaded to IPFS:', imageUrl);
      } catch (ipfsError) {
        console.warn('IPFS upload failed, using fallback:', ipfsError.message);

        // Fallback: Use base64 data URL for the image
        // Note: This is temporary and won't persist across sessions
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(selectedImage);
        });

        toast('IPFS upload failed - using temporary local image. Image may not persist.', {
          icon: '⚠️',
          duration: 5000,
        });
      }

      let response;
      if (type === 'user') {
        response = await coverPhotoAPI.updateUserCoverPhoto(entityId, imageUrl);
      } else if (type === 'collection') {
        response = await coverPhotoAPI.updateCollectionCoverPhoto(entityId, imageUrl);
      }

      toast.success('Cover photo updated successfully!');
      onSuccess?.(response);
      handleClose();
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast.error(error.message || 'Failed to upload cover photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Update Cover Photo</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Image Preview or Upload Area */}
            {preview ? (
              <div className="space-y-4">
                <div className="relative w-full h-48 bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-400 text-center">
                  {selectedImage?.name}
                </p>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all"
              >
                <FiUpload className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Click to upload</p>
                <p className="text-sm text-gray-400">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Info */}
            <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30 text-sm">
              <p className="text-blue-300">
                💡 <strong>Tip:</strong> Use a high-resolution image (recommended: 1500x500px) for best results.
              </p>
            </div>

            {/* Description */}
            {type === 'user' && (
              <p className="text-sm text-gray-400">
                Your cover photo will be displayed on your profile and collection pages.
              </p>
            )}
            {type === 'collection' && (
              <p className="text-sm text-gray-400">
                This cover photo will be displayed at the top of your collection page.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 space-y-3">
            {preview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Change Image
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={isLoading || !selectedImage}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Uploading...' : 'Upload Cover Photo'}
            </button>
            <button
              onClick={handleClose}
              className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoverPhotoUploader;
