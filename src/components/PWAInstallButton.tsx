import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'hero' | 'minimal' }> = ({
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as standalone app, don't show
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'hero') {
      return (
        <button
          onClick={install}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-md transition-all active:scale-95"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Install TutorFlow App
        </button>
      );
    }

    return (
      <button
        onClick={install}
        title="Install TutorFlow PWA"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs border border-indigo-200 transition-colors"
      >
        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs border border-indigo-200 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    TF
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Install TutorFlow</h3>
                    <p className="text-xs text-slate-500">For iOS / iPadOS</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share button</strong> (square with arrow) at the bottom or top of
                    Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                    2
                  </span>
                  <p>
                    Scroll down and select <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                    3
                  </span>
                  <p>
                    Tap <strong>Add</strong> to launch TutorFlow with offline cached UI and full
                    viewport experience!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
