// StockTwits API Service
// Uses public endpoints (no auth required)

import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import { StockTwitsSentiment, StockTwitsMessage, TrendingTicker } from "@/lib/types";

const STOCKTWITS_BASE_URL = "https://api.stocktwits.com/api/2";

interface StockTwitsSymbolResponse {
  response: { status: number };
  symbol: {
    id: number;
    symbol: string;
    title: string;
    watchlist_count?: number;
  };
  messages: Array<{
    id: number;
    body: string;
    created_at: string;
    entities?: {
      sentiment?: {
        basic: "Bullish" | "Bearish" | null;
      };
    };
    user: {
      username: string;
      followers: number;
    };
  }>;
}

interface StockTwitsTrendingResponse {
  response: { status: number };
  symbols: Array<{
    id: number;
    symbol: string;
    title: string;
    watchlist_count: number;
  }>;
}

/**
 * Get sentiment data for a specific ticker from StockTwits
 */
export async function getStockTwitsSentiment(
  ticker: string
): Promise<StockTwitsSentiment | null> {
  const cacheKey = `stocktwits:sentiment:${ticker.toUpperCase()}`;
  const cached = getCached<StockTwitsSentiment>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${STOCKTWITS_BASE_URL}/streams/symbol/${ticker.toUpperCase()}.json`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 120 }, // 2 minute cache at fetch level
      }
    );

    if (!response.ok) {
      console.error(`StockTwits API error for ${ticker}: ${response.status}`);
      return null;
    }

    const data: StockTwitsSymbolResponse = await response.json();

    if (data.response.status !== 200) {
      return null;
    }

    // Count sentiment from messages
    let bullishCount = 0;
    let bearishCount = 0;

    const messages: StockTwitsMessage[] = data.messages.map((msg) => {
      const sentiment = msg.entities?.sentiment?.basic || null;
      if (sentiment === "Bullish") bullishCount++;
      if (sentiment === "Bearish") bearishCount++;

      return {
        id: msg.id,
        body: msg.body,
        createdAt: msg.created_at,
        sentiment: sentiment?.toLowerCase() as "bullish" | "bearish" | null,
        user: {
          username: msg.user.username,
          followers: msg.user.followers,
        },
      };
    });

    const result: StockTwitsSentiment = {
      ticker: ticker.toUpperCase(),
      sentiment: {
        bullish: bullishCount,
        bearish: bearishCount,
      },
      messages,
      watchlistCount: data.symbol.watchlist_count,
    };

    setCache(cacheKey, result, CACHE_TTL.STOCKTWITS_SENTIMENT);
    return result;
  } catch (error) {
    console.error(`Error fetching StockTwits sentiment for ${ticker}:`, error);
    return null;
  }
}

/**
 * Get trending tickers from StockTwits
 */
export async function getStockTwitsTrending(
  limit: number = 30
): Promise<TrendingTicker[]> {
  const cacheKey = `stocktwits:trending:${limit}`;
  const cached = getCached<TrendingTicker[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${STOCKTWITS_BASE_URL}/trending/symbols.json`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 60 }, // 1 minute cache
      }
    );

    if (!response.ok) {
      console.error(`StockTwits trending API error: ${response.status}`);
      return [];
    }

    const data: StockTwitsTrendingResponse = await response.json();

    if (data.response.status !== 200) {
      return [];
    }

    // Get sentiment for each trending ticker (in parallel, but limited)
    const tickers = data.symbols.slice(0, limit);
    const sentimentPromises = tickers.map((symbol) =>
      getStockTwitsSentiment(symbol.symbol)
    );

    const sentiments = await Promise.all(sentimentPromises);

    const result: TrendingTicker[] = tickers.map((symbol, index) => {
      const sentiment = sentiments[index];
      const totalSentiment =
        (sentiment?.sentiment.bullish || 0) +
        (sentiment?.sentiment.bearish || 0);
      const bullishPercent =
        totalSentiment > 0
          ? Math.round(
              ((sentiment?.sentiment.bullish || 0) / totalSentiment) * 100
            )
          : 50;

      // Calculate a hype score based on watchlist count and sentiment
      // This is a simplified score - the full hype engine will combine multiple sources
      const baseScore = Math.min(100, Math.log10((symbol.watchlist_count || 1) + 1) * 25);
      const sentimentBoost = bullishPercent > 60 ? (bullishPercent - 50) * 0.3 : 0;
      const hypeScore = Math.min(100, Math.round(baseScore + sentimentBoost));

      return {
        ticker: symbol.symbol,
        hypeScore,
        momentum: "stable" as const, // Will be calculated by hype engine
        mentionCount: sentiment?.messages.length || 0,
        bullishPercent,
        rank: index + 1,
      };
    });

    setCache(cacheKey, result, CACHE_TTL.STOCKTWITS_TRENDING);
    return result;
  } catch (error) {
    console.error("Error fetching StockTwits trending:", error);
    return [];
  }
}

/**
 * Calculate StockTwits score component (0-100)
 */
export function calculateStockTwitsScore(sentiment: StockTwitsSentiment | null): number {
  if (!sentiment) return 0;

  const totalMessages = sentiment.messages.length;
  const totalSentiment = sentiment.sentiment.bullish + sentiment.sentiment.bearish;

  if (totalMessages === 0) return 0;

  // Base score from message volume (logarithmic scale)
  // 1 message = 10, 10 messages = 40, 30 messages = 60, 50+ = 80+
  const volumeScore = Math.min(80, Math.log10(totalMessages + 1) * 40);

  // Sentiment multiplier (bullish > 70% = boost, < 40% = penalty)
  const bullishRatio = totalSentiment > 0
    ? sentiment.sentiment.bullish / totalSentiment
    : 0.5;

  let sentimentMultiplier = 1;
  if (bullishRatio > 0.7) {
    sentimentMultiplier = 1 + (bullishRatio - 0.7) * 0.5; // Up to 15% boost
  } else if (bullishRatio < 0.4) {
    sentimentMultiplier = 0.8 + bullishRatio * 0.5; // Penalty for bearish
  }

  // Watchlist count bonus
  const watchlistBonus = sentiment.watchlistCount
    ? Math.min(10, Math.log10(sentiment.watchlistCount) * 3)
    : 0;

  return Math.min(100, Math.round(volumeScore * sentimentMultiplier + watchlistBonus));
}
