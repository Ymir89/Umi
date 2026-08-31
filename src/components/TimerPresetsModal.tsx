import React, { useState } from 'react';
import { Timer, Plus, Trash2, Edit2, Play, Check, X, Clock, Layers, Sparkles } from 'lucide-react';
import { TimerPreset, TimerStage } from '../types';
import { formatTime } from '../utils/storage';

interface TimerPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: TimerPreset[];
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onSavePreset: (preset: TimerPreset) => void;
  onDeletePreset: (presetId: string) => void;
}

export const TimerPresetsModal: React.FC<TimerPresetsModalProps> = ({
  isOpen,
  onClose,
  presets,
  activePresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [isProgressive, setIsProgressive] = useState(false);
  const [stages, setStages] = useState<TimerStage[]>([
    { id: '1', durationSeconds: 30, poseCount: 5, label: 'Warmup' },
    { id: '2', durationSeconds: 60, poseCount: 5, label: 'Gestures' },
    { id: '3', durationSeconds: 300, poseCount: 2, label: 'Detailed Studies' },
  ]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setDescription('');
    setMinutes(1);
    setSeconds(0);
    setIsProgressive(false);
    setStages([
      { id: '1', durationSeconds: 30, poseCount: 5, label: 'Warmup' },
      { id: '2', durationSeconds: 60, poseCount: 5, label: 'Gestures' },
    ]);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleStartEdit = (preset: TimerPreset) => {
    setEditingId(preset.id);
    setName(preset.name);
    setDescription(preset.description || '');
    setMinutes(Math.floor(preset.durationSeconds / 60));
    setSeconds(preset.durationSeconds % 60);
    setIsProgressive(!!preset.isProgressive);
    if (preset.stages && preset.stages.length > 0) {
      setStages(preset.stages);
    }
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalSecs = Math.max(5, minutes * 60 + seconds);
    const newPreset: TimerPreset = {
      id: editingId || `custom-timer-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || (isProgressive ? 'Custom progressive class timer' : `${totalSecs}s custom drawing timer`),
      durationSeconds: totalSecs,
      isProgressive,
      stages: isProgressive ? stages : undefined,
      isDefault: false,
      createdAt: Date.now(),
    };

    onSavePreset(newPreset);
    resetForm();
  };

  const addStage = () => {
    setStages([
      ...stages,
      {
        id: `stage-${Date.now()}`,
        durationSeconds: 60,
        poseCount: 3,
        label: `Stage ${stages.length + 1}`,
      },
    ]);
  };

  const updateStage = (index: number, key: keyof TimerStage, val: number | string) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [key]: val };
    setStages(updated);
  };

  const removeStage = (index: number) => {
    if (stages.length <= 1) return;
    setStages(stages.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-neutral-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Timer Presets & Saved Sets</h2>
              <p className="text-xs text-neutral-400">Manage studio interval timers or create your own custom class sequences</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create / Edit Form or Preset List */}
        {isCreating ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-semibold text-emerald-400 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {editingId ? 'Edit Timer Preset' : 'Create New Saved Timer'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cancel
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Preset Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2-Minute Anatomy Block, 30s Speed Sprint"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Description / Focus (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. For warmup hands or dynamic foreshortening"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Mode Switch: Single Duration vs Progressive Class */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsProgressive(false)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !isProgressive
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Single Interval (Fixed Duration)
              </button>

              <button
                type="button"
                onClick={() => setIsProgressive(true)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isProgressive
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Progressive Class Stages (Multi-Interval)
              </button>
            </div>

            {!isProgressive ? (
              /* Single Duration Pickers */
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 font-mono text-center text-emerald-300 text-base"
                  />
                </div>
                <span className="text-xl font-bold text-neutral-500 self-end mb-2">:</span>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-1">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 font-mono text-center text-emerald-300 text-base"
                  />
                </div>
                <div className="text-xs text-neutral-400 self-center pl-2">
                  Total: <span className="font-mono text-neutral-200 font-bold">{formatTime(minutes * 60 + seconds)}</span> per pose
                </div>
              </div>
            ) : (
              /* Multi-Stage Progressive Editor */
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Class Progression Stages:</span>
                  <button
                    type="button"
                    onClick={addStage}
                    className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Stage
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {stages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs"
                    >
                      <span className="font-bold text-neutral-500 w-4">#{idx + 1}</span>
                      <input
                        type="text"
                        value={stage.label || ''}
                        onChange={(e) => updateStage(idx, 'label', e.target.value)}
                        placeholder="Stage label (e.g. 30s gestures)"
                        className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-neutral-200"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-400">Poses:</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={stage.poseCount}
                          onChange={(e) => updateStage(idx, 'poseCount', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 px-1.5 py-1 rounded bg-white/5 border border-white/10 text-center font-mono text-indigo-300"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-400">Secs:</span>
                        <input
                          type="number"
                          min="5"
                          max="1800"
                          step="5"
                          value={stage.durationSeconds}
                          onChange={(e) => updateStage(idx, 'durationSeconds', Math.max(5, parseInt(e.target.value) || 5))}
                          className="w-16 px-1.5 py-1 rounded bg-white/5 border border-white/10 text-center font-mono text-emerald-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStage(idx)}
                        disabled={stages.length <= 1}
                        className="p-1 text-neutral-500 hover:text-rose-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="btn-save-timer-preset"
                type="submit"
                className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Save New Timer'}
              </button>
            </div>
          </form>
        ) : (
          /* Presets List */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">Available Timers & Presets ({presets.length})</span>
              <button
                id="btn-create-timer-preset"
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Custom Timer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {presets.map((preset) => {
                const isActive = preset.id === activePresetId;
                return (
                  <div
                    key={preset.id}
                    className={`relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between backdrop-blur-md ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                          {preset.name}
                          {preset.isProgressive && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-[10px] text-indigo-300 font-mono">
                              Progressive
                            </span>
                          )}
                        </h4>
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-black/50 px-2 py-0.5 rounded-lg border border-white/10">
                          {preset.isProgressive
                            ? `${preset.stages?.reduce((acc, s) => acc + s.poseCount, 0)} poses`
                            : formatTime(preset.durationSeconds)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                        {preset.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPreset(preset.id);
                          onClose();
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-black shadow-sm'
                            : 'bg-white/10 hover:bg-white/20 text-neutral-200'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        {isActive ? 'Selected' : 'Use Timer'}
                      </button>

                      <div className="flex items-center gap-1">
                        {!preset.isDefault && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(preset)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Edit Preset"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePreset(preset.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Delete Preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {preset.isDefault && (
                          <span className="text-[10px] text-neutral-500 px-1.5">Preset</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
