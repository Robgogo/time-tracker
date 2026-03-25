"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isIOS =
      /iPhone|iPad|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const dismissed = localStorage.getItem("installPromptDismissed");

    if (!isStandalone && isIOS && !dismissed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg z-50">
      <div className="flex items-start gap-3 max-w-sm mx-auto">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Install Time Tracker
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tap{" "}
            <svg
              className="inline w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>{" "}
            then &quot;Add to Home Screen&quot;
          </p>
        </div>
        <button
          onClick={() => {
            setShow(false);
            localStorage.setItem("installPromptDismissed", "true");
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
