import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEntries, getSummaryHours, updateEntry } from "@/lib/sheets";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const [entries, summary] = await Promise.all([
      getEntries(limit ? parseInt(limit) : undefined),
      getSummaryHours(),
    ]);

    return NextResponse.json({ entries, ...summary });
  } catch (error) {
    console.error("Entries error:", error);
    return NextResponse.json(
      { error: "Failed to get entries" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rowIndex, clockIn, clockOut, notes } = body;

    if (!rowIndex) {
      return NextResponse.json(
        { error: "rowIndex is required" },
        { status: 400 }
      );
    }

    // Validate time formats
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (clockIn && !timeRegex.test(clockIn)) {
      return NextResponse.json(
        { error: "Invalid clock-in time format (HH:mm)" },
        { status: 400 }
      );
    }
    if (clockOut && !timeRegex.test(clockOut)) {
      return NextResponse.json(
        { error: "Invalid clock-out time format (HH:mm)" },
        { status: 400 }
      );
    }

    const entry = await updateEntry(rowIndex, { clockIn, clockOut, notes });
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Update entry error:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}
