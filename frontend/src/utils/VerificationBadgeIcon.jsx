/**
 * VerificationBadgeIcon — standalone SVG badge component.
 * Usage: <VerificationBadgeIcon status="premium" size={18} />
 */
import { getVerificationBadge } from './verificationUtils';

export function VerificationBadgeIcon({ status, size = 18, className = '' }) {
  const badge = getVerificationBadge(status);
  if (!badge) return null;

  return (
    <span
      title={badge.title}
      aria-label={badge.label}
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{
        width:     size,
        height:    size,
        background: badge.color,
        boxShadow: `0 0 0 2px var(--c-void,#05050d), 0 0 ${size * 0.5}px ${badge.color}60`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={badge.textColor}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size * 0.6, height: size * 0.6 }}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

export default VerificationBadgeIcon;
