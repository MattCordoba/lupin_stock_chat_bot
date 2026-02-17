// Core types for Joel the HypeTrader

export interface HypeScore {
  ticker: string;
  hypeScore: number; // 0-100 composite score
  breakdown: {
    stocktwits: number; // 0-100
    news: number; // 0-100
  };
  mentionCount: number;
  sentimentRatio: {
    bullish: number; // percentage 0-100
    bearish: number;
    neutral: number;
  };
  momentum: "accelerating" | "stable" | "decelerating";
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  summary: string;
  lastUpdated: string;
}

export interface TrendingTicker {
  ticker: string;
  hypeScore: number;
  momentum: "accelerating" | "stable" | "decelerating";
  mentionCount: number;
  bullishPercent: number;
  rank: number;
}

export interface StockTwitsSentiment {
  ticker: string;
  sentiment: {
    bullish: number;
    bearish: number;
  };
  messages: StockTwitsMessage[];
  watchlistCount?: number;
}

export interface StockTwitsMessage {
  id: number;
  body: string;
  createdAt: string;
  sentiment?: "bullish" | "bearish" | null;
  user: {
    username: string;
    followers: number;
  };
}

export interface NewsSentiment {
  ticker: string;
  overallScore: number; // 0-100 (mapped from -1 to 1)
  articles: NewsArticle[];
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentimentScore: number;
  sentimentLabel: "Bullish" | "Bearish" | "Neutral";
  relevanceScore: number;
}

export interface PositionSuggestion {
  ticker: string;
  hypeScore: number;
  strategy: string;
  strategyType:
    | "buy_shares"
    | "sell_shares"
    | "hold"
    | "watch"
    | "no_trade";
  rationale: string;
  confidenceLevel: "high" | "medium" | "low";
  risks: string[];
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
