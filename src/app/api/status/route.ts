import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveEntry, getSummaryHours } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [activeEntry, summary] = await Promise.all([
      getActiveEntry(),
      getSummaryHours(),
    ]);

    return NextResponse.json({
      isClockedIn: !!activeEntry,
      currentEntry: activeEntry,
      ...summary,
    });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
