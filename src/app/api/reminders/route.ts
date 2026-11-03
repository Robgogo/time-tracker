import { REMINDER_MINUTES } from "@/lib/constants";
import { sendToAll } from "@/lib/push";
import { getActiveEntry, getRemindersSent, setRemindersSent } from "@/lib/sheets";
import { toInstant } from "@/lib/timezone";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Called by a scheduled job. Sends one reminder for every REMINDER_MINUTES
// that have passed since clock-in, until the user clocks out.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const active = await getActiveEntry();
    if (!active) {
      return NextResponse.json({ status: "not clocked in" });
    }

    const clockIn = toInstant(active.date, active.clockIn);
    const elapsedMinutes = Math.floor((Date.now() - clockIn.getTime()) / 60000);
    const due = Math.floor(elapsedMinutes / REMINDER_MINUTES);
    const alreadySent = await getRemindersSent(active.rowIndex);

    if (due <= alreadySent) {
      return NextResponse.json({ status: "no reminder due", elapsedMinutes });
    }

    // Record first so a slow or failed push never causes a repeat
    await setRemindersSent(active.rowIndex, due);
    const result = await sendToAll({
      title: "Still clocked in?",
      body: `You clocked in at ${active.clockIn} — that's ${formatDuration(elapsedMinutes)} ago. Don't forget to clock out!`,
    });

    return NextResponse.json({ status: "reminder sent", elapsedMinutes, ...result });
  } catch (error) {
    console.error("Reminder error:", error);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
