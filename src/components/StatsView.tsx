import React from 'react';
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
  Target
} from 'lucide-react';
import { UsageStats, ReferenceImage } from '../types';
import { formatTotalTimeDrawn, formatTime, getTodayDateStr } from '../utils/storage';

interface StatsViewProps {
  stats: UsageStats;
  allImages: ReferenceImage[];
  onStartSessionFromFavorites: () => void;
  onBackToStudio: () => void;
  onClearStats: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  allImages,
  onStartSessionFromFavorites,
  onBackToStudio,
  onClearStats,
}) => {
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
            Across {stats.totalSessions} sessions
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

      {/* Session History Log Table */}
      {stats.sessionHistory.length > 0 && (
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-white">Recent Session Logs</h3>
            <span className="text-xs text-neutral-400 font-mono">Last {stats.sessionHistory.length} sessions</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {stats.sessionHistory.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3 rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/10 text-xs hover:border-white/20 transition-all"
              >
                <div>
                  <div className="font-bold text-neutral-200">{sess.presetName}</div>
                  <div className="text-[11px] text-neutral-400">{sess.dateStr}</div>
                </div>
                <div className="flex items-center gap-4 text-right font-mono">
                  <div>
                    <div className="text-indigo-300 font-bold">{sess.totalPosesCompleted} poses</div>
                    <div className="text-[10px] text-neutral-400">drawn</div>
                  </div>
                  <div>
                    <div className="text-emerald-300 font-bold">{formatTotalTimeDrawn(sess.totalTimeSpentSeconds)}</div>
                    <div className="text-[10px] text-neutral-400">duration</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Management Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-neutral-500">
        <span>Stored securely in your local browser sandbox</span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all usage statistics? This cannot be undone.')) {
              onClearStats();
            }
          }}
          className="text-neutral-400 hover:text-rose-400 transition-colors"
        >
          Reset Statistics
        </button>
      </div>
    </div>
  );
};
