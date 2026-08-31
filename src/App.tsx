import React, { useState, useEffect, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  SessionSetupView 
} from './components/SessionSetupView';
import { 
  ActiveSessionView 
} from './components/ActiveSessionView';
import { 
  StatsView 
} from './components/StatsView';
import { 
  TimerPresetsModal 
} from './components/TimerPresetsModal';
import { 
  ImageUploadModal 
} from './components/ImageUploadModal';
import { 
  ShortcutsModal 
} from './components/ShortcutsModal';
import { 
  SessionSummaryModal 
} from './components/SessionSummaryModal';

import { 
  DEFAULT_PACKS, 
  DEFAULT_REFERENCES, 
  DEFAULT_TIMER_PRESETS 
} from './data/defaultReferences';
import { 
  SessionConfig, 
  TimerPreset, 
  ReferencePack, 
  ReferenceImage, 
  UsageStats, 
  DrawingSession, 
  DarkModeTheme 
} from './types';
import { 
  loadSessionConfig, 
  saveSessionConfig, 
  loadTimerPresets, 
  saveTimerPresets, 
  loadUsageStats, 
  saveUsageStats, 
  recordCompletedSession, 
  loadTheme, 
  saveTheme, 
  INITIAL_USAGE_STATS 
} from './utils/storage';
import { 
  getAllCustomImages, 
  deleteCustomImage as deleteFromIndexedDB, 
  clearAllCustomImages 
} from './utils/indexedDB';

