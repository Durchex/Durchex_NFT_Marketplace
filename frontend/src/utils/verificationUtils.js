/**
 * Verification Status Utilities
 * Maps between database verification status and UI display values
 */

/**
 * Maps database verification status to UI verification type
 * @param {string} verificationStatus - Database status: 'none', 'pending', 'premium', 'super_premium', 'rejected'
 * @returns {string|null} UI verification type: 'white', 'gold', or null
 */
export const getVerificationType = (verificationStatus) => {
  if (!verificationStatus) return null;
  
  const mapping = {
    'premium': 'white',
    'super_premium': 'gold',
  };
  
  return mapping[verificationStatus] || null;
};

/**
 * Gets verification badge display info
 * @param {string} verificationStatus - Database verification status
 * @returns {object} Badge info with type, label, and image URL
 */
export const getVerificationBadge = (verificationStatus) => {
  const type = getVerificationType(verificationStatus);
  
  if (type === 'gold') {
    return {
      type: 'gold',
      label: 'Gold Verified',
      imageUrl: 'https://imgur.com/5cAUe81.png',
      title: 'Gold verified'
    };
  }
  
  if (type === 'white') {
    return {
      type: 'white',
      label: 'Verified',
      imageUrl: 'https://imgur.com/pa1Y2LB.png',
      title: 'Verified'
    };
  }
  
  return null;
};

/**
 * Checks if user is verified (premium or super_premium)
 * @param {string} verificationStatus - Database verification status
 * @returns {boolean}
 */
export const isVerified = (verificationStatus) => {
  return verificationStatus === 'premium' || verificationStatus === 'super_premium';
};

/**
 * Gets human-readable verification status label
 * @param {string} verificationStatus - Database verification status
 * @returns {string}
 */
export const getVerificationLabel = (verificationStatus) => {
  const labels = {
    'none': 'Not Verified',
    'pending': 'Pending Review',
    'premium': 'Premium Verified',
    'super_premium': 'Super Premium Verified',
    'rejected': 'Rejected'
  };
  
  return labels[verificationStatus] || 'Unknown';
};

