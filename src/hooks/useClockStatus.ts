"use client";

import { ClockStatus } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface StatusData extends ClockStatus {
  todayHours: number;
  weekHours: number;
  monthHours: number;
}

export function useClockStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const json = await res.json();
      setData(json);

      // Cache for offline
      localStorage.setItem("lastStatus", JSON.stringify(json));
    } catch (err) {
      // Try cached data
      const cached = localStorage.getItem("lastStatus");
      if (cached) {
        setData(JSON.parse(cached));
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const clockIn = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clock", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to clock in");
      }
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const clockOut = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clock", { method: "PUT" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to clock out");
      }
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return { data, loading, error, clockIn, clockOut, refresh: fetchStatus };
}
