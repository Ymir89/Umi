import { DEFAULT_TIMER_PRESETS } from '../data/defaultReferences';
import { TimerPreset, UsageStats, SessionConfig, DarkModeTheme, DrawingSession } from '../types';

const STORAGE_KEYS = {
  TIMER_PRESETS: 'gds_timer_presets_v1',
  USAGE_STATS: 'gds_usage_stats_v1',
  SESSION_CONFIG: 'gds_session_config_v1',
  THEME: 'gds_theme_v1',
  FAVORITES: 'gds_favorites_v1',
};

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timerPresetId: 'timer-60s',
  customDuration: 60,
  isProgressive: false,
  selectedPackIds: ['pack-figures', 'pack-action'],
  selectedCategories: ['figures', 'action'],
  totalPosesTarget: 10,
  shuffle: true,
  autoFlipRandomly: false,
  autoGrayscale: false,
  soundAlerts: true,
  soundVolume: 0.6,
  soundType: 'bell',
  breakBetweenPoses: 3,
};

export const INITIAL_USAGE_STATS: UsageStats = {
  totalSessions: 0,
  totalPoses: 0,
  totalSecondsDrawn: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastPracticeDate: '',
  dailyLogs: {},
  favoriteImageIds: [],
  sessionHistory: [],
};

// Helper: Get Today's Date String YYYY-MM-DD
export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) {
    return `${s}s`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatTotalTimeDrawn(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Timer Presets
export function loadTimerPresets(): TimerPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER_PRESETS);
    if (!raw) return DEFAULT_TIMER_PRESETS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TIMER_PRESETS;
  } catch {
    return DEFAULT_TIMER_PRESETS;
  }
}

export function saveTimerPresets(presets: TimerPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMER_PRESETS, JSON.stringify(presets));
  } catch (err) {
    console.error('Failed to save timer presets', err);
  }
}

// Session Config
export function loadSessionConfig(): SessionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_CONFIG);
    if (!raw) return DEFAULT_SESSION_CONFIG;
    return { ...DEFAULT_SESSION_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SESSION_CONFIG;
  }
}

export function saveSessionConfig(config: SessionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save session config', err);
  }
}

// Theme
export function loadTheme(): DarkModeTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME) as DarkModeTheme;
    if (raw && ['studio-charcoal', 'oled-black', 'warm-ochre', 'slate-atelier'].includes(raw)) {
      return raw;
    }
    return 'studio-charcoal';
  } catch {
    return 'studio-charcoal';
  }
}

export function saveTheme(theme: DarkModeTheme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('Failed to save theme', err);
  }
}

// Usage Stats
export function loadUsageStats(): UsageStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USAGE_STATS);
    if (!raw) return INITIAL_USAGE_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_USAGE_STATS,
      ...parsed,
      dailyLogs: parsed.dailyLogs || {},
      sessionHistory: parsed.sessionHistory || [],
      favoriteImageIds: parsed.favoriteImageIds || [],
    };
  } catch {
    return INITIAL_USAGE_STATS;
  }
}

export function saveUsageStats(stats: UsageStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save usage stats', err);
  }
}

// Record a completed session into stats
export function recordCompletedSession(session: DrawingSession): UsageStats {
  const currentStats = loadUsageStats();
  const today = getTodayDateStr();

  // Streak calculation
  let newStreak = currentStats.currentStreakDays;
  const lastDate = currentStats.lastPracticeDate;

  if (!lastDate) {
    newStreak = 1;
  } else if (lastDate === today) {
    // Already practiced today, keep streak
    newStreak = currentStats.currentStreakDays || 1;
  } else {
    const last = new Date(lastDate);
    const curr = new Date(today);
    const diffTime = Math.abs(curr.getTime() - last.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(currentStats.longestStreakDays, newStreak);

  // Daily log update
  const currentDayLog = currentStats.dailyLogs[today] || {
    date: today,
    posesCompleted: 0,
    secondsDrawn: 0,
    sessionCount: 0,
  };

  const updatedDailyLog = {
    ...currentDayLog,
    posesCompleted: currentDayLog.posesCompleted + session.totalPosesCompleted,
    secondsDrawn: currentDayLog.secondsDrawn + session.totalTimeSpentSeconds,
    sessionCount: currentDayLog.sessionCount + 1,
  };

  const updatedStats: UsageStats = {
    ...currentStats,
    totalSessions: currentStats.totalSessions + 1,
    totalPoses: currentStats.totalPoses + session.totalPosesCompleted,
    totalSecondsDrawn: currentStats.totalSecondsDrawn + session.totalTimeSpentSeconds,
    currentStreakDays: newStreak,
    longestStreakDays: longestStreak,
    lastPracticeDate: today,
    dailyLogs: {
      ...currentStats.dailyLogs,
      [today]: updatedDailyLog,
    },
    sessionHistory: [session, ...currentStats.sessionHistory.slice(0, 49)], // keep last 50 sessions
  };

  saveUsageStats(updatedStats);
  return updatedStats;
}
