import React, { useState } from 'react';
import { Keyboard, X, Smartphone, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'touch'>('shortcuts');

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Pause / Resume timer' },
    { key: '→ or N', desc: 'Next reference pose' },
    { key: '← or P', desc: 'Previous reference pose' },
    { key: 'S', desc: 'Skip current pose' },
    { key: 'Shift + F', desc: 'Toggle Full Screen mode' },
    { key: 'B', desc: 'Turn Black & White (Grayscale)' },
    { key: 'F', desc: 'Flip image Horizontally' },
    { key: 'V', desc: 'Flip image Vertically' },
    { key: 'G', desc: 'Cycle Grid overlay (Thirds, Square, etc.)' },
    { key: 'Q', desc: 'Toggle Squint / Blur mode (value study)' },
    { key: 'H', desc: 'Toggle Distraction-Free UI (Hide controls)' },
    { key: 'M', desc: 'Mute / Unmute audio chimes' },
    { key: 'Esc', desc: 'End session & review stats' },
  ];

  const touchGestures = [
    { gesture: 'Swipe Left (←)', desc: 'Advance to the next reference pose smoothly' },
    { gesture: 'Swipe Right (→)', desc: 'Go back to the previous reference pose' },
    { gesture: 'Tap Side Chevrons', desc: 'Quickly navigate poses using left/right screen buttons' },
    { gesture: 'Pinch / Wheel Zoom', desc: 'Zoom into pose details, then drag to pan' },
    { gesture: 'Tap Countdown Clock', desc: 'Quickly pause or resume the gesture session' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 rounded-3xl p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            {activeTab === 'shortcuts' ? (
              <Keyboard className="w-5 h-5" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
            <span>Studio Controls & Gestures</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'shortcuts'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Keyboard Shortcuts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('touch')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'touch'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Touch & Swipes</span>
          </button>
        </div>

        {activeTab === 'shortcuts' ? (
          <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 text-xs no-scrollbar">
            {shortcuts.map((sc, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10"
              >
                <span className="text-neutral-300 font-medium">{sc.desc}</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/15 font-mono text-[11px] text-emerald-300 shadow-inner">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 text-xs no-scrollbar">
            {touchGestures.map((tg, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 py-2.5 px-3 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10"
              >
                <div>
                  <span className="font-semibold text-emerald-300 block mb-0.5">{tg.gesture}</span>
                  <span className="text-neutral-300 text-[11px] leading-relaxed">{tg.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs shadow-md transition-colors"
          >
            Got it, Back to Drawing
          </button>
        </div>
      </div>
    </div>
  );
};
