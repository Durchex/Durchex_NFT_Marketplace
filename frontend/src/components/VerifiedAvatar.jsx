/**
 * VerifiedAvatar — avatar + verification badge (Orbital design).
 *
 * Badge tiers:
 *  premium       → purple badge  (white tick)   "Verified"
 *  super_premium → white/silver badge (purple tick)  "Gold Verified"
 *
 * The badge design matches the Twitter/Instagram style:
 *  - Solid filled circle background
 *  - Bold white checkmark inside
 *  - Thin void-coloured outline ring to separate from the avatar
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
  xs: { wrap: 24,  badge: 12,  ring: 1.5 },
  sm: { wrap: 32,  badge: 14,  ring: 1.5 },
  md: { wrap: 48,  badge: 18,  ring: 2   },
  lg: { wrap: 72,  badge: 22,  ring: 2   },
  xl: { wrap: 120, badge: 32,  ring: 2.5 },
};

/**
 * Proper verified-tick badge — filled circle with bold checkmark.
 * Purple background + white tick for "verified".
 * White/silver background + purple tick for "gold".
 */
function VerifiedBadge({ tier, badgeSize, ringWidth }) {
  const isPurple = tier !== 'gold';

  const bg        = isPurple ? '#7c3aed'  : '#f8fafc';   // purple or near-white
  const tick      = isPurple ? '#ffffff'  : '#7c3aed';   // white or purple tick
  const glow      = isPurple ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.3)';

  const r = badgeSize / 2;

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
      <svg
        viewBox={`0 0 ${badgeSize} ${badgeSize}`}
        width={badgeSize}
        height={badgeSize}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Void-coloured ring separating badge from avatar */}
        <circle
          cx={r}
          cy={r}
          r={r}
          fill="var(--c-void, #05050d)"
        />
        {/* Filled badge circle */}
        <circle
          cx={r}
          cy={r}
          r={r - ringWidth * 0.6}
          fill={bg}
          filter={`drop-shadow(0 0 ${r * 0.35}px ${glow})`}
        />
        {/* Bold checkmark — scaled to badge size */}
        <polyline
          points={`
            ${r * 0.32},${r * 0.98}
            ${r * 0.65},${r * 1.32}
            ${r * 1.55},${r * 0.55}
          `}
          fill="none"
          stroke={tick}
          strokeWidth={r * 0.26}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
 * Standalone badge chip — used in lists, cards, and profile headers.
 * Shows as "✓ Verified" or "✓ Gold Verified" text pill.
 */
export function VerifiedBadgeChip({ status, size = 'sm' }) {
  const badge = status ? getVerificationBadge(status) : null;
  if (!badge) return null;

  const isPurple = badge.type !== 'gold';
  const textCls  = isPurple ? 'text-violet-300' : 'text-amber-300';
  const bgCls    = isPurple ? 'bg-violet-500/15 border-violet-500/30' : 'bg-amber-400/10 border-amber-400/30';
  const dotBg    = isPurple ? '#7c3aed' : '#fbbf24';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${bgCls} ${textCls}`}>
      {/* Mini tick badge */}
      <svg width="13" height="13" viewBox="0 0 13 13" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6.5" cy="6.5" r="6.5" fill={dotBg} />
        <polyline
          points="3.2,6.4 5.5,8.7 9.8,4.2"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {badge.label}
    </span>
  );
}
