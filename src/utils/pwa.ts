// Utility to handle PWA installation and Android APK / WebAPK prompt

let deferredInstallPrompt: any = null;
const listeners = new Set<() => void>();

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => {
          console.log('Gesture Drawing Studio ServiceWorker registered:', reg.scope);
        },
        (err) => {
          console.warn('Gesture Drawing Studio ServiceWorker registration failed:', err);
        }
      );
    });

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      notifyListeners();
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      notifyListeners();
    });
  }
}

export function isInstallPromptAvailable(): boolean {
  return !!deferredInstallPrompt;
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent || '');
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');
}

export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredInstallPrompt) {
    return 'unavailable';
  }

  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    notifyListeners();
    return outcome;
  } catch (err) {
    console.error('Error prompting install:', err);
    return 'unavailable';
  }
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function subscribeInstallPrompt(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
