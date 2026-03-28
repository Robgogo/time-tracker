"use client";

import AuthGuard from "@/components/AuthGuard";
import EditEntryModal from "@/components/EditEntryModal";
import EntryTable from "@/components/EntryTable";
import SummaryCard from "@/components/SummaryCard";
import { TimeEntry } from "@/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function HistoryPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Compute monthly hours breakdown from entries
  const monthlyBreakdown = entries
    .filter((e) => e.status !== "summary" && e.hours && e.date)
    .reduce<Record<string, number>>((acc, entry) => {
      const d = new Date(entry.date);
      if (isNaN(d.getTime())) return acc;
      const key = d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "Europe/Madrid",
      });
      acc[key] = (acc[key] || 0) + (entry.hours ?? 0);
      return acc;
    }, {});

  const monthlyList = Object.entries(monthlyBreakdown)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data.entries);
      setSummary({
        todayHours: data.todayHours,
        weekHours: data.weekHours,
        monthHours: data.monthHours,
      });
    } catch {
      // Try cached
      const cached = localStorage.getItem("lastEntries");
      if (cached) {
        const data = JSON.parse(cached);
        setEntries(data.entries || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSave = async (
    rowIndex: number,
    updates: { clockIn?: string; clockOut?: string; notes?: string }
  ) => {
    const res = await fetch("/api/entries", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex, ...updates }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to update");
    }
    await fetchEntries();
  };

  const handleDelete = async (entry: TimeEntry) => {
    const confirmed = window.confirm(
      `Delete entry for ${entry.day}, ${entry.date}?\n${entry.clockIn}${entry.clockOut ? ` - ${entry.clockOut}` : ""}\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/entries?rowIndex=${entry.rowIndex}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete");
      return;
    }
    await fetchEntries();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <h1 className="text-lg font-bold text-gray-900">History</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <div className="mb-6">
            <SummaryCard
              todayHours={summary.todayHours}
              weekHours={summary.weekHours}
              monthHours={summary.monthHours}
            />
          </div>

          {!loading && monthlyList.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Monthly Hours
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {monthlyList.map(([month, hours]) => (
                  <div
                    key={month}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-gray-700 font-medium">{month}</span>
                    <span className="text-gray-900 font-bold">
                      {hours.toFixed(1)} hrs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <EntryTable
              entries={entries}
              onEdit={(entry) => setEditingEntry(entry)}
              onDelete={handleDelete}
            />
          )}
        </main>

        {editingEntry && (
          <EditEntryModal
            entry={editingEntry}
            onSave={handleSave}
            onClose={() => setEditingEntry(null)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
