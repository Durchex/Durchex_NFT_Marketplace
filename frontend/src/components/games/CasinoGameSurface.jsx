import React from 'react';
import '../../styles/casino.css';

/**
 * Layered game surface: background → game surface → overlay → effects.
 * Visual only; no game logic. Accepts optional backgroundImage for asset theming.
 */
export default function CasinoGameSurface({
  children,
  className = '',
  themeColor = 'emerald',
  pulse = false,
  idle = true,
  backgroundImage,
  overlayGradient,
}) {
  const accentGlow = {
    amber: 'rgba(245, 158, 11, 0.08)',
    emerald: 'rgba(16, 185, 129, 0.08)',
    violet: 'rgba(139, 92, 246, 0.08)',
    red: 'rgba(239, 68, 68, 0.08)',
    cyan: 'rgba(6, 182, 212, 0.08)',
  }[themeColor] || 'rgba(16, 185, 129, 0.08)';

  return (
    <div className={`casino-game-layer rounded-3xl overflow-hidden ${pulse ? 'neon-pulse' : ''} ${className}`}>
      {/* Layer 1: Background */}
      <div
        className="casino-layer-bg"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: backgroundImage ? 'cover' : undefined,
          backgroundPosition: 'center',
        }}
      >
        {!backgroundImage && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${accentGlow} 0%, transparent 60%)`,
            }}
          />
        )}
      </div>

      {/* Layer 2: Game surface */}
      <div className="casino-layer-surface casino-glass border-2 border-white/10 p-6 md:p-8 lg:p-10">
        {children}
      </div>

      {/* Layer 3: Overlay (optional gradient) */}
      {overlayGradient && (
        <div
          className="casino-layer-overlay"
          style={{ background: overlayGradient }}
        />
      )}

      {/* Layer 4: Effects (idle shimmer) */}
      {idle && (
        <div className="casino-layer-effects casino-idle-shimmer">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}
    </div>
  );
}
