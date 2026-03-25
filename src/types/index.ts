export interface TimeEntry {
  rowIndex: number;
  date: string;
  day: string;
  clockIn: string;
  clockOut: string | null;
  hours: number | null;
  status: "active" | "complete" | "edited" | "summary";
  edited: boolean;
  notes: string;
}

export interface ClockStatus {
  isClockedIn: boolean;
  currentEntry: TimeEntry | null;
}

export interface EntriesResponse {
  entries: TimeEntry[];
  todayHours: number;
  weekHours: number;
  monthHours: number;
}
