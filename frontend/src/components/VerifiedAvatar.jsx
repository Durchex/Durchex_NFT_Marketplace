/**
 * VerifiedAvatar — avatar + SVG verification badge (Orbital design).
 * Badge is rendered as an SVG checkmark on a purple (verified) or gold (super-premium) circle.
 * No external image dependency.
 */
import { getVerificationBadge } from '../utils/verificationUtils';

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
  xs: { wrap: 24,  badge: 11,  offset: -2 },
  sm: { wrap: 32,  badge: 13,  offset: -2 },
  md: { wrap: 48,  badge: 18,  offset: -3 },
  lg: { wrap: 72,  badge: 22,  offset: -4 },
  xl: { wrap: 120, badge: 32,  offset: -5 },
};

/* Checkmark SVG path */
const CHECK = 'M20 6 9 17l-5-5';

function BadgeIcon({ badge, size }) {
  const s = size;
  return (
    <span
      title={badge.title}
      aria-label={badge.label}
      className="absolute pointer-events-none flex items-center justify-center rounded-full"
      style={{
        width:      s,
        height:     s,
        background: badge.color,
        right:      -(s * 0.15),
        bottom:     -(s * 0.15),
        boxShadow:  `0 0 0 2px var(--c-void,#05050d), 0 0 ${s*0.4}px ${badge.color}60`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={badge.textColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: s * 0.58, height: s * 0.58 }}
      >
        <path d={CHECK} />
      </svg>
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
      {badge && <BadgeIcon badge={badge} size={dims.badge} />}
    </span>
  );
}