export default function App() {
  // App navigation state
  const [currentView, setCurrentView] = useState<'setup' | 'active' | 'stats'>('setup');

  // Core Data
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => loadSessionConfig());
  const [timerPresets, setTimerPresets] = useState<TimerPreset[]>(() => loadTimerPresets());
  const [customImages, setCustomImages] = useState<ReferenceImage[]>([]);
  const [stats, setStats] = useState<UsageStats>(() => loadUsageStats());
  const [theme, setTheme] = useState<DarkModeTheme>(() => loadTheme());

  // Active Session Queue & State
  const [activeQueue, setActiveQueue] = useState<ReferenceImage[]>([]);
  const [currentActivePreset, setCurrentActivePreset] = useState<TimerPreset>(() => {
    const saved = loadTimerPresets();
    const cfg = loadSessionConfig();
    return saved.find((p) => p.id === cfg.timerPresetId) || saved[0];
  });
  const [lastFinishedSession, setLastFinishedSession] = useState<DrawingSession | null>(null);

  // Modals state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Load custom images from IndexedDB on startup
  useEffect(() => {
    getAllCustomImages().then((imgs) => {
      if (imgs && imgs.length > 0) {
        setCustomImages(imgs);
      }
    });
  }, []);

  // Save session config changes
  useEffect(() => {
    saveSessionConfig(sessionConfig);
  }, [sessionConfig]);

  // Save theme changes
  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  // Sync theme class on body
  useEffect(() => {
    document.body.className = '';
    if (theme === 'oled-black') {
      document.body.classList.add('bg-black', 'text-neutral-100');
    } else if (theme === 'warm-ochre') {
      document.body.classList.add('bg-[#14110e]', 'text-[#f5f2eb]');
    } else if (theme === 'slate-atelier') {
      document.body.classList.add('bg-[#0b1120]', 'text-slate-100');
    } else {
      document.body.classList.add('bg-neutral-950', 'text-neutral-100');
    }
  }, [theme]);

  // Combine default packs with custom uploads
  const packs: ReferencePack[] = useMemo(() => {
    return DEFAULT_PACKS;
  }, []);

  const allAvailableImages: ReferenceImage[] = useMemo(() => {
    return [...DEFAULT_REFERENCES, ...customImages];
  }, [customImages]);

  // Toggle image bookmark / favorite
  const handleToggleBookmark = (imageId: string) => {
    if (!imageId) return;
    setStats((prev) => {
      const isFav = prev.favoriteImageIds?.includes(imageId);
      const updatedFavs = isFav
        ? prev.favoriteImageIds.filter((id) => id !== imageId)
        : [...(prev.favoriteImageIds || []), imageId];

      const newStats = {
        ...prev,
        favoriteImageIds: updatedFavs,
      };
      saveUsageStats(newStats);
      return newStats;
    });
  };

  // Timer Presets management
  const handleSaveTimerPreset = (preset: TimerPreset) => {
    setTimerPresets((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === preset.id);
      let updated: TimerPreset[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = preset;
      } else {
        updated = [preset, ...prev];
      }
      saveTimerPresets(updated);
      return updated;
    });
    // Auto select saved preset
    setSessionConfig((prev) => ({
      ...prev,
      timerPresetId: preset.id,
      isProgressive: !!preset.isProgressive,
      customDuration: preset.durationSeconds,
    }));
  };

  const handleDeleteTimerPreset = (presetId: string) => {
    setTimerPresets((prev) => {
      const updated = prev.filter((p) => p.id !== presetId);
      saveTimerPresets(updated);
      return updated;
    });
    if (sessionConfig.timerPresetId === presetId) {
      setSessionConfig((prev) => ({
        ...prev,
        timerPresetId: DEFAULT_TIMER_PRESETS[0].id,
        isProgressive: false,
        customDuration: DEFAULT_TIMER_PRESETS[0].durationSeconds,
      }));
    }
  };

  // Custom Image Uploads
  const handleImagesUploaded = (newImages: ReferenceImage[]) => {
    setCustomImages((prev) => [...newImages, ...prev]);
    // Auto select custom pack in session config
    if (!sessionConfig.selectedPackIds.includes('pack-custom')) {
      setSessionConfig((prev) => ({
        ...prev,
        selectedPackIds: [...prev.selectedPackIds, 'pack-custom'],
      }));
    }
  };

  const handleDeleteCustomImage = async (id: string) => {
    await deleteFromIndexedDB(id);
    setCustomImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Start Gesture Drawing Session
  const handleStartSession = () => {
    // Collect images from selected packs
    let pool: ReferenceImage[] = [];

    sessionConfig.selectedPackIds.forEach((packId) => {
      if (packId === 'pack-custom') {
        pool.push(...customImages);
      } else {
        const p = packs.find((pk) => pk.id === packId);
        if (p) {
          pool.push(...p.images);
        }
      }
    });

    if (pool.length === 0) {
      pool = [...DEFAULT_REFERENCES];
    }

    // Deduplicate by ID
    const uniquePool = Array.from(new Map(pool.map((img) => [img.id, img])).values());

    // Shuffle if enabled
    let queue = [...uniquePool];
    if (sessionConfig.shuffle) {
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }

    // If target poses is set and greater than queue length, repeat queue
    const target = sessionConfig.totalPosesTarget;
    if (target > 0 && queue.length < target) {
      while (queue.length < target) {
        queue = [...queue, ...uniquePool];
      }
    }

    const preset = timerPresets.find((p) => p.id === sessionConfig.timerPresetId) || timerPresets[0];

    setActiveQueue(queue);
    setCurrentActivePreset(preset);
    setCurrentView('active');
  };

  // Start Session strictly from bookmarked favorites
  const handleStartSessionFromFavorites = () => {
    const favs = allAvailableImages.filter((img) => stats.favoriteImageIds?.includes(img.id));
    if (favs.length === 0) return;

    let queue = [...favs];
    if (sessionConfig.shuffle) {
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }

    const preset = timerPresets.find((p) => p.id === sessionConfig.timerPresetId) || timerPresets[0];
    setActiveQueue(queue);
    setCurrentActivePreset(preset);
    setCurrentView('active');
  };

  // Handle Session Finish
  const handleFinishSession = (sessionData: DrawingSession) => {
    const updatedStats = recordCompletedSession(sessionData);
    setStats(updatedStats);
    setLastFinishedSession(sessionData);
    setIsSummaryModalOpen(true);
  };

  // Clear all statistics
  const handleClearStats = () => {
    saveUsageStats(INITIAL_USAGE_STATS);
    setStats(INITIAL_USAGE_STATS);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0a0a0c] text-neutral-100 relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Frosted Glass Background Ambient Lighting Orbs */}
      <div className="fixed top-[-100px] left-[-100px] w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-50px] right-[-50px] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[15%] w-[320px] h-[320px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Top Studio Navigation Bar */}
      <Header
        currentView={currentView}
        theme={theme}
        onThemeChange={setTheme}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenStats={() => setCurrentView(currentView === 'stats' ? 'setup' : 'stats')}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        stats={stats}
      />

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col relative z-10">
        {currentView === 'setup' && (
          <SessionSetupView
            config={sessionConfig}
            onConfigChange={setSessionConfig}
            timerPresets={timerPresets}
            packs={packs}
            customImages={customImages}
            onStartSession={handleStartSession}
            onOpenTimerModal={() => setIsTimerModalOpen(true)}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onDeleteCustomImage={handleDeleteCustomImage}
            onToggleBookmark={handleToggleBookmark}
            stats={stats}
          />
        )}

        {currentView === 'stats' && (
          <StatsView
            stats={stats}
            allImages={allAvailableImages}
            onStartSessionFromFavorites={handleStartSessionFromFavorites}
            onBackToStudio={() => setCurrentView('setup')}
            onClearStats={handleClearStats}
          />
        )}

        {currentView === 'active' && (
          <ActiveSessionView
            queue={activeQueue}
            config={sessionConfig}
            activePreset={currentActivePreset}
            onFinishSession={handleFinishSession}
            onExitWithoutSave={() => setCurrentView('setup')}
            onToggleBookmark={handleToggleBookmark}
            favoriteImageIds={stats.favoriteImageIds || []}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <TimerPresetsModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        presets={timerPresets}
        activePresetId={sessionConfig.timerPresetId}
        onSelectPreset={(presetId) => {
          const p = timerPresets.find((tp) => tp.id === presetId);
          setSessionConfig((prev) => ({
            ...prev,
            timerPresetId: presetId,
            isProgressive: !!p?.isProgressive,
            customDuration: p?.durationSeconds || prev.customDuration,
          }));
        }}
        onSavePreset={handleSaveTimerPreset}
        onDeletePreset={handleDeleteTimerPreset}
      />

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImagesUploaded={handleImagesUploaded}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {isSummaryModalOpen && lastFinishedSession && (
        <SessionSummaryModal
          session={lastFinishedSession}
          stats={stats}
          onRestart={() => {
            setIsSummaryModalOpen(false);
            handleStartSession();
          }}
          onCloseToHome={() => {
            setIsSummaryModalOpen(false);
            setCurrentView('setup');
          }}
          onToggleBookmarkImage={handleToggleBookmark}
        />
      )}
    </div>
  );
}
