import { NextRequest, NextResponse } from "next/server";
import { suggestPosition, getTopSuggestion } from "@/services/positionSuggester";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const risk = (searchParams.get("risk") || "moderate") as
      | "conservative"
      | "moderate"
      | "aggressive";
    const maxCapital = searchParams.get("maxCapital")
      ? parseFloat(searchParams.get("maxCapital")!)
      : undefined;

    let suggestion;

    if (ticker) {
      suggestion = await suggestPosition(ticker, risk, maxCapital);
    } else {
      // If no ticker specified, get top suggestion from trending
      suggestion = await getTopSuggestion(risk);

      if (!suggestion) {
        return NextResponse.json(
          { error: "No trending tickers available for suggestions" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Error in suggest API:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
