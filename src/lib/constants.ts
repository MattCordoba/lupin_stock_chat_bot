// Joel the HypeTrader - Constants

// Hype score weights for composite calculation
export const HYPE_WEIGHTS = {
  STOCKTWITS: 0.6, // 60% weight - real-time social sentiment
  NEWS: 0.4, // 40% weight - news sentiment
} as const;

// Hype score thresholds
export const HYPE_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 50,
  HIGH: 70,
  EXTREME: 90,
} as const;

// Get hype level from score
export function getHypeLevel(
  score: number
): "low" | "medium" | "high" | "extreme" {
  if (score >= HYPE_THRESHOLDS.EXTREME) return "extreme";
  if (score >= HYPE_THRESHOLDS.HIGH) return "high";
  if (score >= HYPE_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

// Get momentum emoji (no emojis per user request, using text indicators)
export function getMomentumIndicator(
  momentum: "accelerating" | "stable" | "decelerating"
): string {
  switch (momentum) {
    case "accelerating":
      return "[UP]";
    case "decelerating":
      return "[DOWN]";
    default:
      return "[--]";
  }
}

// Common false positive tickers to filter out
export const TICKER_BLACKLIST = new Set([
  "I",
  "A",
  "CEO",
  "IPO",
  "ETF",
  "DD",
  "YOLO",
  "FOMO",
  "IMO",
  "ATH",
  "EOD",
  "PM",
  "AM",
  "US",
  "UK",
  "GDP",
  "SEC",
  "FDA",
  "EPS",
  "PE",
  "PS",
  "PB",
  "ROI",
  "ROE",
  "GAAP",
  "YOY",
  "QOQ",
  "MOM",
  "WSB",
  "NYSE",
  "NASDAQ",
  "SP",
  "DOW",
  "CPI",
  "PPI",
  "NFP",
  "FOMC",
  "FED",
  "IV",
  "DTE",
  "OTM",
  "ITM",
  "ATM",
  "LEAPS",
  "CSP",
  "CC",
  "TA",
  "FA",
  "MA",
  "RSI",
  "MACD",
  "EMA",
  "SMA",
  "VWAP",
  "LOL",
  "WTF",
  "OMG",
  "FYI",
  "TBH",
  "IMO",
  "IIRC",
  "AFAIK",
  "TL",
  "DR",
  "PS",
  "FYI",
]);

// WSB-style slang for sentiment detection
export const BULLISH_TERMS = [
  "moon",
  "rocket",
  "tendies",
  "calls",
  "yolo",
  "buy",
  "long",
  "bullish",
  "squeeze",
  "diamond hands",
  "apes",
  "strong",
  "breakout",
  "rip",
  "send it",
  "free money",
  "to the moon",
  "LFG",
  "lambo",
  "printing",
  "ATH",
  "bull",
  "pump",
  "mooning",
  "green",
  "gains",
  "winner",
  "undervalued",
];

export const BEARISH_TERMS = [
  "puts",
  "short",
  "dump",
  "crash",
  "sell",
  "bear",
  "GUH",
  "bag",
  "loss",
  "drill",
  "tank",
  "fade",
  "rug pull",
  "overvalued",
  "bubble",
  "RIP",
  "paper hands",
  "bagholder",
  "margin call",
  "loss porn",
  "red",
  "bleeding",
  "crater",
  "plunge",
];

// Legal disclaimer
export const DISCLAIMER = `This is sentiment-based analysis, not financial advice. Social media hype does not guarantee price movement. Always do your own due diligence and consider consulting a licensed financial advisor.`;

// Joel's personality traits for the chat system prompt
export const JOEL_SYSTEM_PROMPT = `You are Joel, a sentiment-driven trading assistant for "Joel the HypeTrader" by Lupin.

Your personality:
- You're a confident Wall Street trader who's seen some things
- You're also kind of a degenerate in the best way - you've made some questionable plays but somehow keep winning
- You speak directly and don't sugarcoat, but you're not reckless
- You reference specific sentiment data (mention counts, bullish %, momentum)
- You suggest specific strategies: buy shares, hold, watch, or stay away
- You understand that high social media hype can indicate momentum BUT also potential tops
- NO EMOJIS. Ever. You're too cool for that.

Your speaking style examples:
- "Listen, this ticker is absolutely cooking right now. StockTwits is going nuts."
- "I've been wrong before, but I'm not wrong about this one. The sentiment is through the roof."
- "Look, I get it, everyone's excited. But when everyone's bullish, that's when I start getting nervous."
- "The hype is real, but don't go all in like some kind of degenerate... that's my job."
- "News sentiment is mid, but the social buzz is undeniable. Proceed with caution."

CRITICAL RULES:
- ALWAYS end trade suggestions with the disclaimer about this being sentiment-based analysis
- NEVER suggest going "all in" on anything
- NEVER auto-execute trades - only suggest
- When hype is extremely high (>90) and accelerating, warn about potential blow-off top risk
- Be honest when you don't have strong conviction - "I'd sit this one out" is valid advice
- Default to paper trading context`;
