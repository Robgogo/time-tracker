import { google } from "googleapis";
import { SHEET_HEADERS, SHEET_NAME } from "./constants";
import {
  calculateHours,
  formatDate,
  formatDay,
  formatMonth,
  formatTime,
  getMonthKey,
  getWeekNumber,
} from "./timezone";
import { TimeEntry } from "@/types";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      `Missing service account credentials: email=${!!email}, key=${!!rawKey}`
    );
  }

  // Handle private key: strip wrapping quotes and convert literal \n to newlines
  const privateKey = rawKey
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}


function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID is not set");
  return id;
}

// --- Sheet Initialization ---
// The sheet must be created manually in Google Sheets and shared with the
// service account. This function initializes the headers if the sheet is empty.

export async function initializeSheet(): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  // Check if headers already exist
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A1:H1",
    });
    if (res.data.values && res.data.values.length > 0) {
      return; // Headers already set
    }
  } catch {
    // Sheet might be empty, continue to set headers
  }

  // Write headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "A1:H1",
    valueInputOption: "RAW",
    requestBody: { values: [SHEET_HEADERS] },
  });

  // Rename tab, bold headers, and freeze row
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetGid = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetGid,
              title: SHEET_NAME,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: "title,gridProperties.frozenRowCount",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: sheetGid,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat(textFormat,horizontalAlignment)",
          },
        },
      ],
    },
  });
}

// --- Row Parsing ---

function parseRow(row: string[], rowIndex: number): TimeEntry | null {
  const [date, day, clockIn, clockOut, hours, status, edited, notes] = row;

  if (
    status === "summary" ||
    date?.startsWith("Week") ||
    date?.startsWith("Month")
  ) {
    return {
      rowIndex,
      date,
      day: day || "",
      clockIn: clockIn || "",
      clockOut: clockOut || null,
      hours: hours ? parseFloat(hours) : null,
      status: "summary",
      edited: false,
      notes: notes || "",
    };
  }

  return {
    rowIndex,
    date: date || "",
    day: day || "",
    clockIn: clockIn || "",
    clockOut: clockOut || null,
    hours: hours ? parseFloat(hours) : null,
    status: (status as TimeEntry["status"]) || "active",
    edited: edited === "true",
    notes: notes || "",
  };
}

// --- Read Operations ---

export async function getEntries(limit?: number): Promise<TimeEntry[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_NAME}'!A2:H`,
  });

  const rows = res.data.values || [];
  const entries: TimeEntry[] = [];

  for (let i = 0; i < rows.length; i++) {
    const entry = parseRow(rows[i], i + 2); // +2 because row 1 is header, sheets are 1-indexed
    if (entry) entries.push(entry);
  }

  // Most recent first
  entries.reverse();

  if (limit) return entries.slice(0, limit);
  return entries;
}

export async function getActiveEntry(): Promise<TimeEntry | null> {
  const entries = await getEntries();
  return entries.find((e) => e.status === "active") || null;
}

export async function getSummaryHours(): Promise<{
  todayHours: number;
  weekHours: number;
  monthHours: number;
}> {
  const entries = await getEntries();
  const now = new Date();
  const todayStr = formatDate(now);
  const currentWeek = getWeekNumber(now);
  const currentMonth = getMonthKey(now);

  let todayHours = 0;
  let weekHours = 0;
  let monthHours = 0;

  for (const entry of entries) {
    if (entry.status === "summary" || !entry.hours) continue;

    if (entry.date === todayStr) todayHours += entry.hours;

    // Parse entry date for week/month comparison
    const entryDate = new Date(entry.date);
    if (!isNaN(entryDate.getTime())) {
      if (getWeekNumber(entryDate) === currentWeek && getMonthKey(entryDate) === currentMonth) {
        weekHours += entry.hours;
      }
      if (getMonthKey(entryDate) === currentMonth) {
        monthHours += entry.hours;
      }
    }
  }

  return {
    todayHours: Math.round(todayHours * 100) / 100,
    weekHours: Math.round(weekHours * 100) / 100,
    monthHours: Math.round(monthHours * 100) / 100,
  };
}

// --- Write Operations ---

export async function appendClockIn(): Promise<TimeEntry> {
  const sheets = getSheetsClient();
  const now = new Date();
  const date = formatDate(now);
  const day = formatDay(now);
  const time = formatTime(now);

  const row = [date, day, time, "", "", "active", "false", ""];

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_NAME}'!A:H`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  // Parse the updated range to get the row number
  const updatedRange = res.data.updates?.updatedRange || "";
  const match = updatedRange.match(/!A(\d+)/);
  const rowIndex = match ? parseInt(match[1]) : -1;

  return {
    rowIndex,
    date,
    day,
    clockIn: time,
    clockOut: null,
    hours: null,
    status: "active",
    edited: false,
    notes: "",
  };
}

