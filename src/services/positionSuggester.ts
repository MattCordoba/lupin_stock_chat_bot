// Position Suggester - Strategy selection based on hype and sentiment

import { DISCLAIMER } from "@/lib/constants";
import {
  PositionSuggestion,
  OptionsEstimate,
  DailyMoveRecommendation,
  DailyMovesResponse,
  PlayCategory,
} from "@/lib/types";
import { getHypeScore } from "./hypeEngine";

type RiskTolerance = "conservative" | "moderate" | "aggressive";

// Donk suggestions pool
const DONK_SUGGESTIONS = [
  "Buy 47 cases of Monster Energy and flip them at a music festival",
  "Acquire a struggling car wash and rename it 'Tendies & Suds'",
  "Corner the market on 1st edition Charizards",
  "Sell your Magic: The Gathering collection (finally)",
  "Invest in a taco truck outside the SEC building",
  "Start a GoFundMe for your trading losses",
  "Buy vintage Air Jordans and hold for the cultural appreciation",
  "Hoard Pokemon cards from Costco like it's a hedge fund strategy",
  "Put it all in a vending machine empire",
  "Become a part-owner of a struggling minor league baseball team",
  "Buy every Beanie Baby on eBay - they're due for a comeback",
  "Start a premium Discord server for 'trading alpha'",
  "Invest in a hot dog cart near Wall Street",
  "Corner the market on vintage Pyrex bowls",
  "Buy a storage unit at auction - what could go wrong?",
];

/**
 * Estimate options details based on current price and strategy direction
 */
export function estimateOptionsDetails(
  currentPrice: number | undefined,
  direction: "bullish" | "bearish" | "neutral",
  timeframe: "short" | "medium" | "long" = "medium"
): OptionsEstimate {
  const price = currentPrice || 100; // fallback for estimation

  let suggestedStrike: string;
  let suggestedExpiry: string;
  let notes: string;

  if (direction === "bullish") {
    const strikePrice = Math.round(price * 1.05); // 5% OTM
    suggestedStrike = `~$${strikePrice} (5% OTM)`;
    suggestedExpiry =
      timeframe === "short"
        ? "1-2 weeks out"
        : timeframe === "medium"
        ? "2-3 weeks out"
        : "4-6 weeks out";
    notes = "Slightly OTM calls capture upside while limiting premium cost";
  } else if (direction === "bearish") {
    const strikePrice = Math.round(price * 0.95); // 5% OTM puts
    suggestedStrike = `~$${strikePrice} (5% OTM)`;
    suggestedExpiry =
      timeframe === "short"
        ? "1-2 weeks out"
        : timeframe === "medium"
        ? "2-4 weeks out"
        : "4-6 weeks out";
    notes = "OTM puts for hedging or bearish bets";
  } else {
    // Neutral - typically for premium selling strategies
    const putStrike = Math.round(price * 0.9); // 10% OTM for CSPs
    suggestedStrike = `~$${putStrike} (10% below current)`;
    suggestedExpiry = "4-6 weeks out";
    notes = "Collect premium while waiting for a better entry point";
  }

  return {
    direction,
    suggestedStrike,
    suggestedExpiry,
    notes,
  };
}

/**
 * Get a random donk suggestion
 */
export function getRandomDonkSuggestion(): string {
  return DONK_SUGGESTIONS[Math.floor(Math.random() * DONK_SUGGESTIONS.length)];
}

/**
 * Generate daily move recommendations based on trending tickers
 */
