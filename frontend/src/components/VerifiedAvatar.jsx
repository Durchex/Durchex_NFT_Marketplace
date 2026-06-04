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
  // Premium (verified) → White bg + purple tick
  // Super Premium (gold) → Purple bg + white tick
  const isPurple = tier === 'gold';

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
 * Standalone badge chip — Star/seal style verification badge with rounded points.
 * Premium (verified) → White bg + purple checkmark
 * Super Premium (gold) → Purple bg + white checkmark
 */
export function VerifiedBadgeChip({ status, size = 'md' }) {
  const badge = status ? getVerificationBadge(status) : null;
  if (!badge) return null;

  // Premium (verified) → White bg + purple tick
  // Super Premium (gold) → Purple bg + white tick
  const isPurple = badge.type === 'gold';
  const badgeBg  = isPurple ? '#7c3aed' : '#f8fafc';
  const tickColor = isPurple ? '#ffffff' : '#7c3aed';

  // Size mapping for badge icon
  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
  };

  const badgeSize = sizeMap[size] || 24;

  // Generate rounded star/seal badge path with 12 soft points
  const generateRoundedStarPath = () => {
    const points = [];
    const center = 50;
    const outerRadius = 42;
    const innerRadius = 28;
    const pointCount = 12;
    const cornerRadius = 3; // Rounded corner radius

    for (let i = 0; i < pointCount; i++) {
      const angle = (i * 360) / pointCount - 90;
      const rad = (angle * Math.PI) / 180;

      // Outer point (tip of star)
      const outerX = center + outerRadius * Math.cos(rad);
      const outerY = center + outerRadius * Math.sin(rad);

      // Inner point (valley of star)
      const nextAngle = ((i + 1) * 360) / pointCount - 90;
      const nextRad = (nextAngle * Math.PI) / 180;
      const innerX = center + innerRadius * Math.cos(nextRad - Math.PI / pointCount);
      const innerY = center + innerRadius * Math.sin(nextRad - Math.PI / pointCount);

      points.push({
        outer: { x: outerX, y: outerY },
        inner: { x: innerX, y: innerY }
      });
    }

    // Build path with rounded corners using quadratic curves
    let path = `M ${center} ${center - outerRadius}`;

    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];

      // Curve to outer point
      path += ` Q ${current.outer.x} ${current.outer.y} ${current.outer.x + (next.inner.x - current.outer.x) * 0.3} ${current.outer.y + (next.inner.y - current.outer.y) * 0.3}`;
      // Curve to inner point
      path += ` Q ${next.inner.x} ${next.inner.y} ${next.outer.x} ${next.outer.y}`;
    }

    path += ' Z';
    return path;
  };

  return (
    <svg
      width={badgeSize}
      height={badgeSize}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      title={isPurple ? 'Verified Creator' : 'Premium Creator'}
      className="inline-block"
    >
      {/* Rounded star/seal badge shape */}
      <path
        d={generateRoundedStarPath()}
        fill={badgeBg}
      />

      {/* Checkmark in center */}
      <polyline
        points="35,50 45,60 65,40"
        fill="none"
        stroke={tickColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
