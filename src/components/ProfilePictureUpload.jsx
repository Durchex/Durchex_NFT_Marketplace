import React, { useState, useContext } from 'react';
import { ICOContent } from '../Context';
import pinataService from '../services/pinataService';
import socketService from '../services/socketService';
import { FiUpload, FiUser, FiCamera, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProfilePictureUpload = ({ onUpload, currentImage, className = '' }) => {
  const { address } = useContext(ICOContent);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB for profile pictures)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to IPFS
    await uploadToIPFS(file);
  };

  const uploadToIPFS = async (file) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsUploading(true);
    
    try {
      toast.loading('Uploading profile picture...');
      
      const result = await pinataService.uploadImage(file);
      
      if (result.success) {
        const imageUrl = pinataService.getIPFSUrl(result.ipfsHash);
        
        // Store in localStorage
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        userProfile[address] = {
          ...userProfile[address],
          profilePicture: imageUrl,
          profilePictureHash: result.ipfsHash
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        // Send real-time activity
        socketService.sendUserActivity({
          type: 'profile_picture_updated',
          user: address,
          imageUrl: imageUrl
        });

        // Call parent callback
        if (onUpload) {
          onUpload(imageUrl, result.ipfsHash);
        }

        toast.success('Profile picture updated successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(`Upload failed: ${error.message}`);
      // Revert preview
      setPreview(currentImage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeProfilePicture = () => {
    if (!address) return;

    // Remove from localStorage
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userProfile[address]) {
      delete userProfile[address].profilePicture;
      delete userProfile[address].profilePictureHash;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }

    setPreview(null);
    
    if (onUpload) {
      onUpload(null, null);
    }

    toast.success('Profile picture removed');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Profile Picture Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <FiUser className="w-16 h-16 text-gray-400" />
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="text-center text-white">
            <FiCamera className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-display">Change Photo</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <FiLoader className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            <p className="text-gray-600 font-display">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <FiUpload className="w-8 h-8 mx-auto text-gray-400" />
            <div>
              <label htmlFor="profile-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-800 font-display font-medium">
                  Click to upload
                </span>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
              <p className="text-gray-500 text-sm font-display">or drag and drop</p>
              <p className="text-gray-400 text-xs font-display">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {preview && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={removeProfilePicture}
            disabled={isUploading}
            className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display text-sm"
          >
            <FiX className="w-4 h-4 inline mr-1" />
            Remove
          </button>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 font-display">
          💡 Tip: Use a square image for best results
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
