// Position Suggester - Strategy selection based on hype and sentiment

import { DISCLAIMER, getHypeLevel } from "@/lib/constants";
import { HypeScore, PositionSuggestion } from "@/lib/types";
import { getHypeScore } from "./hypeEngine";

type RiskTolerance = "conservative" | "moderate" | "aggressive";

/**
 * Generate a position suggestion based on hype score and risk tolerance
 */
export async function suggestPosition(
  ticker: string,
  riskTolerance: RiskTolerance = "moderate",
  maxCapital?: number
): Promise<PositionSuggestion> {
  const hype = await getHypeScore(ticker);

  const level = getHypeLevel(hype.hypeScore);
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
