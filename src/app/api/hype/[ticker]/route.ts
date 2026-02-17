import { NextRequest, NextResponse } from "next/server";
import { getHypeScore } from "@/services/hypeEngine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "24h";

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker is required" },
        { status: 400 }
      );
    }

    const hypeScore = await getHypeScore(ticker.toUpperCase(), timeframe);

    return NextResponse.json(hypeScore);
  } catch (error) {
    console.error("Error in hype API:", error);
    return NextResponse.json(
      { error: "Failed to fetch hype score" },
      { status: 500 }
    );
  }
}
