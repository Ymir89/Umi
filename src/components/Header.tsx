import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Clock, 
  UploadCloud, 
  TrendingUp, 
  Flame, 
  Keyboard, 
  Moon, 
  Sun,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { DarkModeTheme, UsageStats } from '../types';

interface HeaderProps {
  currentView: 'setup' | 'active' | 'stats';
  theme: DarkModeTheme;
  onThemeChange: (theme: DarkModeTheme) => void;
  onOpenTimerModal: () => void;
  onOpenUploadModal: () => void;
  onOpenStats: () => void;
  onOpenShortcuts: () => void;
  stats: UsageStats;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  theme,
  onThemeChange,
  onOpenTimerModal,
  onOpenUploadModal,
  onOpenStats,
  onOpenShortcuts,
  stats,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  if (currentView === 'active') {
    // In active session, the session component manages its own minimal overlay bar
    return null;
  }

  const themes: { id: DarkModeTheme; name: string; color: string }[] = [
    { id: 'studio-charcoal', name: 'Studio Charcoal', color: 'bg-neutral-950 border-neutral-700' },
    { id: 'oled-black', name: 'OLED Pure Black', color: 'bg-black border-neutral-800' },
    { id: 'warm-ochre', name: 'Warm Ochre Night', color: 'bg-[#181410] border-[#382f25]' },
    { id: 'slate-atelier', name: 'Slate Atelier', color: 'bg-[#0f172a] border-[#1e293b]' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-white/[0.04] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 text-black flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/20">
            G
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
              GESTURE.STUDIO
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                PRO ARTIST
              </span>
            </span>
            <p className="hidden md:block text-[11px] text-neutral-400 tracking-wide">
              Figure drawing timer & reference engine
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Streak Indicator */}
          <button
            type="button"
            onClick={onOpenStats}
            title={`${stats.currentStreakDays} day drawing streak`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-rose-300 text-xs font-semibold backdrop-blur-md transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-500" />
            <span className="font-mono">{stats.currentStreakDays}</span>
            <span className="hidden sm:inline text-[11px] text-neutral-400">streak</span>
          </button>

          {/* Saved Timers Button */}
          <button
            id="btn-nav-timers"
            type="button"
            onClick={onOpenTimerModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-200 text-xs font-semibold border border-white/10 backdrop-blur-md transition-all hover:text-white"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Timers</span>
          </button>

          {/* Upload Photos Button */}
          <button
            id="btn-nav-upload"
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-100 text-xs font-semibold border border-white/15 backdrop-blur-md transition-all shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">UPLOAD PHOTOS</span>
          </button>

          {/* Usage Statistics Button */}
          <button
            id="btn-nav-stats"
            type="button"
            onClick={onOpenStats}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${
              currentView === 'stats'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                : 'bg-white/5 hover:bg-white/15 text-neutral-200 border-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Stats</span>
          </button>

          {/* Shortcuts Button */}
          <button
            id="btn-nav-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 backdrop-blur-md transition-all"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Full Screen Option Button */}
          <button
            id="btn-nav-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-full border backdrop-blur-md transition-all ${
              isFullscreen 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10'
            }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Theme Palette Switcher Dropdown */}
          <div className="relative group">
            <button
              id="btn-theme-switcher"
              type="button"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 backdrop-blur-md transition-all"
              title="Frosted Glass & Studio Themes"
            >
              <Moon className="w-4 h-4 text-emerald-400" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 p-2 rounded-2xl bg-[#0e0e12]/95 backdrop-blur-xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all text-xs z-50">
              <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Studio Palette
              </span>
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onThemeChange(t.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    theme === t.id
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span>{t.name}</span>
                  <div className={`w-3 h-3 rounded-full border ${t.color}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
