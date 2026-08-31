import React from 'react';

interface GridOverlayProps {
  type: 'none' | 'thirds' | 'grid3x3' | 'square' | 'crosshair' | 'golden';
  opacity: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ type, opacity }) => {
  if (type === 'none') return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-200 z-10"
      style={{ opacity }}
    >
      {type === 'thirds' && (
        <div className="w-full h-full relative border border-amber-400/40">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-amber-400/60" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-amber-400/60" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-amber-400/60" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-amber-400/60" />
          {/* Intersection anchor points */}
          <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-amber-300 bg-amber-500/50" />
          <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-amber-300 bg-amber-500/50" />
          <div className="absolute top-2/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-amber-300 bg-amber-500/50" />
          <div className="absolute top-2/3 left-2/3 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-amber-300 bg-amber-500/50" />
        </div>
      )}

      {type === 'grid3x3' && (
        <div className="w-full h-full relative grid grid-cols-4 grid-rows-4 border border-cyan-400/40">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border border-cyan-400/30" />
          ))}
        </div>
      )}

      {type === 'square' && (
        <div className="w-full h-full relative flex items-center justify-center">
          <div className="aspect-square h-full max-w-full border-2 border-dashed border-emerald-400/70" />
        </div>
      )}

      {type === 'crosshair' && (
        <div className="w-full h-full relative border border-rose-400/30">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-rose-400/80 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-rose-400/80 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-rose-400/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-rose-400" />
        </div>
      )}

      {type === 'golden' && (
        <div className="w-full h-full relative border border-amber-300/40">
          {/* Golden section lines (0.618 & 0.382) */}
          <div className="absolute top-[38.2%] left-0 right-0 h-px bg-amber-300/70" />
          <div className="absolute top-[61.8%] left-0 right-0 h-px bg-amber-300/70" />
          <div className="absolute left-[38.2%] top-0 bottom-0 w-px bg-amber-300/70" />
          <div className="absolute left-[61.8%] top-0 bottom-0 w-px bg-amber-300/70" />
          {/* Subtle diagonal dynamic symmetry lines */}
          <svg className="w-full h-full absolute inset-0 opacity-40">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>
      )}
    </div>
  );
};
