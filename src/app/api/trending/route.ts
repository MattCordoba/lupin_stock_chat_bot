import { NextRequest, NextResponse } from "next/server";
import { getTrendingTickers } from "@/services/hypeEngine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const source = searchParams.get("source") || "all";

    const trending = await getTrendingTickers(
      Math.min(Math.max(limit, 1), 50),
      source
    );

    return NextResponse.json({
      tickers: trending,
      count: trending.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in trending API:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending tickers" },
      { status: 500 }
    );
  }
}
