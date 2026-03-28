"use client";

import { TimeEntry } from "@/types";

interface Props {
  entries: TimeEntry[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
}

export default function EntryTable({ entries, onEdit, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No entries yet</p>
        <p className="text-sm mt-1">Clock in to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 text-gray-500 font-medium">
              Date
            </th>
            <th className="text-left py-2 px-2 text-gray-500 font-medium">
              In
            </th>
            <th className="text-left py-2 px-2 text-gray-500 font-medium">
              Out
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium">
              Hours
            </th>
            <th className="text-center py-2 px-1 text-gray-500 font-medium w-16">
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            if (entry.status === "summary") {
              return (
                <tr
                  key={`summary-${i}`}
                  className="bg-gray-50 border-b border-gray-100"
                >
                  <td
                    colSpan={3}
                    className="py-2 px-2 font-semibold text-gray-700"
                  >
                    {entry.date}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-gray-800">
                    {entry.hours?.toFixed(1)}
                  </td>
                  <td />
                </tr>
              );
            }

            return (
              <tr
                key={`entry-${entry.rowIndex}`}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-2.5 px-2">
                  <div className="font-medium text-gray-800">
                    {entry.day?.slice(0, 3)}
                  </div>
                  <div className="text-xs text-gray-400">{entry.date}</div>
                </td>
                <td className="py-2.5 px-2 text-gray-700">{entry.clockIn}</td>
                <td className="py-2.5 px-2 text-gray-700">
                  {entry.clockOut || (
                    <span className="text-green-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-2 text-right font-medium text-gray-800">
                  {entry.hours?.toFixed(2) || "—"}
                </td>
                <td className="py-2.5 px-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {entry.status !== "active" && (
                      <button
                        onClick={() => onEdit(entry)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Edit entry"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(entry)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Delete entry"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
