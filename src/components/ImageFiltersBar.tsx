import React from 'react';
import { 
  Eye, 
  FlipHorizontal, 
  FlipVertical, 
  SunMedium, 
  Contrast, 
  Grid, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { ImageFilters } from '../types';

interface ImageFiltersBarProps {
  filters: ImageFilters;
  onFilterChange: (filters: ImageFilters) => void;
  onResetFilters: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ImageFiltersBar: React.FC<ImageFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  isOpen,
  onToggleOpen,
}) => {
  const update = <K extends keyof ImageFilters>(key: K, value: ImageFilters[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="relative z-30 pointer-events-auto">
      {/* Mini Quick Action Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full backdrop-blur-2xl bg-[#0c0c10]/90 border border-white/15 shadow-2xl shadow-black/60">
        {/* Black & White Toggle */}
        <button
          id="btn-filter-grayscale"
          type="button"
          onClick={() => update('grayscale', !filters.grayscale)}
          title="Turn Black & White (B)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            filters.grayscale
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full border border-current flex overflow-hidden">
            <span className="w-1/2 bg-current" />
            <span className="w-1/2 bg-transparent" />
          </div>
          <span>B&W</span>
        </button>

        {/* Flip Horizontal */}
        <button
          id="btn-filter-fliph"
          type="button"
          onClick={() => update('flipHorizontal', !filters.flipHorizontal)}
          title="Flip Horizontally (F)"
          className={`p-2 rounded-full text-xs font-medium transition-all ${
            filters.flipHorizontal
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        {/* Flip Vertical */}
        <button
          id="btn-filter-flipv"
          type="button"
          onClick={() => update('flipVertical', !filters.flipVertical)}
          title="Flip Vertically (V)"
          className={`p-2 rounded-full text-xs font-medium transition-all ${
            filters.flipVertical
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <FlipVertical className="w-4 h-4" />
        </button>

        {/* Squint / Blur Toggle */}
        <button
          id="btn-filter-squint"
          type="button"
          onClick={() => update('blur', filters.blur > 0 ? 0 : 4)}
          title="Squint / Blur Filter for Big Shapes (S)"
          className={`p-2 rounded-full text-xs font-medium transition-all ${
            filters.blur > 0
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Grid Selector */}
        <button
          id="btn-filter-grid"
          type="button"
          onClick={() => {
            const sequence: ImageFilters['gridType'][] = ['none', 'thirds', 'grid3x3', 'square', 'crosshair', 'golden'];
            const nextIdx = (sequence.indexOf(filters.gridType) + 1) % sequence.length;
            update('gridType', sequence[nextIdx]);
          }}
          title={`Grid: ${filters.gridType} (G)`}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            filters.gridType !== 'none'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="capitalize">{filters.gridType === 'none' ? 'Grid' : filters.gridType}</span>
        </button>

        <div className="w-px h-4 bg-white/15 mx-0.5" />

        {/* Expand Advanced Sliders Toggle */}
        <button
          id="btn-filter-more"
          type="button"
          onClick={onToggleOpen}
          title="Fine-tune values & contrast"
          className={`p-2 rounded-full text-xs transition-all ${
            isOpen
              ? 'bg-white/20 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Drawer / Floating Adjustments */}
      {isOpen && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 p-4 rounded-3xl backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 shadow-2xl text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Artist Value & Vision Tools
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-neutral-400 hover:text-emerald-400 flex items-center gap-1 text-[11px] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          {/* Contrast Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-neutral-400" />
                Contrast
              </span>
              <span className="font-mono text-neutral-400">{filters.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={filters.contrast}
              onChange={(e) => update('contrast', Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-300">
              <span className="flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-neutral-400" />
                Brightness
              </span>
              <span className="font-mono text-neutral-400">{filters.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              value={filters.brightness}
              onChange={(e) => update('brightness', Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Invert & Grid Opacity */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => update('invert', !filters.invert)}
              className={`py-1.5 px-2 rounded-xl font-medium border text-center transition-all ${
                filters.invert
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              Invert Negative
            </button>

            {filters.gridType !== 'none' ? (
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-xl border border-white/10">
                <span className="text-[10px] text-neutral-400">Grid Op:</span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.1"
                  value={filters.gridOpacity}
                  onChange={(e) => update('gridOpacity', Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded appearance-none accent-emerald-400"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center text-neutral-500 text-[11px]">
                Select Grid to adjust
              </div>
            )}
          </div>

          {/* Zoom Level */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-neutral-300">
            <span className="text-[11px] text-neutral-400">Zoom: {Math.round(filters.zoom * 100)}%</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => update('zoom', Math.max(0.5, Number((filters.zoom - 0.25).toFixed(2))))}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  update('zoom', 1.0);
                  update('panX', 0);
                  update('panY', 0);
                }}
                className="px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-neutral-300 font-semibold"
                title="Fit to Screen"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => update('zoom', Math.min(3.0, Number((filters.zoom + 0.25).toFixed(2))))}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
