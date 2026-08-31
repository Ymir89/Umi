import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Image as ImageIcon, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Bookmark,
  Share2,
  X
} from 'lucide-react';
import { DrawingSession, UsageStats } from '../types';
import { formatTotalTimeDrawn, formatTime } from '../utils/storage';

interface SessionSummaryModalProps {
  session: DrawingSession;
  stats: UsageStats;
  onRestart: () => void;
  onCloseToHome: () => void;
  onToggleBookmarkImage: (imageId: string) => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  stats,
  onRestart,
  onCloseToHome,
  onToggleBookmarkImage,
}) => {
  useEffect(() => {
    if (session.totalPosesCompleted > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#06b6d4', '#10b981'],
      });
    }
  }, [session.totalPosesCompleted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-neutral-100 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCloseToHome}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Back to Studio Home"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Practice Session Completed!
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-xs text-neutral-400">
              Preset: <span className="text-neutral-200 font-medium">{session.presetName}</span>
            </p>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 text-center shadow-lg">
            <div className="text-neutral-400 flex items-center justify-center gap-1 text-xs mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              Poses Drawn
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 font-mono">
              {session.totalPosesCompleted}
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 text-center shadow-lg">
            <div className="text-neutral-400 flex items-center justify-center gap-1 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Drawing Time
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
              {formatTotalTimeDrawn(session.totalTimeSpentSeconds)}
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 text-center shadow-lg">
            <div className="text-neutral-400 flex items-center justify-center gap-1 text-xs mb-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Daily Streak
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-300 font-mono flex items-center justify-center gap-0.5">
              {stats.currentStreakDays}
              <span className="text-xs text-rose-400 font-normal">days</span>
            </div>
          </div>
        </div>

        {/* Poses Completed Gallery Filmstrip */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span>Session Poses ({session.poses.length})</span>
            <span className="text-neutral-400 font-normal">Click bookmark to save favorites for future review</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar max-h-48">
            {session.poses.map((pose, idx) => {
              const isFav = stats.favoriteImageIds?.includes(pose.imageId);
              return (
                <div
                  key={`${pose.imageId}-${idx}`}
                  className="relative group shrink-0 w-24 h-32 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md"
                >
                  <img
                    src={pose.imageUrl}
                    alt={pose.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-1.5 pointer-events-none">
                    <span className="self-start px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-neutral-200">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] text-emerald-200 font-mono truncate">
                      {formatTime(pose.timeSpentSeconds)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleBookmarkImage(pose.imageId)}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-full backdrop-blur-md transition-all ${
                      isFav 
                        ? 'bg-emerald-500 text-black shadow-md' 
                        : 'bg-black/60 text-neutral-300 hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                    title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Tip */}
        <div className="p-3.5 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/10 text-xs text-neutral-300 flex items-start gap-2.5 mb-6">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-emerald-300">Artist Growth Tip:</span> Consistent daily 10-15 minute gesture sessions build stronger visual intuition, faster rhythm capture, and anatomical confidence than sporadic multi-hour marathons!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
          <button
            id="btn-summary-home"
            type="button"
            onClick={onCloseToHome}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-white/15 backdrop-blur-md bg-white/5 hover:bg-white/10 text-sm font-semibold text-neutral-200 transition-all text-center"
          >
            Back to Studio Hub
          </button>

          <button
            id="btn-summary-restart"
            type="button"
            onClick={onRestart}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Draw Another Session
          </button>
        </div>
      </div>
    </div>
  );
};
