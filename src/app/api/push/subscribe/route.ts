import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidSubscription } from "@/lib/push";
import { saveSubscription } from "@/lib/sheets";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await request.json();
    if (!isValidSubscription(subscription)) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 }
      );
    }
    await saveSubscription(session.user?.email || "", subscription);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}
