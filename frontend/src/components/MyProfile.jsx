import React, { useState, useRef, useEffect, useContext } from "react";
import { Edit3, Share2 } from "lucide-react";
import { SuccessToast } from "../app/Toast/Success";
import { ErrorToast } from "../app/Toast/Error";
import LoadingSpinner from "./LoadingSpinner"; // Import the loading spinner
import { ICOContent } from "../Context"; // Import context

const MyProfile = () => {
  const { address } = useContext(ICOContent) || {};
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    image: "",
    socialLinks: [""],
    verificationStatus: false,
    bio: "",
    favoriteCreators: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [showShareOptions, setShowShareOptions] = useState(false);

  const fileInputRef = useRef();

  useEffect(() => {
    // Don't fetch profile if wallet is not connected
    if (!address) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `https://backend-2wkx.onrender.com/api/v1/user/users/${address}`
        );
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        console.log("🚀 ~ fetchProfile ~ data:", data);

        setProfileData({
          username: data.username || "",
          email: data.email || "",
          image: data.image || "",
          socialLinks: data.socialLinks?.length ? data.socialLinks : [""],
          verificationStatus: data.isVerified || false,
          bio: data.bio || "",
          favoriteCreators: data.favoriteCreators || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Optional: Show alert or toast here
      }
    };

    fetchProfile();
  }, [address]);

  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const imageUrl = URL.createObjectURL(file);
  //     setProfileData((prev) => ({ ...prev, image: imageUrl }));
  //   }
  // };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // Get the Base64 encoded image string
        const base64Image = reader.result;
  
        // Now, you can send this base64 string to the backend or store it in the database
        setProfileData((prev) => ({ ...prev, image: base64Image }));
      };
  
      reader.readAsDataURL(file); // Convert image to base64
    }
  };
  

  const handleSubmit = async () => {
    // Require wallet connection
    if (!address) {
      ErrorToast("Please connect your wallet first");
      return;
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      ErrorToast("Invalid wallet address format");
      return;
    }

    setIsLoading(true); // Start loading spinner

    try {
      const payload = {
        walletAddress: address, // Use actual wallet address from context
        username: profileData.username,
        bio: profileData.bio,
        email: profileData.email,
        isVerified: profileData.verificationStatus,
        socialLinks: profileData.socialLinks,
        image: profileData.image,
      };
      console.log("🚀 ~ handleSubmit ~ payload:", payload);

      const response = await fetch("https://backend-2wkx.onrender.com/api/v1/user/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const result = await response.json();
      console.log("Profile saved:", result);
      SuccessToast("Profile saved successfully!");
      setIsEditing(false); // turn off edit mode
    } catch (error) {
      console.error("Error submitting profile:", error);
      ErrorToast("There was an error saving your profile.");
    } finally {
      setIsLoading(false); // Stop loading spinner after API response
    }
  };

  const handleDelete = async () => {
    // Require wallet connection
    if (!address) {
      ErrorToast("Please connect your wallet first");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your profile? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `https://backend-2wkx.onrender.com/api/v1/user/users/${address}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete profile");
      }

      SuccessToast("Profile deleted successfully!");
      // Optional: redirect or reset state
      setProfileData({
        username: "",
        email: "",
        image: "",
        socialLinks: [""],
        verificationStatus: false,
        bio: "",
        favoriteCreators: "",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error deleting profile:", error);
      ErrorToast("There was an error deleting your profile.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (index, value) => {
    const newLinks = [...profileData.socialLinks];
    newLinks[index] = value;
    setProfileData((prev) => ({ ...prev, socialLinks: newLinks }));
  };

  const addSocialLink = () => {
    setProfileData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ""],
    }));
  };

  const handleShare = (type) => {
    const currentUrl = window.location.href;
    switch (type) {
      case "copy":
        navigator.clipboard.writeText(currentUrl);
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            currentUrl
          )}`
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
          )}`
        );
        break;
      default:
        break;
    }
    setShowShareOptions(false);
  };

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Require wallet connection
  if (!address) {
    return (
      <div className="relative py-6 md:py-10 px-4 md:px-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2 text-white">Wallet Not Connected</h2>
            <p className="text-gray-400">Please connect your wallet to access your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-6 md:py-10 px-4 md:px-12">
      {/* Profile Image and Username */}
      <div className="flex flex-col items-center mb-8 relative">
        <div
          className={`rounded-full overflow-hidden cursor-pointer group`}
          onClick={() => isEditing && fileInputRef.current.click()}
        >
          {profileData.image ? (
            <img
              src={profileData.image}
              alt="Profile"
              className="h-60 w-60 object-cover"
            />
          ) : (
            <div className="h-60 w-60 bg-gray-700" />
          )}
          {isEditing && (
            <div className="absolute top-0 left-0 h-60 w-60 rounded-full bg-black/50 flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition">
              Click to change image
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <input
          type="text"
          name="username"
          value={profileData.username}
          onChange={handleInputChange}
          placeholder="Username"
          className="text-center text-xl md:text-2xl font-bold bg-[#222] rounded px-4 py-2 text-white w-full max-w-xs mt-4"
          disabled={!isEditing}
        />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-20 right-3 flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={handleToggleEdit}
          className="flex items-center space-x-2 bg-[#2c06da] rounded-lg px-4 py-2 text-xs md:text-sm hover:bg-[#0205bd]"
        >
          <Edit3 className="h-4 w-4" />
          <span>{isEditing ? "Save" : "Edit"}</span>
        </button>

        <button
          onClick={() => setShowShareOptions(!showShareOptions)}
          className="flex items-center space-x-2 bg-[#c50344] rounded-lg px-4 py-2 text-xs md:text-sm hover:bg-[#b4028e]"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>

        {showShareOptions && (
          <div className="bg-[#222] rounded-lg p-2 shadow-lg z-10">
            <button
              onClick={() => handleShare("copy")}
              className="block w-full text-left px-4 py-2 hover:bg-[#333] text-xs md:text-sm"
            >
              Copy Link
            </button>
            <button
              onClick={() => handleShare("twitter")}
              className="block w-full text-left px-4 py-2 hover:bg-[#333] text-xs md:text-sm"
            >
              Share on Twitter
            </button>
            <button
              onClick={() => handleShare("facebook")}
              className="block w-full text-left px-4 py-2 hover:bg-[#333] text-xs md:text-sm"
            >
              Share on Facebook
            </button>
          </div>
        )}
      </div>

      {/* Profile Details */}
      <div className="space-y-6">
        <input
          type="email"
          name="email"
          value={profileData.email}
          onChange={handleInputChange}
          placeholder="Email"
          className="w-full bg-[#222] text-white p-3 rounded-lg"
          disabled={!isEditing}
        />

        <textarea
          name="bio"
          value={profileData.bio}
          onChange={handleInputChange}
          placeholder="Bio"
          className="w-full bg-[#222] text-white p-3 rounded-lg"
          disabled={!isEditing}
        ></textarea>

        {/* Social Links */}
        <div className="space-y-2">
          {profileData.socialLinks.map((link, index) => (
            <input
              key={index}
              type="text"
              value={link}
              onChange={(e) => handleSocialLinkChange(index, e.target.value)}
              placeholder={`Social Link ${index + 1}`}
              className="w-full bg-[#222] text-white p-3 rounded-lg"
              disabled={!isEditing}
            />
          ))}
          {isEditing && (
            <button
              onClick={addSocialLink}
              className="text-purple-400 text-sm mt-2"
            >
              + Add Social Link
            </button>
          )}
        </div>

        {/* Favorite Creator */}
        <input
          type="text"
          name="favoriteCreators"
          value={profileData.favoriteCreators}
          onChange={handleInputChange}
          placeholder="Favorite Creator Username"
          className="w-full bg-[#222] text-white p-3 rounded-lg"
          disabled={!isEditing}
        />

        {/* Verification Checkbox */}
        <div className="flex items-center gap-4">
          <label className="text-white">Verified:</label>
          <input
            type="checkbox"
            name="verificationStatus"
            checked={profileData.verificationStatus}
            onChange={(e) =>
              setProfileData((prev) => ({
                ...prev,
                verificationStatus: e.target.checked,
              }))
            }
            disabled={!isEditing}
          />
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-sm font-semibold"
          >
            {isLoading ? <LoadingSpinner /> : "Delete Profile"} 
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isEditing || isLoading} // disables button if not editing
            className={`w-full py-3 rounded-lg text-sm font-semibold 
    ${
      isEditing
        ? "bg-purple-600 hover:bg-purple-700 text-white"
        : "bg-gray-600 text-gray-300 cursor-not-allowed"
    }`}
          >
            {isLoading ? <LoadingSpinner /> : "Submit Profile"} 
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
