import React, { useEffect, useState } from 'react';

const COLORS = ['#fbbf24', '#f59e0b', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];

/** Confetti / win burst – particles that rise and fade. */
export default function CasinoParticles({ active = false, count = 24, duration = 1200 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    const list = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 200,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      duration: duration * (0.7 + Math.random() * 0.6),
    }));
    setParticles(list);
    const t = setTimeout(() => setParticles([]), duration + 400);
    return () => clearTimeout(t);
  }, [active, count, duration]);

  if (particles.length === 0) return null;

  return (
    <div className="casino-particles overflow-hidden rounded-2xl" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="casino-particle"
          style={{
            left: `${p.left}%`,
            top: '50%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            '--px': `${p.px ?? 0}px`,
            animation: `particle-rise ${p.duration}ms ease-out ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}
