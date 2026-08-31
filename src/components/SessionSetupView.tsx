import React, { useState } from 'react';
import { 
  Play, 
  Clock, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Sparkles, 
  Layers, 
  Settings2, 
  Calendar, 
  Flame, 
  Plus,
  Smartphone,
  Download,
  FolderUp
} from 'lucide-react';
import { SessionConfig, TimerPreset, ReferencePack, ReferenceImage, UsageStats } from '../types';
import { ReferenceManager } from './ReferenceManager';
import { formatTime, formatTotalTimeDrawn } from '../utils/storage';

interface SessionSetupViewProps {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
  timerPresets: TimerPreset[];
  packs: ReferencePack[];
  customImages: ReferenceImage[];
  onStartSession: () => void;
  onOpenTimerModal: () => void;
  onOpenUploadModal: () => void;
  onOpenInstallModal?: () => void;
  onDeleteCustomImage: (id: string) => void;
  onToggleBookmark: (imageId: string) => void;
  stats: UsageStats;
}

export const SessionSetupView: React.FC<SessionSetupViewProps> = ({
  config,
  onConfigChange,
  timerPresets,
  packs,
  customImages,
  onStartSession,
  onOpenTimerModal,
  onOpenUploadModal,
  onOpenInstallModal,
  onDeleteCustomImage,
  onToggleBookmark,
  stats,
}) => {
  const activePreset = timerPresets.find((p) => p.id === config.timerPresetId) || timerPresets[0];

  const updateConfig = <K extends keyof SessionConfig>(key: K, val: SessionConfig[K]) => {
    onConfigChange({ ...config, [key]: val });
  };

  const handleTogglePack = (packId: string) => {
    const isSelected = config.selectedPackIds.includes(packId);
    let updated: string[];
    if (isSelected) {
      updated = config.selectedPackIds.filter((id) => id !== packId);
      if (updated.length === 0) updated = [packs[0].id]; // Ensure at least one pack is active
    } else {
      updated = [...config.selectedPackIds, packId];
    }
    updateConfig('selectedPackIds', updated);
  };

  const handleSelectAllPacks = () => {
    const allIds = [...packs.map((p) => p.id), ...(customImages.length > 0 ? ['pack-custom'] : [])];
    updateConfig('selectedPackIds', allIds);
  };

  const handleDeselectAllPacks = () => {
    updateConfig('selectedPackIds', [packs[0].id]);
  };

  // Calculate estimated session duration
  const activeDurationPerPose = activePreset?.isProgressive
    ? activePreset.stages?.reduce((acc, s) => acc + s.durationSeconds * s.poseCount, 0) || 300
    : (activePreset?.durationSeconds || config.customDuration || 60);

  const targetCount = activePreset?.isProgressive
    ? activePreset.stages?.reduce((acc, s) => acc + s.poseCount, 0) || 10
    : config.totalPosesTarget;

  const estimatedTotalSeconds = activePreset?.isProgressive
    ? activeDurationPerPose + (targetCount - 1) * config.breakBetweenPoses
    : (targetCount > 0 ? targetCount * (activeDurationPerPose + config.breakBetweenPoses) : 600);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fade-in text-neutral-100">
      {/* Hero Welcome / Studio Action Bar */}
      <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] uppercase tracking-wider">
                Artist Reference Engine
              </span>
              <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{stats.currentStreakDays} Day Streak</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready for Gesture Practice?
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300/90 leading-relaxed">
              Warm up your eyes and hand with interval-timed figure poses, dynamic dancers, animals, and custom uploaded reference sets.
            </p>
          </div>

          {/* Quick Launch CTA Card */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-stretch gap-3 shrink-0">
            <button
              id="btn-start-session-hero"
              type="button"
              onClick={onStartSession}
              className="px-8 py-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm sm:text-base shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <Play className="w-5 h-5 fill-current group-hover:translate-x-0.5 transition-transform" />
              <span>START DRAWING SESSION</span>
            </button>
            <div className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-2">
              <span>Duration: <b className="text-emerald-400 font-mono">{formatTotalTimeDrawn(estimatedTotalSeconds)}</b></span>
              <span>•</span>
              <span>Poses: <b className="text-indigo-300 font-mono">{targetCount === 0 ? 'Infinite' : targetCount}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer & Session Settings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Timer Selection Card (Span 2) */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Timer Preset & Duration</h2>
            </div>
            <button
              id="btn-manage-timers"
              type="button"
              onClick={onOpenTimerModal}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              Custom Presets ({timerPresets.length})
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {timerPresets.slice(0, 8).map((preset) => {
              const isSelected = preset.id === config.timerPresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    updateConfig('timerPresetId', preset.id);
                    updateConfig('isProgressive', !!preset.isProgressive);
                    if (!preset.isProgressive) {
                      updateConfig('customDuration', preset.durationSeconds);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between backdrop-blur-md ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/70 text-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-neutral-300 hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className="block font-bold text-xs truncate text-white">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                      {preset.description}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400 mt-2">
                    {preset.isProgressive
                      ? 'Class Sequence'
                      : formatTime(preset.durationSeconds)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Target Poses & Interval Break */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
            {/* Target Poses */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Session Target Poses
              </label>
              <div className="flex items-center gap-1.5">
                {[5, 10, 20, 30, 0].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => updateConfig('totalPosesTarget', count)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all backdrop-blur-sm ${
                      config.totalPosesTarget === count
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    {count === 0 ? '∞ Infinite' : `${count}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Break Between Poses */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Rest / Buffer Pause Between Poses
              </label>
              <div className="flex items-center gap-1.5">
                {[0, 3, 5, 8].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => updateConfig('breakBetweenPoses', sec)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all backdrop-blur-sm ${
                      config.breakBetweenPoses === sec
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    {sec === 0 ? 'None (0s)' : `${sec}s Rest`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Studio Atmosphere & Session Rules Card */}
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-3">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Studio Config</h2>
            </div>

            {/* Toggles */}
            <div className="space-y-3 text-xs">
              {/* Sound Alerts */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                  {config.soundAlerts ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  Pose Change Chime
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig('soundAlerts', !config.soundAlerts)}
                  className={`w-10 h-5 rounded-full transition-colors relative border border-white/10 ${
                    config.soundAlerts ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      config.soundAlerts ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Chime Type */}
              {config.soundAlerts && (
                <div className="flex items-center gap-1 pl-5">
                  {(['bell', 'wood', 'gong', 'chime'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateConfig('soundType', st)}
                      className={`px-2 py-1 rounded-lg text-[10px] uppercase font-mono capitalize transition-all ${
                        config.soundType === st
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}

              {/* Auto Shuffle */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                  Shuffle References
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig('shuffle', !config.shuffle)}
                  className={`w-10 h-5 rounded-full transition-colors relative border border-white/10 ${
                    config.shuffle ? 'bg-indigo-500' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      config.shuffle ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Auto B&W Mode */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">
                  Auto Black & White Mode
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig('autoGrayscale', !config.autoGrayscale)}
                  className={`w-10 h-5 rounded-full transition-colors relative border border-white/10 ${
                    config.autoGrayscale ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      config.autoGrayscale ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Flip Randomly */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">
                  Randomize Mirror Flip
                </span>
                <button
                  type="button"
                  onClick={() => updateConfig('autoFlipRandomly', !config.autoFlipRandomly)}
                  className={`w-10 h-5 rounded-full transition-colors relative border border-white/10 ${
                    config.autoFlipRandomly ? 'bg-indigo-500' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      config.autoFlipRandomly ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-[11px] text-neutral-400 leading-normal">
            💡 Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-emerald-300 border border-white/10">Space</kbd> anytime during drawing to pause/resume.
          </div>
        </div>
      </div>

      {/* Reference Library & Pack Selector */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <ReferenceManager
          packs={packs}
          customImages={customImages}
          selectedPackIds={config.selectedPackIds}
          onTogglePack={handleTogglePack}
          onSelectAllPacks={handleSelectAllPacks}
          onDeselectAllPacks={handleDeselectAllPacks}
          onOpenUploadModal={onOpenUploadModal}
          onDeleteCustomImage={onDeleteCustomImage}
          onToggleBookmark={onToggleBookmark}
          favoriteImageIds={stats.favoriteImageIds || []}
        />
      </div>

      {/* Android & Mobile App Installation Banner */}
      {onOpenInstallModal && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-900/50 to-indigo-500/10 border border-emerald-500/25 p-5 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center p-2.5 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-white text-sm sm:text-base">Download & Install on Android</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                  Offline Ready
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 max-w-xl">
                Install as a full-screen standalone application on your Android phone or tablet. Works completely offline with local storage and touch swipe controls.
              </p>
            </div>
          </div>

          <button
            id="btn-open-install-banner"
            type="button"
            onClick={onOpenInstallModal}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Install on Android
          </button>
        </div>
      )}
    </div>
  );
};
