import React from 'react';

/** SVG suit icons – scalable and crisp */
function SuitIcon({ suit, color, size = 24 }) {
  const isRed = suit === '♥' || suit === '♦';
  const fill = isRed ? '#dc2626' : '#1e293b';
  const w = size;
  const h = size;
  if (suit === '♠') {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill={fill}>
        <path d="M12 2C9 6 4 8 4 14c0 4 3.5 7 8 8 4.5-1 8-4 8-8 0-6-5-8-8-12z" />
      </svg>
    );
  }
  if (suit === '♥') {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill={fill}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  if (suit === '♦') {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill={fill}>
        <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.83l6.59 6.59L12 18.59l-6.59-6.57L12 4.83z" />
      </svg>
    );
  }
  if (suit === '♣') {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill={fill}>
        <path d="M12 4c-1.5 0-2.8.8-3.5 2-.5-.3-1-.5-1.5-.5-1.7 0-3 1.3-3 3 0 .8.3 1.5.8 2-.5.5-.8 1.2-.8 2 0 1.7 1.3 3 3 3h2v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V16h2c1.7 0 3-1.3 3-3 0-.8-.3-1.5-.8-2 .5-.5.8-1.2.8-2 0-1.7-1.3-3-3-3-.5 0-1 .2-1.5.5-.7-1.2-2-2-3.5-2z" />
      </svg>
    );
  }
  return null;
}

/** Realistic playing card – face or back. */
export default function CasinoCard({ card, index = 0, faceDown = false }) {
  const rank = card?.rank ?? '?';
  const suit = card?.suit ?? '♠';

  if (faceDown) {
    return (
      <div
        className="card-deal-in casino-3d-child rounded-lg overflow-hidden flex items-center justify-center border-2 border-slate-500"
        style={{
          width: '4rem',
          minWidth: '4rem',
          height: '5.5rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
          background: 'linear-gradient(145deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)',
          animationDelay: `${index * 0.08}s`,
        }}
      >
        <div className="grid grid-cols-2 gap-0.5 p-1 opacity-80">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-2 h-3 rounded-sm bg-amber-600/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-deal-in casino-3d-child rounded-lg overflow-hidden border-2 border-slate-400 flex flex-col bg-white"
      style={{
        width: '4rem',
        minWidth: '4rem',
        height: '5.5rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9)',
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div className="flex flex-col items-center justify-center flex-1 p-0.5">
        <span className="text-sm font-bold text-slate-800 leading-tight">{rank}</span>
        <div className="scale-75 -my-0.5">
          <SuitIcon suit={suit} />
        </div>
      </div>
    </div>
  );
}
