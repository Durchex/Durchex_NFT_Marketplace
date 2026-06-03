/**
 * Verification badge utilities — Orbital design system.
 *
 * Two tiers:
 *  premium       → white badge  (silver/white checkmark)
 *  super_premium → gold badge   (gold checkmark)
 *
 * Badges are rendered as inline SVG so they always match the design
 * and never have an external image dependency.
 */

export const getVerificationType = (status) => {
  if (!status) return null;
  const map = { premium: 'verified', super_premium: 'gold' };
  return map[status] || null;
};

/**
 * Returns badge config used by VerifiedAvatar and other components.
 *
 * type        — 'verified' | 'gold'
 * label       — short text (e.g. "Verified")
 * title       — tooltip / aria-label
 * color       — CSS color for the badge circle
 * svgPath     — checkmark SVG path (same for both tiers)
 */
export const getVerificationBadge = (status) => {
  const type = getVerificationType(status);
  if (!type) return null;

  const CHECK_PATH =
    'M20 6 9 17l-5-5';           // Simple tick (viewBox 0 0 24 24)

  if (type === 'gold') {
    return {
      type:     'gold',
      label:    'Gold Verified',
      title:    'Gold Verified Creator',
      color:    '#fbbf24',        // amber-400
      textColor:'#78350f',
      svgPath:  CHECK_PATH,
    };
  }

  return {
    type:     'verified',
    label:    'Verified',
    title:    'Verified Creator',
    color:    '#7c3aed',          // violet-700 (matches Orbital primary)
    textColor:'#fff',
    svgPath:  CHECK_PATH,
  };
};

export const isVerified = (status) =>
  status === 'premium' || status === 'super_premium';

export const getVerificationLabel = (status) =>
  ({
    none:          'Not Verified',
    pending:       'Pending Review',
    premium:       'Verified',
    super_premium: 'Gold Verified',
    rejected:      'Rejected',
  }[status] || 'Unknown');

// VerificationBadgeIcon is in VerificationBadgeIcon.jsx (needs JSX extension)
