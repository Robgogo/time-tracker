import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appendClockIn, getActiveEntry, updateClockOut } from "@/lib/sheets";
import { NextResponse } from "next/server";

// Clock In
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const active = await getActiveEntry();
    if (active) {
      return NextResponse.json(
        { error: "Already clocked in", entry: active },
        { status: 409 }
      );
    }

    const entry = await appendClockIn();
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Clock in error:", error);
    return NextResponse.json(
      { error: "Failed to clock in" },
      { status: 500 }
    );
  }
}

// Clock Out
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const active = await getActiveEntry();
    if (!active) {
      return NextResponse.json(
        { error: "Not clocked in" },
        { status: 400 }
      );
    }

    const entry = await updateClockOut(active.rowIndex);
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Clock out error:", error);
    return NextResponse.json(
      { error: "Failed to clock out" },
      { status: 500 }
    );
  }
}
