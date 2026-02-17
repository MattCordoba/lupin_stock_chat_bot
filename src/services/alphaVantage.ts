// Alpha Vantage API Service
// News sentiment analysis

import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import { NewsSentiment, NewsArticle } from "@/lib/types";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

interface AlphaVantageNewsResponse {
  items?: string;
  sentiment_score_definition?: string;
  relevance_score_definition?: string;
  feed?: Array<{
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: Array<{
      topic: string;
      relevance_score: string;
    }>;
    overall_sentiment_score: number;
    overall_sentiment_label: string;
    ticker_sentiment?: Array<{
      ticker: string;
      relevance_score: string;
      ticker_sentiment_score: string;
      ticker_sentiment_label: string;
    }>;
  }>;
  Information?: string;
  Note?: string;
}

/**
 * Get news sentiment for a specific ticker from Alpha Vantage
 */
export async function getNewsSentiment(
  ticker: string
): Promise<NewsSentiment | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error("ALPHA_VANTAGE_API_KEY not set");
    return null;
  }

  const cacheKey = `alphavantage:news:${ticker.toUpperCase()}`;
  const cached = getCached<NewsSentiment>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(ALPHA_VANTAGE_BASE_URL);
    url.searchParams.set("function", "NEWS_SENTIMENT");
    url.searchParams.set("tickers", ticker.toUpperCase());
    url.searchParams.set("limit", "50");
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // 5 minute cache
    });

    if (!response.ok) {
      console.error(`Alpha Vantage API error for ${ticker}: ${response.status}`);
      return null;
    }

    const data: AlphaVantageNewsResponse = await response.json();

    // Check for API limit message
    if (data.Information || data.Note) {
      console.warn("Alpha Vantage API limit reached:", data.Information || data.Note);
      return null;
    }

    if (!data.feed || data.feed.length === 0) {
      return {
        ticker: ticker.toUpperCase(),
        overallScore: 50, // Neutral if no news
        articles: [],
      };
    }

    // Process articles and calculate sentiment
    const articles: NewsArticle[] = [];
    let totalScore = 0;
    let relevantArticles = 0;

    for (const article of data.feed) {
      // Find ticker-specific sentiment if available
      const tickerSentiment = article.ticker_sentiment?.find(
        (t) => t.ticker.toUpperCase() === ticker.toUpperCase()
      );

      const relevanceScore = tickerSentiment
        ? parseFloat(tickerSentiment.relevance_score)
        : 0.5;

      // Only include articles with decent relevance
      if (relevanceScore < 0.3) continue;

      const sentimentScore = tickerSentiment
        ? parseFloat(tickerSentiment.ticker_sentiment_score)
        : article.overall_sentiment_score;

      // Map sentiment score from [-1, 1] to [0, 100]
      const normalizedScore = Math.round((sentimentScore + 1) * 50);

      // Determine sentiment label
      let sentimentLabel: "Bullish" | "Bearish" | "Neutral";
      if (normalizedScore >= 60) {
        sentimentLabel = "Bullish";
      } else if (normalizedScore <= 40) {
        sentimentLabel = "Bearish";
      } else {
        sentimentLabel = "Neutral";
      }

      articles.push({
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.time_published,
        sentimentScore: normalizedScore,
        sentimentLabel,
        relevanceScore,
      });

      // Weight by relevance for overall score
      totalScore += normalizedScore * relevanceScore;
      relevantArticles += relevanceScore;
    }

    const overallScore =
      relevantArticles > 0
        ? Math.round(totalScore / relevantArticles)
        : 50;

    const result: NewsSentiment = {
      ticker: ticker.toUpperCase(),
      overallScore,
      articles: articles.slice(0, 10), // Return top 10 most relevant
    };

    setCache(cacheKey, result, CACHE_TTL.NEWS_SENTIMENT);
    return result;
  } catch (error) {
    console.error(`Error fetching Alpha Vantage news for ${ticker}:`, error);
    return null;
  }
}

/**
 * Calculate news sentiment score component (0-100)
 */
export function calculateNewsScore(sentiment: NewsSentiment | null): number {
  if (!sentiment) return 50; // Neutral if no data

  // If no articles, return neutral
  if (sentiment.articles.length === 0) return 50;

  // The overallScore is already weighted by relevance
  // Apply a small volume bonus for more news coverage
  const volumeBonus = Math.min(10, sentiment.articles.length);

  return Math.min(100, Math.round(sentiment.overallScore + volumeBonus * 0.5));
}

/**
 * Get top market movers from Alpha Vantage
 */
export async function getMarketMovers(): Promise<{
  gainers: string[];
  losers: string[];
  mostActive: string[];
} | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error("ALPHA_VANTAGE_API_KEY not set");
    return null;
  }

  const cacheKey = "alphavantage:movers";
  const cached = getCached<{ gainers: string[]; losers: string[]; mostActive: string[] }>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(ALPHA_VANTAGE_BASE_URL);
    url.searchParams.set("function", "TOP_GAINERS_LOSERS");
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(`Alpha Vantage movers API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.Information || data.Note) {
      console.warn("Alpha Vantage API limit reached");
      return null;
    }

    const result = {
      gainers: (data.top_gainers || []).slice(0, 10).map((t: { ticker: string }) => t.ticker),
      losers: (data.top_losers || []).slice(0, 10).map((t: { ticker: string }) => t.ticker),
      mostActive: (data.most_actively_traded || []).slice(0, 10).map((t: { ticker: string }) => t.ticker),
    };

    setCache(cacheKey, result, 300);
    return result;
  } catch (error) {
    console.error("Error fetching Alpha Vantage movers:", error);
    return null;
  }
}
