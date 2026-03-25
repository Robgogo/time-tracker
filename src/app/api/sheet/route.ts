import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initializeSheet } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initializeSheet();
    return NextResponse.json({
      message: "Sheet initialized with headers successfully!",
    });
  } catch (error) {
    console.error("Sheet init error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to initialize sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
