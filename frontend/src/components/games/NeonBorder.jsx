import React from 'react';
import '../../styles/casino.css';

/**
 * Container with neon-style border and optional pulse. Use for game panels.
 */
export default function NeonBorder({
  children,
  className = '',
  color = 'amber', // amber | emerald | violet | red | cyan
  pulse = false,
  glass = true,
}) {
  const borderColors = {
    amber: 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    emerald: 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    violet: 'border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.2)]',
    red: 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    cyan: 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
  };
  const bc = borderColors[color] || borderColors.amber;

  return (
    <div
      className={`
        rounded-3xl border-2 p-6 md:p-8 lg:p-10
        ${glass ? 'casino-glass' : 'bg-gray-900/80'}
        ${bc}
        ${pulse ? 'neon-pulse' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
