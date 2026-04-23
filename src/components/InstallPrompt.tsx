import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function InstallPrompt() {
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReady(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback for iOS
    const isIos = /ipad|iphone|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIos) {
      setTimeout(() => setIsReady(true), 2000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setIsReady(false);
        setDeferredPrompt(null);
      });
    } else {
      alert("To install, tap the Share button and select 'Add to Home Screen'.");
      setIsReady(false);
    }
  };

  return (
    <AnimatePresence>
      {isReady && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gray-800/90 backdrop-blur-md text-white p-3 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-1.5 rounded-full">
              <Download className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Install App</span>
              <span className="text-xs text-gray-300">Add JackCast to your home screen</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 text-xs font-bold bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setIsReady(false)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
