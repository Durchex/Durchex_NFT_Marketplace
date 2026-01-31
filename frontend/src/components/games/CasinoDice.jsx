import React from 'react';

/** Pip layouts for standard die faces (1–6). Positions in % from top-left. */
const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [[20, 20], [80, 80]],
  3: [[20, 20], [50, 50], [80, 80]],
  4: [[20, 20], [80, 20], [20, 80], [80, 80]],
  5: [[20, 20], [80, 20], [50, 50], [20, 80], [80, 80]],
  6: [[20, 20], [20, 50], [20, 80], [80, 20], [80, 50], [80, 80]],
};

function Face({ value, size = 48 }) {
  const pips = PIP_LAYOUTS[value] || PIP_LAYOUTS[1];
  const r = size / 12;
  return (
    <div
      className="absolute w-full h-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-300 border-2 border-slate-400 flex items-center justify-center"
      style={{
        boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.3)',
        backfaceVisibility: 'hidden',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
        {pips.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={12}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

/** 3D die showing value 1–6. Use CSS .dice-roll-animation on wrapper when rolling. */
export default function CasinoDice({ value = 1, rolling = false, size = 96, className = '' }) {
  const dim = size;
  const half = dim / 2;
  const rot = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: 90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: -90 },
    6: { x: 0, y: 180 },
  };
  const { x, y } = rot[value] ?? rot[1];

  return (
    <div
      className={`casino-perspective inline-flex items-center justify-center ${className}`}
      style={{ width: dim, height: dim, perspective: '280px' }}
    >
      <div
        className={`relative ${rolling ? 'dice-roll-animation' : ''}`}
        style={{
          width: dim,
          height: dim,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${x}deg) rotateY(${y}deg)`,
          transition: rolling ? 'none' : 'transform 0.35s ease-out',
        }}
      >
        {/* Front (1) */}
        <div style={{ position: 'absolute', width: dim, height: dim, transform: `translateZ(${half}px)` }}>
          <Face value={1} size={dim} />
        </div>
        {/* Back (6) */}
        <div style={{ position: 'absolute', width: dim, height: dim, transform: `rotateY(180deg) translateZ(${half}px)` }}>
          <Face value={6} size={dim} />
        </div>
        {/* Right (2) */}
        <div style={{ position: 'absolute', width: dim, height: dim, transform: `rotateY(90deg) translateZ(${half}px)` }}>
          <Face value={2} size={dim} />
        </div>
        {/* Left (5) */}
        <div style={{ position: 'absolute', width: dim, height: dim, transform: `rotateY(-90deg) translateZ(${half}px)` }}>
          <Face value={5} size={dim} />
        </div>
        {/* Top (3) */}
        <div style={{ position: 'absolute', width: dim, height: dim, transform: `rotateX(90deg) translateZ(${half}px)` }}>
          <Face value={3} size={dim} />
        </div>
        {/* Bottom (4) */}
        <div style={{ position: 'absolute', width: dim, height: dim, transform: `rotateX(-90deg) translateZ(${half}px)` }}>
          <Face value={4} size={dim} />
        </div>
      </div>
    </div>
  );
}
