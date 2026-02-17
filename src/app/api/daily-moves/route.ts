import { NextRequest, NextResponse } from "next/server";
import { getDailyMoves } from "@/services/positionSuggester";

export async function GET() {
  try {
    const moves = await getDailyMoves();

    return NextResponse.json({
      success: true,
      data: moves,
    });
  } catch (error) {
    console.error("Error in daily-moves API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate daily moves" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positions } = body as { positions?: string[] };

    const moves = await getDailyMoves(positions);

    return NextResponse.json({
      success: true,
      data: moves,
    });
  } catch (error) {
    console.error("Error in daily-moves API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate daily moves" },
      { status: 500 }
    );
  }
}
