import React, { useState } from 'react';
import { 
  Flame, 
  Clock, 
  Image as ImageIcon, 
  Trophy, 
  Calendar, 
  Bookmark, 
  RotateCcw, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  Target,
  Trash2,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { UsageStats, ReferenceImage, DrawingSession } from '../types';
import { formatTotalTimeDrawn, formatTime, getTodayDateStr } from '../utils/storage';

interface StatsViewProps {
  stats: UsageStats;
  allImages: ReferenceImage[];
  onStartSessionFromFavorites: () => void;
  onBackToStudio: () => void;
  onClearStats: () => void;
  onDeleteSessionLog: (sessionId: string) => void;
  onClearAllSessionLogs?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  allImages,
  onStartSessionFromFavorites,
  onBackToStudio,
  onClearStats,
  onDeleteSessionLog,
  onClearAllSessionLogs,
}) => {
  const [sessionToDelete, setSessionToDelete] = useState<DrawingSession | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [isConfirmingResetAllStats, setIsConfirmingResetAllStats] = useState(false);

  const favoriteImages = allImages.filter((img) => stats.favoriteImageIds?.includes(img.id));
  const today = getTodayDateStr();

  // Generate last 14 days calendar map
  const last14Days: { dateStr: string; dayName: string; count: number; seconds: number }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const log = stats.dailyLogs?.[dateStr];

    last14Days.push({
      dateStr,
      dayName: dayNames[d.getDay()],
      count: log?.posesCompleted || 0,
      seconds: log?.secondsDrawn || 0,
    });
  }

  // Calculate achievements
  const achievements = [
    {
      title: 'First Stroke',
      desc: 'Complete your 1st gesture pose',
      unlocked: stats.totalPoses >= 1,
      icon: '🎨',
    },
    {
      title: 'Warmup Master',
      desc: 'Complete 25 gesture drawings',
      unlocked: stats.totalPoses >= 25,
      icon: '⚡',
    },
    {
      title: 'Centurion of Form',
      desc: 'Draw 100 reference poses',
      unlocked: stats.totalPoses >= 100,
      icon: '🏛️',
    },
    {
      title: 'Daily Dedication',
      desc: 'Maintain a 3-day practice streak',
      unlocked: stats.currentStreakDays >= 3 || stats.longestStreakDays >= 3,
      icon: '🔥',
    },
    {
      title: 'Deep Focus Hour',
      desc: 'Spend over 1 full hour drawing',
      unlocked: stats.totalSecondsDrawn >= 3600,
      icon: '⏳',
    },
    {
      title: 'Studio Virtuoso',
      desc: 'Complete 10 full drawing sessions',
      unlocked: stats.totalSessions >= 10,
      icon: '👑',
    },
  ];

  const handleConfirmDeleteSingle = () => {
    if (sessionToDelete) {
      onDeleteSessionLog(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  const handleConfirmClearAllLogs = () => {
    if (onClearAllSessionLogs) {
      onClearAllSessionLogs();
    } else {
      stats.sessionHistory.forEach((s) => onDeleteSessionLog(s.id));
    }
    setIsConfirmingClearAll(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-neutral-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Artist Practice Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400">
            Track your mileage, daily consistency, muscle memory growth, and session logs.
          </p>
        </div>

        <button
          id="btn-stats-back"
          type="button"
          onClick={onBackToStudio}
          className="self-start sm:self-center px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 border border-white/15 transition-colors"
        >
          ← Back to Studio Setup
        </button>
      </div>

      {/* Main Metric Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Time */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold mb-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Total Time Drawn
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
            {formatTotalTimeDrawn(stats.totalSecondsDrawn)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across {stats.totalSessions} {stats.totalSessions === 1 ? 'session' : 'sessions'}
          </div>
        </div>

        {/* Total Poses */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold mb-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            Poses Completed
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono tracking-tight">
            {stats.totalPoses}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Avg {stats.totalPoses > 0 ? formatTime(Math.round(stats.totalSecondsDrawn / stats.totalPoses)) : '0s'} per pose
          </div>
        </div>

        {/* Current Streak */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold mb-2">
            <Flame className="w-4 h-4 text-rose-400" />
            Daily Streak
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono tracking-tight flex items-center gap-1.5">
            {stats.currentStreakDays}
            <span className="text-xs text-rose-400/80 font-normal">days</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Longest record: {stats.longestStreakDays} days
          </div>
        </div>

        {/* Total Sessions */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Practice Sessions
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
            {stats.totalSessions}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {stats.lastPracticeDate ? `Last: ${stats.lastPracticeDate}` : 'Ready to start'}
          </div>
        </div>
      </div>

      {/* Practice Consistency Heatmap (Last 14 Days) */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">Recent 14-Day Activity Heatmap</h3>
          </div>
          <span className="text-xs text-neutral-400">Consistency beats duration</span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {last14Days.map((day) => {
            const hasActivity = day.count > 0;
            const isToday = day.dateStr === today;
            let bgClass = 'bg-white/[0.03] border-white/10 text-neutral-300';
            if (day.count >= 15) bgClass = 'bg-emerald-500 border-emerald-400 text-black font-bold shadow-md shadow-emerald-500/20';
            else if (day.count >= 8) bgClass = 'bg-emerald-600/80 border-emerald-500 text-white font-semibold';
            else if (day.count > 0) bgClass = 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200';

            return (
              <div
                key={day.dateStr}
                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${bgClass} ${
                  isToday ? 'ring-2 ring-emerald-400' : ''
                }`}
                title={`${day.dateStr}: ${day.count} poses, ${formatTotalTimeDrawn(day.seconds)}`}
              >
                <span className="text-[10px] text-neutral-400 uppercase font-mono">{day.dayName}</span>
                <span className="text-xs font-mono font-bold mt-1">
                  {hasActivity ? day.count : '0'}
                </span>
                <span className="text-[9px] opacity-70 mt-0.5">
                  {day.dateStr.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookmarked / Favorite Images Library */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              Favorite Poses & Bookmarked References ({favoriteImages.length})
            </h3>
          </div>
          {favoriteImages.length > 0 && (
            <button
              id="btn-draw-favorites"
              type="button"
              onClick={onStartSessionFromFavorites}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              Draw Saved Favorites
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {favoriteImages.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
            No poses bookmarked yet. During or after drawing sessions, click the bookmark icon on any pose to save it here for targeted study!
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
            {favoriteImages.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-white/10 group shadow-md"
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-neutral-200 truncate">{img.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Artist Milestones / Achievements Grid */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm sm:text-base text-white">Artist Milestones & Badges</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((ach, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                ach.unlocked
                  ? 'backdrop-blur-md bg-white/[0.04] border-emerald-500/40 text-neutral-100 shadow-md'
                  : 'bg-white/[0.01] border-white/5 opacity-40 text-neutral-500'
              }`}
            >
              <div className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10">
                {ach.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{ach.title}</span>
                  {ach.unlocked && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session History Log Section */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">Recent Session Logs</h3>
            <span className="text-xs text-neutral-400 font-mono">
              ({stats.sessionHistory.length} {stats.sessionHistory.length === 1 ? 'record' : 'records'})
            </span>
          </div>

          {stats.sessionHistory.length > 0 && (
            <button
              id="btn-clear-all-session-logs"
              type="button"
              onClick={() => setIsConfirmingClearAll(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 font-semibold transition-all self-start sm:self-auto"
              title="Delete all session history logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Logs</span>
            </button>
          )}
        </div>

        {stats.sessionHistory.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
            No drawing sessions recorded yet. Complete a gesture drawing session in the Studio to view your history and logs here.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
            {stats.sessionHistory.map((sess) => (
              <div
                key={sess.id}
                className="group flex items-center justify-between p-3.5 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/10 text-xs hover:border-white/20 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                    <Target className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200 text-xs sm:text-sm">{sess.presetName || 'Custom Session'}</div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>📅 {sess.dateStr}</span>
                      <span>•</span>
                      <span>{sess.poses?.length || sess.totalPosesCompleted} poses tracked</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 font-mono">
                  <div className="text-right">
                    <div className="text-indigo-300 font-bold text-xs sm:text-sm">{sess.totalPosesCompleted} poses</div>
                    <div className="text-[10px] text-neutral-400">drawn</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-300 font-bold text-xs sm:text-sm">{formatTotalTimeDrawn(sess.totalTimeSpentSeconds)}</div>
                    <div className="text-[10px] text-neutral-400">duration</div>
                  </div>

                  {/* Delete Session Log Button */}
                  <button
                    id={`btn-delete-session-${sess.id}`}
                    type="button"
                    onClick={() => setSessionToDelete(sess)}
                    className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all opacity-80 group-hover:opacity-100"
                    title="Delete this session log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Management Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-neutral-500">
        <span>Stored securely in your local browser sandbox</span>
        <button
          id="btn-reset-all-stats"
          type="button"
          onClick={() => setIsConfirmingResetAllStats(true)}
          className="text-neutral-400 hover:text-rose-400 transition-colors"
        >
          Reset All Statistics
        </button>
      </div>

      {/* Confirmation Modal: Delete Single Session Log */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Session Log?</h3>
                <p className="text-xs text-neutral-400">This action will remove this entry from history.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Session Preset:</span>
                <span className="text-white font-semibold">{sessionToDelete.presetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Date Recorded:</span>
                <span className="text-white font-semibold">{sessionToDelete.dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Poses Completed:</span>
                <span className="text-indigo-300 font-mono font-bold">{sessionToDelete.totalPosesCompleted} poses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Time Spent:</span>
                <span className="text-emerald-300 font-mono font-bold">{formatTotalTimeDrawn(sessionToDelete.totalTimeSpentSeconds)}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete this practice record? Its pose count and duration will be deducted from your total analytics.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-session"
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Session Logs */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete All Session Logs?</h3>
                <p className="text-xs text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to delete all <b className="text-white font-semibold">{stats.sessionHistory.length}</b> session logs from your history? Your bookmarked favorites will remain saved.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-clear-all-sessions"
                type="button"
                onClick={handleConfirmClearAllLogs}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset All Statistics */}
      {isConfirmingResetAllStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset All Statistics?</h3>
                <p className="text-xs text-neutral-400">Reset total mileage, streaks, and logs.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to completely reset all statistics, streak days, heatmaps, and session history back to zero?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingResetAllStats(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reset-stats"
                type="button"
                onClick={() => {
                  onClearStats();
                  setIsConfirmingResetAllStats(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
