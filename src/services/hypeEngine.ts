// Hype Engine - Combines all sentiment sources into a composite score

import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import { HYPE_WEIGHTS, getHypeLevel } from "@/lib/constants";
import { HypeScore, TrendingTicker } from "@/lib/types";
import {
  getStockTwitsSentiment,
  getStockTwitsTrending,
  calculateStockTwitsScore,
} from "./stocktwits";
import {
  getNewsSentiment,
  calculateNewsScore,
  getStockQuote,
} from "./alphaVantage";

// Store previous scores for momentum calculation
const previousScores = new Map<string, { score: number; timestamp: number }>();

/**
 * Calculate momentum based on score change over time
 */
function calculateMomentum(
  ticker: string,
  currentScore: number
): "accelerating" | "stable" | "decelerating" {
  const previous = previousScores.get(ticker);
  const now = Date.now();

  // Store current score for future comparison
  previousScores.set(ticker, { score: currentScore, timestamp: now });

  if (!previous) {
    return "stable";
  }

  // Only compare if previous score is within last 4 hours
  const fourHoursMs = 4 * 60 * 60 * 1000;
  if (now - previous.timestamp > fourHoursMs) {
    return "stable";
  }

  const scoreDiff = currentScore - previous.score;

  if (scoreDiff > 10) {
    return "accelerating";
  } else if (scoreDiff < -10) {
    return "decelerating";
  }

  return "stable";
}

/**
 * Generate a human-readable summary of the hype score
 */
function generateSummary(
  ticker: string,
  score: number,
  momentum: "accelerating" | "stable" | "decelerating",
  stocktwitsScore: number,
  newsScore: number,
  bullishPercent: number
): string {
  const level = getHypeLevel(score);

  let summary = "";

  // Score level description
  switch (level) {
    case "extreme":
      summary = `${ticker} is on fire right now. `;
      break;
    case "high":
      summary = `${ticker} is generating serious buzz. `;
      break;
    case "medium":
      summary = `${ticker} has moderate social interest. `;
      break;
    case "low":
      summary = `${ticker} is relatively quiet on social media. `;
      break;
  }

  // Momentum
  switch (momentum) {
    case "accelerating":
      summary += "Interest is picking up fast. ";
      break;
    case "decelerating":
      summary += "Hype appears to be cooling off. ";
      break;
    default:
      summary += "Sentiment is holding steady. ";
  }

  // Sentiment breakdown
  if (bullishPercent >= 70) {
    summary += `Strong bullish sentiment at ${bullishPercent}%.`;
  } else if (bullishPercent >= 55) {
    summary += `Leaning bullish at ${bullishPercent}%.`;
  } else if (bullishPercent <= 40) {
    summary += `Bearish undertones with only ${bullishPercent}% bullish.`;
  } else {
    summary += `Mixed sentiment at ${bullishPercent}% bullish.`;
  }

  // Add warning for extreme hype
  if (score >= 90 && momentum === "accelerating") {
    summary += " Caution: Could be approaching a local top.";
  }

  return summary;
}

/**
 * Get composite hype score for a ticker
 */
export async function getHypeScore(
  ticker: string,
  timeframe: string = "24h"
): Promise<HypeScore> {
  const cacheKey = `hype:${ticker.toUpperCase()}:${timeframe}`;
  const cached = getCached<HypeScore>(cacheKey);
  if (cached) return cached;

  // Fetch data from all sources in parallel
  const [stocktwitsSentiment, newsSentiment, stockQuote] = await Promise.all([
    getStockTwitsSentiment(ticker),
    getNewsSentiment(ticker),
    getStockQuote(ticker),
  ]);

  // Calculate component scores
  const stocktwitsScore = calculateStockTwitsScore(stocktwitsSentiment);
  const newsScore = calculateNewsScore(newsSentiment);

  // Calculate weighted composite score
  const compositeScore = Math.round(
    stocktwitsScore * HYPE_WEIGHTS.STOCKTWITS +
      newsScore * HYPE_WEIGHTS.NEWS
  );

  // Calculate sentiment ratio
  const totalSentiment =
    (stocktwitsSentiment?.sentiment.bullish || 0) +
    (stocktwitsSentiment?.sentiment.bearish || 0);

  const bullishPercent =
    totalSentiment > 0
      ? Math.round(
          ((stocktwitsSentiment?.sentiment.bullish || 0) / totalSentiment) * 100
        )
      : 50;

  const bearishPercent = totalSentiment > 0 ? 100 - bullishPercent : 50;

  // Calculate momentum
  const momentum = calculateMomentum(ticker.toUpperCase(), compositeScore);

  // Generate summary
  const summary = generateSummary(
    ticker.toUpperCase(),
    compositeScore,
    momentum,
    stocktwitsScore,
    newsScore,
    bullishPercent
  );

  const result: HypeScore = {
    ticker: ticker.toUpperCase(),
    hypeScore: compositeScore,
    breakdown: {
      stocktwits: stocktwitsScore,
      news: newsScore,
    },
    mentionCount: stocktwitsSentiment?.messages.length || 0,
    sentimentRatio: {
      bullish: bullishPercent,
      bearish: bearishPercent,
      neutral: 0, // We don't track neutral separately for now
    },
    momentum,
    currentPrice: stockQuote?.price,
    priceChange: stockQuote?.change,
    priceChangePercent: stockQuote?.changePercent,
    summary,
    lastUpdated: new Date().toISOString(),
  };

  setCache(cacheKey, result, CACHE_TTL.HYPE_SCORE);
  return result;
}

/**
 * Get trending tickers with full hype scores
 */
export async function getTrendingTickers(
  limit: number = 10
): Promise<TrendingTicker[]> {
  // Get trending from StockTwits
  const stocktwitsTrending = await getStockTwitsTrending(Math.min(limit * 2, 30));

  if (stocktwitsTrending.length === 0) {
    return [];
  }

  // Enrich with full hype scores (in parallel, but batched)
  const enrichedTickers: TrendingTicker[] = [];

  // Process in batches of 5 to avoid overwhelming APIs
  for (let i = 0; i < Math.min(stocktwitsTrending.length, limit); i += 5) {
    const batch = stocktwitsTrending.slice(i, i + 5);
    const hypeScores = await Promise.all(
      batch.map((t) => getHypeScore(t.ticker))
    );

    for (let j = 0; j < batch.length; j++) {
      const ticker = batch[j];
      const hype = hypeScores[j];

      enrichedTickers.push({
        ticker: ticker.ticker,
        hypeScore: hype.hypeScore,
        momentum: hype.momentum,
        mentionCount: hype.mentionCount,
        bullishPercent: hype.sentimentRatio.bullish,
        rank: enrichedTickers.length + 1,
      });
    }
  }

  // Sort by hype score descending
  enrichedTickers.sort((a, b) => b.hypeScore - a.hypeScore);

  // Update ranks after sorting
  enrichedTickers.forEach((t, i) => {
    t.rank = i + 1;
  });

  return enrichedTickers.slice(0, limit);
}

/**
 * Get the most hyped ticker right now
 */
export async function getMostHyped(): Promise<HypeScore | null> {
  const trending = await getTrendingTickers(1);
  if (trending.length === 0) return null;

  return getHypeScore(trending[0].ticker);
}
