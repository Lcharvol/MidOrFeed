import { NextResponse } from "next/server";
import { exportMatchesToCsv } from "@/lib/server/ml/exportMatches";

export async function POST() {
  try {
    const result = await exportMatchesToCsv();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("ML export error", error);
    return NextResponse.json(
      { success: false, error: "Échec de l'export des matches" },
      { status: 500 }
    );
  }
}
