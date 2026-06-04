/**
 * VerifiedAvatar — avatar + verification badge (Orbital design).
 *
 * Badge tiers:
 *  premium       → white badge  "Verified"
 *  super_premium → purple badge  "Gold Verified"
 *
 * Uses official badge images instead of SVG rendering.
 */
import { getVerificationBadge } from '../utils/verificationUtils';
import whiteBadgeImg from '../assets/white badge.png';
import purpleBadgeImg from '../assets/purple badge.png';

function resolveVerificationStatus(user) {
  if (!user) return null;
  if (user.verificationStatus) return user.verificationStatus;
  if (user.isVerified) return 'premium';
  if (user.verificationType === 'gold') return 'super_premium';
  if (user.verificationType === 'white') return 'premium';
  return null;
}

function resolveAvatarUrl(user) {
  if (!user) return null;
  return user.image || user.avatar || user.avatarUrl || user.profileImage || null;
}

const SIZE = {
  xs: { wrap: 24,  badge: 12,  ring: 1.5 },
  sm: { wrap: 32,  badge: 14,  ring: 1.5 },
  md: { wrap: 48,  badge: 18,  ring: 2   },
  lg: { wrap: 72,  badge: 22,  ring: 2   },
  xl: { wrap: 120, badge: 32,  ring: 2.5 },
};

/**
 * Verified badge using official badge images.
 * Premium (verified) → White badge image
 * Super Premium (gold) → Purple badge image
 */
function VerifiedBadge({ tier, badgeSize, ringWidth }) {
  // Premium (verified) → White badge
  // Super Premium (gold) → Purple badge
  const isPurple = tier === 'gold';
  const badgeImg = isPurple ? purpleBadgeImg : whiteBadgeImg;

  return (
    <span
      title={isPurple ? 'Verified Creator' : 'Gold Verified Creator'}
      aria-label={isPurple ? 'Verified' : 'Gold Verified'}
      className="absolute pointer-events-none"
      style={{
        width:      badgeSize,
        height:     badgeSize,
        bottom:     -(ringWidth),
        right:      -(ringWidth),
      }}
    >
      <img
        src={badgeImg}
        alt={isPurple ? 'Verified' : 'Gold Verified'}
        className="w-full h-full"
        style={{ objectFit: 'contain' }}
      />
    </span>
  );
}

export default function VerifiedAvatar({
  user,
  size = 'md',
  className = '',
  alt,
  fallback,
  imgClassName = '',
}) {
  const dims   = SIZE[size] || SIZE.md;
  const status = resolveVerificationStatus(user);
  const badge  = status ? getVerificationBadge(status) : null;
  const src    = resolveAvatarUrl(user);
  const altTxt = alt || user?.username || user?.name || 'avatar';

  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: dims.wrap, height: dims.wrap }}
    >
      {src ? (
        <img
          src={src}
          alt={altTxt}
          className={`w-full h-full rounded-full object-cover ${imgClassName}`}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        fallback || (
          <span className="w-full h-full rounded-full bg-raised border border-border flex items-center justify-center text-ink-500 text-sm">
            👤
          </span>
        )
      )}
      {badge && (
        <VerifiedBadge
          tier={badge.type}
          badgeSize={dims.badge}
          ringWidth={dims.ring}
        />
      )}
    </span>
  );
}

/**
 * Standalone badge chip — Uses official badge images.
 * Premium (verified) → White badge image
 * Super Premium (gold) → Purple badge image
 */
export function VerifiedBadgeChip({ status, size = 'md' }) {
  const badge = status ? getVerificationBadge(status) : null;
  if (!badge) return null;

  // Premium (verified) → White badge
  // Super Premium (gold) → Purple badge
  const isPurple = badge.type === 'gold';
  const badgeImg = isPurple ? purpleBadgeImg : whiteBadgeImg;

  // Size mapping for badge icon
  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
  };

  const badgeSize = sizeMap[size] || 24;

  return (
    <img
      src={badgeImg}
      alt={isPurple ? 'Verified Creator' : 'Premium Creator'}
      width={badgeSize}
      height={badgeSize}
      className="inline-block"
      style={{ objectFit: 'contain' }}
      title={isPurple ? 'Verified Creator' : 'Premium Creator'}
    />
  );
}
