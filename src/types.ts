export type ReferenceCategory = 
  | 'figures'
  | 'action'
  | 'hands_feet'
  | 'portraits'
  | 'animals'
  | 'drapery'
  | 'custom';

export interface ReferenceImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  category: ReferenceCategory;
  tags: string[];
  gender?: 'female' | 'male' | 'any';
  poseType?: 'standing' | 'seated' | 'dynamic' | 'reclining' | 'action';
  isCustom?: boolean;
  packId?: string;
  dateAdded?: number;
}

export interface ReferencePack {
  id: string;
  name: string;
  description: string;
  category: ReferenceCategory;
  coverUrl: string;
  isDefault?: boolean;
  images: ReferenceImage[];
}

export interface TimerStage {
  id: string;
  durationSeconds: number;
  poseCount: number;
  label?: string;
}

export interface TimerPreset {
  id: string;
  name: string;
  description: string;
  durationSeconds: number; // for single duration
  isProgressive?: boolean;
  stages?: TimerStage[];
  breakSeconds?: number;
  isDefault?: boolean;
  createdAt?: number;
}

export interface ImageFilters {
  grayscale: boolean;
  flipHorizontal: boolean;
  flipVertical: boolean;
  invert: boolean;
  blur: number; // 0 = none, 4 = squint mode
  brightness: number; // 50 to 150 (default 100)
  contrast: number; // 50 to 150 (default 100)
  gridType: 'none' | 'thirds' | 'grid3x3' | 'square' | 'crosshair' | 'golden';
  gridOpacity: number; // 0.1 to 1.0
  zoom: number; // 1.0 = fit, up to 3.0
  panX: number;
  panY: number;
}

export interface SessionConfig {
  timerPresetId: string;
  customDuration: number;
  isProgressive: boolean;
  selectedPackIds: string[];
  selectedCategories: ReferenceCategory[];
  totalPosesTarget: number; // 0 for infinite
  shuffle: boolean;
  autoFlipRandomly: boolean;
  autoGrayscale: boolean;
  soundAlerts: boolean;
  soundVolume: number;
  soundType: 'bell' | 'chime' | 'wood' | 'gong';
  breakBetweenPoses: number; // 0 to 10 seconds
}

export interface DrawnPoseRecord {
  imageId: string;
  imageUrl: string;
  title: string;
  category: ReferenceCategory;
  timeSpentSeconds: number;
  completedAt: number;
  skipped: boolean;
  bookmarked?: boolean;
}

export interface DrawingSession {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  presetName: string;
  totalPosesCompleted: number;
  totalTimeSpentSeconds: number;
  poses: DrawnPoseRecord[];
}

export interface DailyUsageLog {
  date: string; // YYYY-MM-DD
  posesCompleted: number;
  secondsDrawn: number;
  sessionCount: number;
}

export interface UsageStats {
  totalSessions: number;
  totalPoses: number;
  totalSecondsDrawn: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastPracticeDate: string; // YYYY-MM-DD
  dailyLogs: Record<string, DailyUsageLog>;
  favoriteImageIds: string[];
  sessionHistory: DrawingSession[];
}

export type DarkModeTheme = 'studio-charcoal' | 'oled-black' | 'warm-ochre' | 'slate-atelier';