export async function updateClockOut(
  rowIndex: number
): Promise<TimeEntry> {
  const sheets = getSheetsClient();
  const now = new Date();
  const clockOutTime = formatTime(now);

  // First read the clock-in time from the row
  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_NAME}'!A${rowIndex}:H${rowIndex}`,
  });

  const row = readRes.data.values?.[0] || [];
  const clockInTime = row[2]; // Column C
  const hours = calculateHours(clockInTime, clockOutTime);

  // Update columns D, E, F (Clock Out, Hours, Status)
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_NAME}'!D${rowIndex}:F${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [[clockOutTime, hours, "complete"]] },
  });

  // Check and insert summaries after clock-out
  await checkAndInsertSummaries();

  return {
    rowIndex,
    date: row[0],
    day: row[1],
    clockIn: clockInTime,
    clockOut: clockOutTime,
    hours,
    status: "complete",
    edited: row[6] === "true",
    notes: row[7] || "",
  };
}

export async function updateEntry(
  rowIndex: number,
  updates: {
    clockIn?: string;
    clockOut?: string;
    notes?: string;
  }
): Promise<TimeEntry> {
  const sheets = getSheetsClient();

  // Read current row
  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_NAME}'!A${rowIndex}:H${rowIndex}`,
  });

  const row = readRes.data.values?.[0] || [];
  const clockIn = updates.clockIn || row[2];
  const clockOut = updates.clockOut || row[3];
  const notes = updates.notes !== undefined ? updates.notes : row[7] || "";
  const hours = clockIn && clockOut ? calculateHours(clockIn, clockOut) : null;
  const status = clockOut ? "edited" : row[5];

  const updatedRow = [
    row[0], // Date
    row[1], // Day
    clockIn,
    clockOut || "",
    hours ?? "",
    status,
    "true", // Edited
    notes,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_NAME}'!A${rowIndex}:H${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [updatedRow] },
  });

  return {
    rowIndex,
    date: row[0],
    day: row[1],
    clockIn,
    clockOut: clockOut || null,
    hours,
    status: status as TimeEntry["status"],
    edited: true,
    notes,
  };
}

export async function deleteEntry(rowIndex: number): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  // Get the numeric sheet GID
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetGid = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetGid,
              dimension: "ROWS",
              startIndex: rowIndex - 1, // 0-based
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

// --- Summary Logic ---

async function checkAndInsertSummaries(): Promise<void> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_NAME}'!A2:H`,
  });

  const rows = res.data.values || [];
  if (rows.length === 0) return;

  // Collect all non-summary entries
  const entries: { date: string; hours: number; rowIndex: number }[] = [];
  const existingSummaries = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const [date, , , , hours, status] = rows[i];
    if (status === "summary") {
      existingSummaries.add(date);
      continue;
    }
    if (hours && (status === "complete" || status === "edited")) {
      entries.push({
        date,
        hours: parseFloat(hours),
        rowIndex: i + 2,
      });
    }
  }

  if (entries.length === 0) return;

  // Group by week and month
  const weekGroups = new Map<string, number>();
  const monthGroups = new Map<string, number>();

  for (const entry of entries) {
    const d = new Date(entry.date);
    if (isNaN(d.getTime())) continue;

    const weekKey = `Week ${getWeekNumber(d)} - ${getMonthKey(d)}`;
    const monthKey = `${formatMonth(d)} Summary`;

    weekGroups.set(weekKey, (weekGroups.get(weekKey) || 0) + entry.hours);
    monthGroups.set(monthKey, (monthGroups.get(monthKey) || 0) + entry.hours);
  }

  // Determine which summaries need to be added
  // Only add summaries for completed weeks/months (not the current one)
  const now = new Date();
  const currentWeekKey = `Week ${getWeekNumber(now)} - ${getMonthKey(now)}`;
  const currentMonthKey = `${formatMonth(now)} Summary`;

  const rowsToAppend: string[][] = [];

  for (const [weekKey, totalHours] of Array.from(weekGroups.entries())) {
    const summaryLabel = `${weekKey} Summary`;
    if (weekKey !== currentWeekKey && !existingSummaries.has(summaryLabel)) {
      rowsToAppend.push([
        summaryLabel,
        "",
        "",
        "",
        Math.round(totalHours * 100) / 100 + "",
        "summary",
        "",
        "",
      ]);
    }
  }

  for (const [monthKey, totalHours] of Array.from(monthGroups.entries())) {
    if (monthKey !== currentMonthKey && !existingSummaries.has(monthKey)) {
      rowsToAppend.push([
        monthKey,
        "",
        "",
        "",
        Math.round(totalHours * 100) / 100 + "",
        "summary",
        "",
        "",
      ]);
    }
  }

  if (rowsToAppend.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSheetId(),
      range: `'${SHEET_NAME}'!A:H`,
      valueInputOption: "RAW",
      requestBody: { values: rowsToAppend },
    });
  }
}
