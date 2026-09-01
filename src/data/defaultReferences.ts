import { ReferenceImage, TimerPreset } from '../types';

// Custom user-uploaded references only
export const DEFAULT_REFERENCES: ReferenceImage[] = [];

export const DEFAULT_TIMER_PRESETS: TimerPreset[] = [
  {
    id: 'timer-30s',
    name: '30s Speed Warmup',
    description: 'Loosen your arm and capture the raw line of action with fast 30-second gestures.',
    durationSeconds: 30,
    isDefault: true,
  },
  {
    id: 'timer-45s',
    name: '45s Rhythm & Weight',
    description: 'Find the spine curve, balance points, and main masses quickly.',
    durationSeconds: 45,
    isDefault: true,
  },
  {
    id: 'timer-60s',
    name: '60s Standard Gesture',
    description: 'The golden standard for gesture drawing: line of action, torso box, and limbs.',
    durationSeconds: 60,
    isDefault: true,
  },
  {
    id: 'timer-90s',
    name: '90s Form & Contour',
    description: 'Establish gesture plus outer silhouette, overlapping forms, and perspective.',
    durationSeconds: 90,
    isDefault: true,
  },
  {
    id: 'timer-120s',
    name: '2 Minutes Structure',
    description: 'Sufficient time for gesture, anatomical landmarks, and ribcage/pelvis alignment.',
    durationSeconds: 120,
    isDefault: true,
  },
  {
    id: 'timer-300s',
    name: '5 Minutes Anatomy Study',
    description: 'Construct musculature, light-dark shadow shapes, and accurate proportions.',
    durationSeconds: 300,
    isDefault: true,
  },
  {
    id: 'timer-600s',
    name: '10 Minutes Sustained Pose',
    description: 'Deep rendering, subtle value gradations, and refined line weight.',
    durationSeconds: 600,
    isDefault: true,
  },
  {
    id: 'timer-class-progressive',
    name: 'Classic Life Class (Progressive)',
    description: 'Structured studio session: 10x 30s warmups -> 5x 1m gestures -> 2x 5m structures -> 1x 10m finish.',
    durationSeconds: 30,
    isProgressive: true,
    stages: [
      { id: 'stage-1', durationSeconds: 30, poseCount: 10, label: '30s Warmups' },
      { id: 'stage-2', durationSeconds: 60, poseCount: 5, label: '1m Gestures' },
      { id: 'stage-3', durationSeconds: 300, poseCount: 2, label: '5m Studies' },
      { id: 'stage-4', durationSeconds: 600, poseCount: 1, label: '10m Climax Pose' },
    ],
    isDefault: true,
  }
];
