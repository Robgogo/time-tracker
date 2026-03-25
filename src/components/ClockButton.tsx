"use client";

import { useEffect, useState } from "react";

interface Props {
  isClockedIn: boolean;
  clockInTime: string | null;
  loading: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}

export default function ClockButton({
  isClockedIn,
  clockInTime,
  loading,
  onClockIn,
  onClockOut,
}: Props) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!isClockedIn || !clockInTime) {
      setElapsed("");
      return;
    }

    const updateElapsed = () => {
      const [h, m] = clockInTime.split(":").map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const diff = Date.now() - start.getTime();
      if (diff < 0) {
        setElapsed("00:00:00");
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${hrs.toString().padStart(2, "0")}:${mins
          .toString()
          .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={isClockedIn ? onClockOut : onClockIn}
        disabled={loading}
        className={`
          relative w-44 h-44 rounded-full font-bold text-xl text-white
          transition-all duration-300 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg
          ${
            isClockedIn
              ? "bg-red-500 hover:bg-red-600 shadow-red-200"
              : "bg-green-500 hover:bg-green-600 shadow-green-200"
          }
        `}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
        ) : isClockedIn ? (
          <div className="flex flex-col items-center">
            <span className="text-lg font-medium opacity-80">CLOCK</span>
            <span className="text-2xl font-bold">OUT</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-lg font-medium opacity-80">CLOCK</span>
            <span className="text-2xl font-bold">IN</span>
          </div>
        )}

        {isClockedIn && !loading && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>

      {isClockedIn && clockInTime && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Clocked in at {clockInTime}</p>
          <p className="text-3xl font-mono font-bold text-gray-800 mt-1">
            {elapsed}
          </p>
        </div>
      )}
    </div>
  );
}
