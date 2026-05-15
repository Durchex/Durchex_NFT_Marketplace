import React from 'react';
import { getVerificationBadge } from '../utils/verificationUtils';

/**
 * Resolve a user/creator's verification status from whatever shape the caller has.
 * Tries (in order): explicit verificationStatus → legacy isVerified bool → mock verificationType.
 */
function resolveVerificationStatus(user) {
  if (!user) return null;
  if (user.verificationStatus) return user.verificationStatus;
  if (user.isVerified) return 'premium';
  if (user.verificationType === 'gold') return 'super_premium';
  if (user.verificationType === 'white') return 'premium';
  return null;
}

/**
 * Resolve the avatar image URL from whatever field the caller has.
 */
function resolveAvatarUrl(user) {
  if (!user) return null;
  return user.image || user.avatar || user.avatarUrl || user.profileImage || null;
}

const sizeMap = {
  xs: { wrap: 24, badge: 10, badgeOffset: -2 },
  sm: { wrap: 32, badge: 12, badgeOffset: -2 },
  md: { wrap: 48, badge: 16, badgeOffset: -3 },
  lg: { wrap: 72, badge: 22, badgeOffset: -4 },
  xl: { wrap: 120, badge: 32, badgeOffset: -4 },
};

/**
 * Avatar with a verification badge overlay in the bottom-right corner.
 *
 * Props:
 *   user      — object holding image/avatar + verificationStatus/isVerified
 *   size      — 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 *   className — extra classes for the wrapper
 *   alt       — alt text for the image (default user.username || 'avatar')
 *   fallback  — element shown when no avatar URL (default emoji placeholder)
 */
const VerifiedAvatar = ({
  user,
  size = 'md',
  className = '',
  alt,
  fallback,
  imgClassName = '',
}) => {
  const dims = sizeMap[size] || sizeMap.md;
  const status = resolveVerificationStatus(user);
  const badge = status ? getVerificationBadge(status) : null;
  const src = resolveAvatarUrl(user);
  const altText = alt || user?.username || user?.name || 'avatar';

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: dims.wrap, height: dims.wrap }}
    >
      {src ? (
        <img
          src={src}
          alt={altText}
          className={`w-full h-full rounded-full object-cover ${imgClassName}`}
        />
      ) : (
        fallback || (
          <span className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
            👤
          </span>
        )
      )}
      {badge && (
        <img
          src={badge.imageUrl}
          alt={badge.label}
          title={badge.title}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: dims.badge,
            height: dims.badge,
            right: dims.badgeOffset,
            bottom: dims.badgeOffset,
          }}
        />
      )}
    </span>
  );
};

export default VerifiedAvatar;
