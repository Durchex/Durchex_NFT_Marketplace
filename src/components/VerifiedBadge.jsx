import React from 'react';
import { FiCheck, FiClock, FiX } from 'react-icons/fi';

const VerifiedBadge = ({ status = 'none', small = false }) => {
  const classBase = small ? 'text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1' : 'text-sm px-3 py-1 rounded-full font-semibold inline-flex items-center gap-2';

  switch (status) {
    case 'premium':
      return (
        <span className={`bg-blue-600 text-white ${classBase}`} title="Premium Verified">
          <FiCheck className="w-4 h-4" /> Premium
        </span>
      );
    case 'super_premium':
      return (
        <span className={`bg-purple-600 text-white ${classBase}`} title="Super Premium Verified">
          <FiCheck className="w-4 h-4" /> Super
        </span>
      );
    case 'pending':
      return (
        <span className={`bg-yellow-500 text-black ${classBase}`} title="Verification Pending">
          <FiClock className="w-4 h-4" /> Pending
        </span>
      );
    case 'rejected':
      return (
        <span className={`bg-red-600 text-white ${classBase}`} title="Verification Rejected">
          <FiX className="w-4 h-4" /> Rejected
        </span>
      );
    default:
      return null;
  }
};

export default VerifiedBadge;
