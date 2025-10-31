import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Route GET pour obtenir la liste des items
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: items,
        count: items.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des items:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des items",
      },
      { status: 500 }
    );
  }
}
