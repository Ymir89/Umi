import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  Sparkles, 
  ShieldCheck, 
  WifiOff, 
  Maximize, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  isInstallPromptAvailable, 
  promptPWAInstall, 
  isRunningStandalone, 
  isAndroidDevice,
  subscribeInstallPrompt 
} from '../utils/pwa';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [canPrompt, setCanPrompt] = useState(isInstallPromptAvailable());
  const [isStandalone, setIsStandalone] = useState(isRunningStandalone());
  const [isAndroid, setIsAndroid] = useState(isAndroidDevice());
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'dismissed'>('idle');
  const [activeGuideTab, setActiveGuideTab] = useState<'chrome' | 'samsung' | 'other'>('chrome');

  useEffect(() => {
    const unsub = subscribeInstallPrompt(() => {
      setCanPrompt(isInstallPromptAvailable());
      setIsStandalone(isRunningStandalone());
    });
    setCanPrompt(isInstallPromptAvailable());
    setIsStandalone(isRunningStandalone());
    setIsAndroid(isAndroidDevice());
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstallStatus('installing');
    const outcome = await promptPWAInstall();
    if (outcome === 'accepted') {
      setInstallStatus('installed');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (outcome === 'dismissed') {
      setInstallStatus('dismissed');
    } else {
      setInstallStatus('idle');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg backdrop-blur-2xl bg-[#0c0c10]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-neutral-100 my-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 p-2 shadow-inner">
              <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Install on Android & Devices</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                  PWA App
                </span>
              </div>
              <p className="text-xs text-neutral-400">Download & install as a native standalone app on Android phones & tablets</p>
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

        {/* Standalone Status Banner */}
        {isStandalone ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 mb-5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block">App Installed & Running in Standalone Mode</span>
              <span className="text-neutral-300">You are currently running the installed version of Gesture Drawing Studio.</span>
            </div>
          </div>
        ) : (
          /* Direct 1-Click Install Button (When browser supports native prompt) */
          canPrompt && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-500/30 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Quick 1-Tap Installation Ready
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Installs directly to your Android launcher / home screen with offline storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installStatus === 'installing'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  {installStatus === 'installing' ? 'Installing...' : 'Install App Now'}
                </button>
              </div>
            </div>
          )
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
            <WifiOff className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-neutral-200 block">100% Offline</span>
            <span className="text-[10px] text-neutral-400">Works anywhere</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
            <Maximize className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-neutral-200 block">Full Screen</span>
            <span className="text-[10px] text-neutral-400">No browser bars</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
            <Layers className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-neutral-200 block">Local Folders</span>
            <span className="text-[10px] text-neutral-400">Keeps your photos</span>
          </div>
        </div>

        {/* Step by Step Manual Installation Guide for Android */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              How to Install on Android Devices:
            </span>
            {/* Guide Tabs */}
            <div className="flex p-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <button
                type="button"
                onClick={() => setActiveGuideTab('chrome')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeGuideTab === 'chrome' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-neutral-400'
                }`}
              >
                Chrome
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('samsung')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeGuideTab === 'samsung' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-neutral-400'
                }`}
              >
                Samsung
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('other')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeGuideTab === 'other' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-neutral-400'
                }`}
              >
                Firefox / Edge
              </button>
            </div>
          </div>

          {activeGuideTab === 'chrome' && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs text-neutral-300">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span>Open this app in <strong>Google Chrome</strong> on your Android phone or tablet.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span>Tap the three dots menu button <strong>(⋮)</strong> in the top right corner of Chrome.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <span>The app will be installed with its custom icon and appear on your Android home screen!</span>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === 'samsung' && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs text-neutral-300">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span>Open in <strong>Samsung Internet</strong> on your Galaxy device.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span>Tap the menu icon <strong>(☰)</strong> at bottom right or the download icon in the URL bar.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span>Tap <strong>"Add page to"</strong> and choose <strong>"App screen"</strong> or <strong>"Home screen"</strong>.</span>
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === 'other' && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs text-neutral-300">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span><strong>Firefox for Android:</strong> Tap the menu (⋮) → Tap <strong>"Install"</strong>.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span><strong>Microsoft Edge / Brave:</strong> Tap menu (⋯) → Tap <strong>"Add to phone"</strong>.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Copy Shareable Link */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            <span>Need to open on your phone or tablet?</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-200 text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUrl ? 'Link Copied!' : 'Copy App Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