export async function getDailyMoves(
  userPositions?: string[]
): Promise<DailyMovesResponse> {
  const { getTrendingTickers, getHypeScore } = await import("./hypeEngine");

  const trending = await getTrendingTickers(10);
  const recommendations: DailyMoveRecommendation[] = [];

  // Sort tickers into categories based on their characteristics
  const bestBetCandidates = trending.filter(
    (t) =>
      t.hypeScore >= 60 &&
      t.hypeScore <= 85 &&
      (t.momentum === "accelerating" || t.momentum === "stable") &&
      t.bullishPercent >= 65
  );

  const defensiveCandidates = trending.filter(
    (t) => t.hypeScore >= 40 && t.hypeScore <= 60 && t.momentum === "stable"
  );

  const degenCandidates = trending.filter(
    (t) => t.hypeScore >= 80 && t.momentum === "accelerating"
  );

  // Get detailed hype data for top candidates
  const addRecommendation = async (
    ticker: string,
    category: PlayCategory,
    hypeScore: number,
    momentum: "accelerating" | "stable" | "decelerating",
    bullishPercent: number
  ) => {
    const hype = await getHypeScore(ticker);

    let strategy: string;
    let strategyType: PositionSuggestion["strategyType"];
    let rationale: string;
    let risk: string;
    let optionsDetails: OptionsEstimate | undefined;

    switch (category) {
      case "best_bet":
        strategy =
          "Buy shares OR buy calls (2-3 weeks out, ~5% OTM)";
        strategyType = "buy_calls";
        optionsDetails = estimateOptionsDetails(
          hype.currentPrice,
          "bullish",
          "medium"
        );
        rationale = `Strong momentum with ${bullishPercent}% bullish sentiment. Social volume is elevated but not overheated.`;
        risk = "Momentum could stall if sentiment shifts";
        break;

      case "defensive":
        strategy =
          "Sell cash-secured puts (4-6 weeks out, ~10% OTM) OR buy shares with tight stop";
        strategyType = "sell_cash_secured_puts";
        optionsDetails = estimateOptionsDetails(
          hype.currentPrice,
          "neutral",
          "long"
        );
        rationale = `Stable sentiment at ${bullishPercent}% bullish. Collect premium or get a discount entry.`;
        risk = "Limited upside, but controlled downside";
        break;

      case "degen":
        strategy = "Buy calls (1-2 weeks out, ATM or slightly OTM)";
        strategyType = "buy_calls";
        optionsDetails = estimateOptionsDetails(
          hype.currentPrice,
          "bullish",
          "short"
        );
        rationale = `Maximum hype at ${hypeScore}/100. Social media is going absolutely bonkers. Pure momentum play.`;
        risk = "Could lose it all. This is gambling, not investing.";
        break;

      default:
        strategy = "N/A";
        strategyType = "no_trade";
        rationale = "N/A";
        risk = "N/A";
    }

    recommendations.push({
      category,
      ticker,
      hypeScore,
      momentum,
      bullishPercent,
      strategy,
      strategyType,
      rationale,
      risk,
      optionsDetails,
    });
  };

  // Add best bet (1-2)
  if (bestBetCandidates.length > 0) {
    const best = bestBetCandidates[0];
    await addRecommendation(
      best.ticker,
      "best_bet",
      best.hypeScore,
      best.momentum,
      best.bullishPercent
    );
  } else if (trending.length > 0) {
    // Fallback to top trending
    const fallback = trending[0];
    await addRecommendation(
      fallback.ticker,
      "best_bet",
      fallback.hypeScore,
      fallback.momentum,
      fallback.bullishPercent
    );
  }

  // Add defensive (1)
  if (defensiveCandidates.length > 0) {
    const defensive = defensiveCandidates[0];
    await addRecommendation(
      defensive.ticker,
      "defensive",
      defensive.hypeScore,
      defensive.momentum,
      defensive.bullishPercent
    );
  } else if (trending.length > 1) {
    // Use a lower-hype ticker as defensive
    const sorted = [...trending].sort((a, b) => a.hypeScore - b.hypeScore);
    const fallback = sorted[0];
    await addRecommendation(
      fallback.ticker,
      "defensive",
      fallback.hypeScore,
      fallback.momentum,
      fallback.bullishPercent
    );
  }

  // Add degen play (1)
  if (degenCandidates.length > 0) {
    const degen = degenCandidates[0];
    await addRecommendation(
      degen.ticker,
      "degen",
      degen.hypeScore,
      degen.momentum,
      degen.bullishPercent
    );
  } else if (trending.length > 0) {
    // Use highest hype as degen
    const sorted = [...trending].sort((a, b) => b.hypeScore - a.hypeScore);
    const fallback = sorted[0];
    await addRecommendation(
      fallback.ticker,
      "degen",
      fallback.hypeScore,
      fallback.momentum,
      fallback.bullishPercent
    );
  }

  // If user has positions, consider them for covered call suggestions
  if (userPositions && userPositions.length > 0) {
    // Check if any user positions are in trending
    for (const position of userPositions) {
      const ticker = position.toUpperCase();
      const inTrending = trending.find((t) => t.ticker === ticker);
      if (inTrending && inTrending.hypeScore >= 50) {
        // Could suggest covered calls on their position
        const hype = await getHypeScore(ticker);
        const optionsDetails = estimateOptionsDetails(
          hype.currentPrice,
          "bullish",
          "medium"
        );
        optionsDetails.notes =
          "Sell calls against your existing shares for income";

        // Add as alternative best bet if high sentiment
        if (inTrending.bullishPercent >= 60) {
          recommendations.push({
            category: "best_bet",
            ticker,
            hypeScore: inTrending.hypeScore,
            momentum: inTrending.momentum,
            bullishPercent: inTrending.bullishPercent,
            strategy:
              "Sell covered calls (2-4 weeks out, 5-8% OTM) against your position",
            strategyType: "sell_covered_calls",
            rationale: `You're already holding ${ticker}. Generate income by selling calls against it.`,
            risk: "Caps upside if stock moons",
            optionsDetails,
          });
        }
      }
    }
  }

  return {
    recommendations,
    donkSuggestion: getRandomDonkSuggestion(),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a position suggestion based on hype score and risk tolerance
 */
export async function suggestPosition(
  ticker: string,
  riskTolerance: RiskTolerance = "moderate",
  maxCapital?: number
): Promise<PositionSuggestion> {
  const hype = await getHypeScore(ticker);
  const { momentum, sentimentRatio } = hype;

  let strategy: string;
  let strategyType: PositionSuggestion["strategyType"];
  let rationale: string;
  let risks: string[];
  let confidenceLevel: PositionSuggestion["confidenceLevel"];

  // Decision tree based on hype score, momentum, and risk tolerance
  if (hype.hypeScore < 30) {
    // Low hype - no strong signal
    strategy = "No Trade - Low Interest";
    strategyType = "no_trade";
    rationale = `${ticker} isn't generating much social buzz right now. Without strong hype signals, there's no clear sentiment-driven entry point. I'd sit this one out and wait for more action.`;
    risks = ["Low liquidity periods", "Lack of momentum"];
    confidenceLevel = "low";
  } else if (hype.hypeScore >= 90 && momentum === "accelerating") {
    // Extreme hype and accelerating - potential blow-off top
    if (riskTolerance === "aggressive") {
      strategy = "Speculative Buy - Ride the Wave";
      strategyType = "buy_shares";
      rationale = `${ticker} is absolutely cooking with a ${hype.hypeScore} hype score and accelerating momentum. This is peak degen territory. If you're going to play this, use a tight stop loss because when the music stops, it stops fast.`;
      risks = [
        "Potential blow-off top imminent",
        "Extreme volatility expected",
        "Could reverse sharply",
        "FOMO-driven buying may be exhausted",
      ];
      confidenceLevel = "medium";
    } else {
      strategy = "Watch Only - Too Hot";
      strategyType = "watch";
      rationale = `Look, ${ticker} has a ${hype.hypeScore} hype score and it's still accelerating. Everyone and their grandma is bullish. That's exactly when I get nervous. This could keep running, but the risk-reward here isn't great for a new entry. If you're not already in, maybe wait for a pullback.`;
      risks = [
        "Likely near local top",
        "Risk of sharp reversal",
        "Late to the party",
      ];
      confidenceLevel = "high";
    }
  } else if (hype.hypeScore >= 70) {
    // High hype
    if (momentum === "accelerating") {
      if (riskTolerance === "conservative") {
        strategy = "Small Position - Scale In";
        strategyType = "buy_shares";
        rationale = `${ticker} has strong momentum at ${hype.hypeScore} hype and accelerating. For a conservative play, I'd take a small position here - maybe 25-30% of what you'd normally allocate - and see how it develops. Don't chase.`;
        risks = [
          "Momentum could stall",
          "Partial position may underperform if it keeps running",
        ];
        confidenceLevel = "medium";
      } else {
        strategy = "Buy - Momentum Play";
        strategyType = "buy_shares";
        rationale = `${ticker} is running hot at ${hype.hypeScore} with ${sentimentRatio.bullish}% bullish sentiment. The momentum is real. I'd get in here but set a stop at 5-8% below entry. Let winners run but protect your downside.`;
        risks = [
          "Chasing momentum",
          "Potential for quick reversal",
          "High volatility",
        ];
        confidenceLevel = "high";
      }
    } else if (momentum === "decelerating") {
      strategy = "Wait for Clarity";
      strategyType = "watch";
      rationale = `${ticker} still has a solid ${hype.hypeScore} hype score, but momentum is fading. Could be a pause before another leg up, or could be the start of a pullback. I'd wait for either: (1) momentum to pick back up, or (2) a better entry on a dip.`;
      risks = ["Trend reversal possible", "Dead cat bounce risk"];
      confidenceLevel = "medium";
    } else {
      strategy = "Buy - Steady Hype";
      strategyType = "buy_shares";
      rationale = `${ticker} has consistent interest at ${hype.hypeScore} hype score with stable momentum. This isn't the explosive setup, but it's a solid one. Good risk-reward for a position here.`;
      risks = ["Could consolidate", "Needs catalyst for next move"];
      confidenceLevel = "high";
    }
  } else if (hype.hypeScore >= 50) {
    // Medium hype
    if (momentum === "accelerating") {
      strategy = "Early Mover - Buy";
      strategyType = "buy_shares";
      rationale = `${ticker} is starting to pick up steam - ${hype.hypeScore} hype and climbing. This could be the early innings of a bigger move. I like getting in before the crowd shows up.`;
      risks = [
        "Hype may not sustain",
        "Could be false breakout",
        "Need to monitor closely",
      ];
      confidenceLevel = "medium";
    } else if (sentimentRatio.bullish >= 65) {
      strategy = "Accumulate - Bullish Setup";
      strategyType = "buy_shares";
      rationale = `${ticker} has moderate attention at ${hype.hypeScore} but sentiment is ${sentimentRatio.bullish}% bullish. The bulls are in control even if volume is moderate. Good spot to start building a position.`;
      risks = ["Low volume may persist", "Needs catalyst"];
      confidenceLevel = "medium";
    } else {
      strategy = "Hold/Watch";
      strategyType = "watch";
      rationale = `${ticker} is in no-man's land right now. ${hype.hypeScore} hype score isn't bad but nothing special. Sentiment is mixed. I'd either wait for a clearer signal or look elsewhere.`;
      risks = ["Sideways action likely", "No clear catalyst"];
      confidenceLevel = "low";
    }
  } else {
    // Low-medium hype (30-50)
    if (momentum === "accelerating") {
      strategy = "Speculative Watch";
      strategyType = "watch";
      rationale = `${ticker} is showing signs of life - hype is low at ${hype.hypeScore} but picking up. Could be early. Put it on your watchlist and see if this develops into something real.`;
      risks = [
        "Early signal may be noise",
        "Need confirmation",
        "Limited liquidity",
      ];
      confidenceLevel = "low";
    } else {
      strategy = "No Trade - Insufficient Signal";
      strategyType = "no_trade";
      rationale = `${ticker} just doesn't have the social momentum right now to generate a clear signal. Score of ${hype.hypeScore} isn't compelling. Save your powder for better setups.`;
      risks = ["Opportunity cost", "Dead money"];
      confidenceLevel = "low";
    }
  }

  // Add capital allocation note if provided
  if (maxCapital && strategyType === "buy_shares") {
    const positionSize =
      riskTolerance === "conservative"
        ? maxCapital * 0.25
        : riskTolerance === "moderate"
        ? maxCapital * 0.5
        : maxCapital * 0.75;

    rationale += ` With your ${maxCapital.toLocaleString()} budget, I'd allocate around ${positionSize.toLocaleString()} to this play.`;
  }

  return {
    ticker: ticker.toUpperCase(),
    hypeScore: hype.hypeScore,
    strategy,
    strategyType,
    rationale,
    confidenceLevel,
    risks,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Get the top suggestion based on current trending tickers
 */
export async function getTopSuggestion(
  riskTolerance: RiskTolerance = "moderate"
): Promise<PositionSuggestion | null> {
  // Import dynamically to avoid circular dependency
  const { getTrendingTickers } = await import("./hypeEngine");

  const trending = await getTrendingTickers(5);

  if (trending.length === 0) {
    return null;
  }

  // Find the best opportunity (highest hype with accelerating momentum)
  const best = trending.find((t) => t.momentum === "accelerating") || trending[0];

  return suggestPosition(best.ticker, riskTolerance);
}
