import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getHypeScore, getTrendingTickers } from "@/services/hypeEngine";
import { suggestPosition } from "@/services/positionSuggester";
import { JOEL_SYSTEM_PROMPT } from "@/lib/constants";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      system: JOEL_SYSTEM_PROMPT,
      messages,
      tools: {
        getHypeScore: tool({
          description:
            "Get the composite hype score (0-100) for a stock ticker, aggregated from StockTwits and news sentiment. Use this when the user asks about a specific stock's sentiment or hype level.",
          parameters: z.object({
            ticker: z.string().describe("Stock ticker symbol (e.g., NVDA, AAPL, TSLA)"),
            timeframe: z
              .enum(["1h", "4h", "24h", "7d"])
              .default("24h")
              .describe("Timeframe for sentiment analysis"),
          }),
          execute: async ({ ticker }) => {
            const score = await getHypeScore(ticker);
            return {
              ticker: score.ticker,
              hypeScore: score.hypeScore,
              momentum: score.momentum,
              breakdown: score.breakdown,
              sentimentRatio: score.sentimentRatio,
              mentionCount: score.mentionCount,
              summary: score.summary,
            };
          },
        }),

        getTrending: tool({
          description:
            "Get the top trending stock tickers ranked by social media hype. Use this when the user asks what's hot, what's trending, or wants to see popular stocks.",
          parameters: z.object({
            limit: z
              .number()
              .min(1)
              .max(20)
              .default(10)
              .describe("Number of trending tickers to return"),
          }),
          execute: async ({ limit }) => {
            const trending = await getTrendingTickers(limit);
            return {
              tickers: trending.map((t) => ({
                rank: t.rank,
                ticker: t.ticker,
                hypeScore: t.hypeScore,
                momentum: t.momentum,
                bullishPercent: t.bullishPercent,
              })),
              count: trending.length,
            };
          },
        }),

        suggestPosition: tool({
          description:
            "Generate an optimal trade suggestion for a ticker based on sentiment and risk tolerance. Use this when the user asks what to do with a stock, wants a trade idea, or asks for advice on a position.",
          parameters: z.object({
            ticker: z.string().describe("Stock ticker symbol"),
            riskTolerance: z
              .enum(["conservative", "moderate", "aggressive"])
              .default("moderate")
              .describe("User's risk tolerance level"),
            maxCapital: z
              .number()
              .optional()
              .describe("Maximum capital to allocate (optional)"),
          }),
          execute: async ({ ticker, riskTolerance, maxCapital }) => {
            const suggestion = await suggestPosition(
              ticker,
              riskTolerance,
              maxCapital
            );
            return {
              ticker: suggestion.ticker,
              hypeScore: suggestion.hypeScore,
              strategy: suggestion.strategy,
              strategyType: suggestion.strategyType,
              rationale: suggestion.rationale,
              confidenceLevel: suggestion.confidenceLevel,
              risks: suggestion.risks,
              disclaimer: suggestion.disclaimer,
            };
          },
        }),
      },
      maxSteps: 5, // Allow multi-step tool calls
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
