"use client";

import AuthGuard from "@/components/AuthGuard";
import ClockButton from "@/components/ClockButton";
import InstallPrompt from "@/components/InstallPrompt";
import StatusBanner from "@/components/StatusBanner";
import SummaryCard from "@/components/SummaryCard";
import { useClockStatus } from "@/hooks/useClockStatus";
import { useNotification } from "@/hooks/useNotification";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const { data, loading, error, clockIn, clockOut } = useClockStatus();
  const { enableReminders, clearReminders } = useNotification();

  const handleClockIn = async () => {
    // Ask for notification permission so clock-out reminders can be pushed
    enableReminders();
    await clockIn();
  };

  const handleClockOut = async () => {
    clearReminders();
    await clockOut();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Time Tracker</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/history"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                History
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-lg mx-auto w-full">
          {error && (
            <div className="w-full mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl text-sm">
              {navigator.onLine
                ? error
                : "You're offline. Showing last known data."}
            </div>
          )}

          {/* Status */}
          <div className="w-full mb-8">
            <StatusBanner
              isClockedIn={data?.isClockedIn ?? false}
              clockInTime={data?.currentEntry?.clockIn ?? null}
            />
          </div>

          {/* Clock Button */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <ClockButton
              isClockedIn={data?.isClockedIn ?? false}
              clockInTime={data?.currentEntry?.clockIn ?? null}
              loading={loading}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
            />
          </div>

          {/* Summary */}
          <div className="w-full">
            <SummaryCard
              todayHours={data?.todayHours ?? 0}
              weekHours={data?.weekHours ?? 0}
              monthHours={data?.monthHours ?? 0}
            />
          </div>

          {/* User info */}
          {session?.user?.email && (
            <p className="text-xs text-gray-400 mt-6">
              Signed in as {session.user.email}
            </p>
          )}
        </main>

        <InstallPrompt />
      </div>
    </AuthGuard>
  );
}
