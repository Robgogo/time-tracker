"use client";

interface Props {
  todayHours: number;
  weekHours: number;
  monthHours: number;
}

export default function SummaryCard({
  todayHours,
  weekHours,
  monthHours,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      <div className="bg-blue-50 rounded-xl p-4 text-center">
        <p className="text-xs text-blue-600 font-medium uppercase">Today</p>
        <p className="text-2xl font-bold text-blue-900 mt-1">
          {todayHours.toFixed(1)}
        </p>
        <p className="text-xs text-blue-500">hours</p>
      </div>
      <div className="bg-purple-50 rounded-xl p-4 text-center">
        <p className="text-xs text-purple-600 font-medium uppercase">Week</p>
        <p className="text-2xl font-bold text-purple-900 mt-1">
          {weekHours.toFixed(1)}
        </p>
        <p className="text-xs text-purple-500">hours</p>
      </div>
      <div className="bg-amber-50 rounded-xl p-4 text-center">
        <p className="text-xs text-amber-600 font-medium uppercase">Month</p>
        <p className="text-2xl font-bold text-amber-900 mt-1">
          {monthHours.toFixed(1)}
        </p>
        <p className="text-xs text-amber-500">hours</p>
      </div>
    </div>
  );
}
