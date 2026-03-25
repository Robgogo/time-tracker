"use client";

interface Props {
  isClockedIn: boolean;
  clockInTime: string | null;
}

export default function StatusBanner({ isClockedIn, clockInTime }: Props) {
  if (isClockedIn) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
        <span className="text-green-800 font-medium text-sm">
          Clocked in since {clockInTime}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
      <span className="w-2.5 h-2.5 bg-gray-400 rounded-full" />
      <span className="text-gray-500 font-medium text-sm">Not clocked in</span>
    </div>
  );
}
