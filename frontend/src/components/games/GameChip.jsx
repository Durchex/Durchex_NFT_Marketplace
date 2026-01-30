import React from 'react';
import '../../styles/casino.css';

/**
 * 3D-style chip for bets / balance display.
 */
export default function GameChip({ value, color = 'amber', size = 'md', className = '' }) {
  const sizes = { sm: 'w-10 h-10 text-xs', md: 'w-14 h-14 text-sm', lg: 'w-20 h-20 text-base' };
  const colors = {
    amber: 'bg-gradient-to-br from-amber-400 to-amber-700 border-amber-300/50 shadow-amber-500/30',
    emerald: 'bg-gradient-to-br from-emerald-400 to-emerald-700 border-emerald-300/50 shadow-emerald-500/30',
    violet: 'bg-gradient-to-br from-violet-400 to-violet-700 border-violet-300/50 shadow-violet-500/30',
    red: 'bg-gradient-to-br from-red-400 to-red-700 border-red-300/50 shadow-red-500/30',
    cyan: 'bg-gradient-to-br from-cyan-400 to-cyan-700 border-cyan-300/50 shadow-cyan-500/30',
  };
  return (
    <div
      className={`
        rounded-full border-2 flex items-center justify-center font-bold text-white
        shadow-lg chip-stack-in
        ${sizes[size]} ${colors[color]} ${className}
      `}
      style={{ boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
    >
      {value != null ? value : ''}
    </div>
  );
}
