import { NextResponse } from "next/server";
import { exportCompositionsToCsv } from "@/lib/server/ml/exportCompositions";

export async function POST() {
  try {
    const result = await exportCompositionsToCsv();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("ML compositions export error", error);
    return NextResponse.json(
      { success: false, error: "Échec de l'export des compositions" },
      { status: 500 }
    );
  }
}


