import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  X, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  Sliders, 
  EyeOff, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  Film,
  Hand
} from 'lucide-react';
import { 
  ReferenceImage, 
  SessionConfig, 
  TimerPreset, 
  ImageFilters, 
  DrawingSession, 
  DrawnPoseRecord 
} from '../types';
import { GridOverlay } from './GridOverlay';
import { ImageFiltersBar } from './ImageFiltersBar';
import { audioEngine } from '../utils/audio';
import { formatTime } from '../utils/storage';

interface ActiveSessionViewProps {
  queue: ReferenceImage[];
  config: SessionConfig;
  activePreset: TimerPreset;
  onFinishSession: (session: DrawingSession) => void;
  onExitWithoutSave: () => void;
  onToggleBookmark: (imageId: string) => void;
  favoriteImageIds: string[];
  onOpenShortcuts: () => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  queue,
  config,
  activePreset,
  onFinishSession,
  onExitWithoutSave,
  onToggleBookmark,
  favoriteImageIds,
  onOpenShortcuts,
}) => {
  // Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(config.breakBetweenPoses);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(config.soundAlerts);

  // Per-pose timer calculation
  const getPoseDuration = useCallback((index: number) => {
    if (activePreset.isProgressive && activePreset.stages) {
      let cumulative = 0;
      for (const stage of activePreset.stages) {
        if (index < cumulative + stage.poseCount) {
          return stage.durationSeconds;
        }
        cumulative += stage.poseCount;
      }
      return activePreset.stages[activePreset.stages.length - 1].durationSeconds;
    }
    return activePreset.durationSeconds || config.customDuration || 60;
  }, [activePreset, config.customDuration]);

  const initialDuration = getPoseDuration(0);
  const [totalPoseDuration, setTotalPoseDuration] = useState(initialDuration);
  const [secondsLeft, setSecondsLeft] = useState(initialDuration);

  // Stats Collection
  const [completedPoses, setCompletedPoses] = useState<DrawnPoseRecord[]>([]);
  const [totalSessionSecondsDrawn, setTotalSessionSecondsDrawn] = useState(0);
  const sessionStartTimeRef = useRef(Date.now());
  const currentPoseStartTimeRef = useRef(Date.now());

  // Image filters
  const [filters, setFilters] = useState<ImageFilters>({
    grayscale: config.autoGrayscale,
    flipHorizontal: config.autoFlipRandomly ? Math.random() > 0.5 : false,
    flipVertical: false,
    invert: false,
    blur: 0,
    brightness: 100,
    contrast: 100,
    gridType: 'none',
    gridOpacity: 0.6,
    zoom: 1.0,
    panX: 0,
    panY: 0,
  });

  // Modals state
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Pan & Zoom dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const currentImage = queue[currentIndex] || queue[0];
  const isBookmarked = favoriteImageIds.includes(currentImage?.id);

  // Motion variants for horizontal slide navigation
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 32 },
        opacity: { duration: 0.22 },
        scale: { duration: 0.22 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 120 : -120,
      opacity: 0,
      scale: 0.97,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 32 },
        opacity: { duration: 0.18 },
        scale: { duration: 0.18 },
      },
    }),
  };

  // Auto hide controls when idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isPaused && !showFiltersDrawer) {
        setShowControls(false);
      }
    }, 4500);
  };

  // Next pose handler
  const handleNextPose = useCallback((skipped = false) => {
    // Record current pose completion
    if (currentImage) {
      const elapsedForThisPose = Math.max(
        1,
        Math.round((Date.now() - currentPoseStartTimeRef.current) / 1000)
      );

      const record: DrawnPoseRecord = {
        imageId: currentImage.id,
        imageUrl: currentImage.url,
        title: currentImage.title,
        category: currentImage.category,
        timeSpentSeconds: skipped ? elapsedForThisPose : totalPoseDuration,
        completedAt: Date.now(),
        skipped,
        bookmarked: favoriteImageIds.includes(currentImage.id),
      };

      setCompletedPoses((prev) => [...prev, record]);
      setTotalSessionSecondsDrawn((prev) => prev + (skipped ? elapsedForThisPose : totalPoseDuration));
    }

    const nextIdx = currentIndex + 1;
    const maxTarget = activePreset.isProgressive
      ? activePreset.stages?.reduce((acc, s) => acc + s.poseCount, 0) || queue.length
      : (config.totalPosesTarget > 0 ? config.totalPosesTarget : queue.length);

    // Check if session reached target or end of queue
    if (nextIdx >= maxTarget || nextIdx >= queue.length) {
      // Session Complete!
      if (soundEnabled) {
        audioEngine.playSessionComplete(config.soundVolume);
      }
      finishSessionWithData(nextIdx, skipped);
      return;
    }

    // Play Alert Sound
    if (soundEnabled) {
      audioEngine.playAlert(config.soundType, config.soundVolume);
    }

    // Rest buffer if configured
    if (config.breakBetweenPoses > 0) {
      setIsResting(true);
      setRestSecondsLeft(config.breakBetweenPoses);
    } else {
      setSlideDirection(1);
      advanceToIndex(nextIdx, 1);
    }
  }, [
    currentImage,
    currentIndex,
    totalPoseDuration,
    queue.length,
    activePreset,
    config,
    soundEnabled,
    favoriteImageIds,
  ]);

  const advanceToIndex = (idx: number, customDir?: 1 | -1) => {
    if (customDir) {
      setSlideDirection(customDir);
    } else {
      setSlideDirection(idx >= currentIndex ? 1 : -1);
    }
    setCurrentIndex(idx);
    setIsResting(false);
    const newDuration = getPoseDuration(idx);
    setTotalPoseDuration(newDuration);
    setSecondsLeft(newDuration);
    currentPoseStartTimeRef.current = Date.now();

    // Reset or randomize filters according to config
    setFilters((prev) => ({
      ...prev,
      grayscale: config.autoGrayscale ? true : prev.grayscale,
      flipHorizontal: config.autoFlipRandomly ? Math.random() > 0.5 : false,
      flipVertical: false,
      zoom: 1.0,
      panX: 0,
      panY: 0,
    }));
  };

  const handlePrevPose = () => {
    if (currentIndex > 0) {
      setSlideDirection(-1);
      advanceToIndex(currentIndex - 1, -1);
    }
  };

  const handleSkipPose = () => {
    setSlideDirection(1);
    handleNextPose(true);
  };

  // Touch & Mouse Drag Swipe Navigation Handlers
  const handleDragStart = () => {
    setIsSwiping(true);
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (filters.zoom === 1) {
      setDragOffset(info.offset.x);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSwiping(false);
    setDragOffset(0);

    if (filters.zoom > 1) return;

    const swipeDistance = info.offset.x;
    const swipeVelocity = info.velocity.x;
    const swipeThreshold = 45;
    const velocityThreshold = 260;

    if (swipeDistance < -swipeThreshold || swipeVelocity < -velocityThreshold) {
      // Swiped Left -> Advance to NEXT pose
      setSlideDirection(1);
      handleNextPose(false);
    } else if (swipeDistance > swipeThreshold || swipeVelocity > velocityThreshold) {
      // Swiped Right -> Advance to PREVIOUS pose
      if (currentIndex > 0) {
        setSlideDirection(-1);
        handlePrevPose();
      }
    }
  };

  const finishSessionWithData = (completedCount: number, lastSkipped = false) => {
    const finalCompleted = [...completedPoses];
    if (currentImage && !finalCompleted.some(p => p.imageId === currentImage.id && p.completedAt > Date.now() - 5000)) {
      const elapsed = Math.round((Date.now() - currentPoseStartTimeRef.current) / 1000);
      finalCompleted.push({
        imageId: currentImage.id,
        imageUrl: currentImage.url,
        title: currentImage.title,
        category: currentImage.category,
        timeSpentSeconds: elapsed,
        completedAt: Date.now(),
        skipped: lastSkipped,
        bookmarked: isBookmarked,
      });
    }

    const totalSeconds = finalCompleted.reduce((acc, p) => acc + p.timeSpentSeconds, 0);

    const sessionData: DrawingSession = {
      id: `session-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      presetName: activePreset.name,
      totalPosesCompleted: finalCompleted.length,
      totalTimeSpentSeconds: totalSeconds,
      poses: finalCompleted,
    };

    onFinishSession(sessionData);
  };

  // Main Timer Interval Effect
  useEffect(() => {
    if (isPaused) return;

    // Rest interval
    if (isResting) {
      if (restSecondsLeft <= 1) {
        advanceToIndex(currentIndex + 1);
        return;
      }
      const restTimer = setTimeout(() => {
        setRestSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(restTimer);
    }

    // Active pose drawing interval
    if (secondsLeft <= 0) {
      handleNextPose(false);
      return;
    }

    // 3-2-1 tick warning in last 3 seconds
    if (secondsLeft <= 3 && soundEnabled) {
      audioEngine.playTick(secondsLeft, config.soundVolume);
    }

    const interval = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(interval);
  }, [secondsLeft, isPaused, isResting, restSecondsLeft, handleNextPose, soundEnabled, config.soundVolume]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPaused((p) => !p);
          break;
        case 'ArrowRight':
        case 'KeyN':
          e.preventDefault();
          handleNextPose(false);
          break;
        case 'ArrowLeft':
        case 'KeyP':
          e.preventDefault();
          handlePrevPose();
          break;
        case 'KeyS':
          e.preventDefault();
          handleSkipPose();
          break;
        case 'KeyB':
          e.preventDefault();
          setFilters((f) => ({ ...f, grayscale: !f.grayscale }));
          break;
        case 'KeyF':
          e.preventDefault();
          setFilters((f) => ({ ...f, flipHorizontal: !f.flipHorizontal }));
          break;
        case 'KeyV':
          e.preventDefault();
          setFilters((f) => ({ ...f, flipVertical: !f.flipVertical }));
          break;
        case 'KeyG': {
          e.preventDefault();
          const gridTypes: ImageFilters['gridType'][] = ['none', 'thirds', 'grid3x3', 'square', 'crosshair', 'golden'];
          const nxt = (gridTypes.indexOf(filters.gridType) + 1) % gridTypes.length;
          setFilters((f) => ({ ...f, gridType: gridTypes[nxt] }));
          break;
        }
        case 'KeyQ':
          e.preventDefault();
          setFilters((f) => ({ ...f, blur: f.blur > 0 ? 0 : 4 }));
          break;
        case 'KeyH':
          e.preventDefault();
          setShowControls((c) => !c);
          break;
        case 'KeyM':
          e.preventDefault();
          setSoundEnabled((s) => !s);
          break;
        case 'Escape':
          e.preventDefault();
          finishSessionWithData(currentIndex);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPose, handlePrevPose, handleSkipPose, filters.gridType, currentIndex]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Image Drag & Pan Handlers for Zoomed Images
  const handleMouseDown = (e: React.MouseEvent) => {
    if (filters.zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - filters.panX, y: e.clientY - filters.panY });
    }
  };

  const handleMouseMoveImage = (e: React.MouseEvent) => {
    if (isDragging && filters.zoom > 1) {
      setFilters((prev) => ({
        ...prev,
        panX: e.clientX - dragStart.x,
        panY: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
      setFilters((prev) => ({
        ...prev,
        zoom: Math.min(3.5, Math.max(0.5, prev.zoom + zoomDelta)),
      }));
    }
  };

  // Timer ring calculation
  const progressFraction = totalPoseDuration > 0 ? secondsLeft / totalPoseDuration : 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressFraction * circumference;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      className="fixed inset-0 z-50 bg-[#0a0a0c] text-neutral-100 flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Background ambient orbs in active session */}
      <div className="fixed top-[-100px] left-[-100px] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-50px] right-[-50px] w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* 1. Top Minimal Studio Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 transition-all duration-300 pointer-events-none flex items-center justify-between ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        {/* Left: Pose Index & Preset Name */}
        <div className="flex items-center gap-3 pointer-events-auto backdrop-blur-xl bg-white/[0.06] px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
          <span className="font-mono font-black text-emerald-400 text-sm">
            Pose #{currentIndex + 1}
            {config.totalPosesTarget > 0 && (
              <span className="text-neutral-400 font-normal"> / {config.totalPosesTarget}</span>
            )}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-xs text-neutral-200 font-medium truncate max-w-[160px] sm:max-w-[240px]">
            {currentImage?.title || 'Reference Pose'}
          </span>
          <button
            type="button"
            onClick={() => onToggleBookmark(currentImage?.id)}
            className={`p-1 rounded-lg transition-colors ${
              isBookmarked ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
            title={isBookmarked ? 'Bookmarked' : 'Bookmark this pose for study'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Right: Sound, Shortcuts, Fullscreen, Exit */}
        <div className="flex items-center gap-2 pointer-events-auto backdrop-blur-xl bg-white/[0.06] p-1.5 rounded-2xl border border-white/10 shadow-2xl">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className={`p-2 rounded-xl transition-colors ${
              soundEnabled ? 'text-emerald-400' : 'text-neutral-500'
            }`}
            title={soundEnabled ? 'Chimes Enabled (M to mute)' : 'Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Filmstrip View Toggle */}
          <button
            type="button"
            onClick={() => setShowFilmstrip((f) => !f)}
            className={`p-2 rounded-xl text-neutral-300 hover:text-white transition-colors ${
              showFilmstrip ? 'bg-white/20 text-emerald-300' : 'hover:bg-white/10'
            }`}
            title="Toggle Session Filmstrip"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* Shortcuts Modal Trigger */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Fullscreen Mode */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* End & Review Session */}
          <button
            id="btn-active-exit"
            type="button"
            onClick={() => finishSessionWithData(currentIndex)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 border border-white/10 transition-colors"
            title="Finish Drawing Session & Review (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* 2. Main Reference Canvas Area */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveImage}
        onMouseUp={handleMouseUp}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none select-none cursor-${
          filters.zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }`}
      >
        {/* Left Touch / Swipe Navigation Trigger */}
        <button
          type="button"
          onClick={handlePrevPose}
          disabled={currentIndex === 0}
          className={`absolute left-3 sm:left-6 z-30 p-3 sm:p-4 rounded-full backdrop-blur-xl transition-all duration-200 flex items-center justify-center shadow-2xl ${
            currentIndex === 0
              ? 'opacity-0 pointer-events-none'
              : dragOffset > 25
              ? 'opacity-100 scale-110 bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-emerald-500/30'
              : showControls
              ? 'opacity-60 hover:opacity-100 bg-black/40 text-neutral-300 hover:text-white border border-white/10 hover:scale-105'
              : 'opacity-0 hover:opacity-100 bg-black/30 text-neutral-400 border border-white/10'
          }`}
          title="Swipe Right or Click for Previous Pose (←)"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* Right Touch / Swipe Navigation Trigger */}
        <button
          type="button"
          onClick={() => handleNextPose(false)}
          className={`absolute right-3 sm:right-6 z-30 p-3 sm:p-4 rounded-full backdrop-blur-xl transition-all duration-200 flex items-center justify-center shadow-2xl ${
            dragOffset < -25
              ? 'opacity-100 scale-110 bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-emerald-500/30'
              : showControls
              ? 'opacity-60 hover:opacity-100 bg-black/40 text-neutral-300 hover:text-white border border-white/10 hover:scale-105'
              : 'opacity-0 hover:opacity-100 bg-black/30 text-neutral-400 border border-white/10'
          }`}
          title="Swipe Left or Click for Next Pose (→)"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* Dynamic Swipe Feedback Pill while Dragging */}
        {Math.abs(dragOffset) > 20 && (
          <div className="absolute top-20 z-40 px-4 py-2 rounded-full backdrop-blur-xl bg-black/80 border border-white/20 shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none">
            {dragOffset < -20 ? (
              <>
                <span className="text-xs font-semibold text-emerald-300">Release for Next Pose</span>
                <ChevronRight className="w-4 h-4 text-emerald-400 animate-pulse" />
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300">
                  {currentIndex === 0 ? 'First Pose' : 'Release for Previous Pose'}
                </span>
              </>
            )}
          </div>
        )}

        {isResting ? (
          /* Rest Buffer Screen */
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 animate-fade-in backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl shadow-2xl">
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin flex items-center justify-center">
              <span className="font-mono text-2xl font-black text-emerald-400 animate-none">
                {restSecondsLeft}s
              </span>
            </div>
            <h3 className="text-xl font-bold text-neutral-100">Rest & Relax Hands...</h3>
            <p className="text-xs text-neutral-400 max-w-sm">
              Shake out your wrist and get ready for the next gesture pose.
            </p>
            <button
              type="button"
              onClick={() => advanceToIndex(currentIndex + 1, 1)}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <SkipForward className="w-4 h-4" />
              Skip Rest Interval
            </button>
          </div>
        ) : (
          /* Active Image Display Container with Framer-Motion Touch Swipe */
          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              <motion.div
                key={currentImage?.id || currentIndex}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag={filters.zoom === 1 ? 'x' : false}
                dragDirectionLock={true}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.45}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                className="relative max-w-full max-h-full flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing"
              >
                <div
                  className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out"
                  style={{
                    transform:
                      filters.zoom !== 1 || filters.panX !== 0 || filters.panY !== 0
                        ? `scale(${filters.zoom}) translate(${filters.panX / filters.zoom}px, ${
                            filters.panY / filters.zoom
                          }px)`
                        : undefined,
                  }}
                >
                  {/* Reference Image with Filters */}
                  <img
                    src={currentImage?.url}
                    alt={currentImage?.title || 'Gesture Drawing Reference'}
                    className="max-h-[82vh] max-w-[90vw] object-contain rounded-xl shadow-2xl shadow-black/90 pointer-events-none transition-all duration-200"
                    style={{
                      filter: `
                        ${filters.grayscale ? 'grayscale(100%)' : 'none'}
                        ${filters.invert ? 'invert(100%)' : 'none'}
                        ${filters.blur > 0 ? `blur(${filters.blur}px)` : 'none'}
                        brightness(${filters.brightness}%)
                        contrast(${filters.contrast}%)
                      `,
                      transform: `
                        scaleX(${filters.flipHorizontal ? -1 : 1})
                        scaleY(${filters.flipVertical ? -1 : 1})
                      `,
                    }}
                    draggable={false}
                  />

                  {/* Grid Overlay Guide */}
                  <GridOverlay type={filters.gridType} opacity={filters.gridOpacity} />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Paused Overlay Banner */}
            {isPaused && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center pointer-events-none z-30">
                <div className="px-6 py-3 rounded-2xl backdrop-blur-xl bg-[#0c0c10]/95 border border-white/15 shadow-2xl text-center flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-sm text-neutral-100">
                    Session Paused (Press Space or Play to Resume)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Controls & Artist Tools Bar */}
      <div
        className={`relative z-40 p-4 pb-6 transition-all duration-300 pointer-events-none flex flex-col items-center gap-3 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Floating Artist Filters Bar */}
        <ImageFiltersBar
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={() =>
            setFilters({
              grayscale: false,
              flipHorizontal: false,
              flipVertical: false,
              invert: false,
              blur: 0,
              brightness: 100,
              contrast: 100,
              gridType: 'none',
              gridOpacity: 0.6,
              zoom: 1.0,
              panX: 0,
              panY: 0,
            })
          }
          isOpen={showFiltersDrawer}
          onToggleOpen={() => setShowFiltersDrawer((v) => !v)}
        />

        {/* Central Transport Controls Dock */}
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 p-2 rounded-3xl backdrop-blur-2xl bg-[#0c0c10]/90 border border-white/15 shadow-2xl shadow-black/80">
          {/* Previous Pose */}
          <button
            id="btn-active-prev"
            type="button"
            onClick={handlePrevPose}
            disabled={currentIndex === 0}
            className="p-3 rounded-2xl text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Previous Pose (← or P)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Pause / Play Button */}
          <button
            id="btn-active-pause-play"
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className={`p-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
              isPaused
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/25'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
            title={isPaused ? 'Resume Timer (Space)' : 'Pause Timer (Space)'}
          >
            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
          </button>

          {/* Circular Countdown Timer Display */}
          <div
            className="relative flex items-center justify-center w-16 h-16 cursor-pointer"
            onClick={() => setIsPaused((p) => !p)}
            title="Click to Pause/Resume"
          >
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="text-white/10 stroke-current"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className={`stroke-current transition-all duration-300 ${
                  secondsLeft <= 5 ? 'text-rose-500' : 'text-emerald-400'
                }`}
                strokeWidth="4.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`font-mono font-black text-sm tracking-tight ${
                  secondsLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'
                }`}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>
          </div>

          {/* Skip Button */}
          <button
            id="btn-active-skip"
            type="button"
            onClick={handleSkipPose}
            className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-neutral-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
            title="Skip Current Pose (S)"
          >
            <SkipForward className="w-4 h-4 text-indigo-300" />
            <span className="hidden sm:inline">Skip</span>
          </button>

          {/* Next Button */}
          <button
            id="btn-active-next"
            type="button"
            onClick={() => handleNextPose(false)}
            className="p-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold transition-all shadow-md shadow-white/10"
            title="Next Pose (→ or Enter)"
          >
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Filmstrip Bottom Drawer */}
      {showFilmstrip && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 rounded-2xl p-3 shadow-2xl animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Session Poses Queue ({queue.length})</span>
            <button
              type="button"
              onClick={() => setShowFilmstrip(false)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-h-24">
            {queue.map((img, i) => (
              <div
                key={img.id}
                onClick={() => advanceToIndex(i)}
                className={`relative shrink-0 w-16 h-20 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                  i === currentIndex
                    ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
                    : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 px-1 rounded bg-black/80 text-[9px] font-mono text-neutral-200">
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
