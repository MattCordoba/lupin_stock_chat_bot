"use client";

import { getHypeLevel } from "@/lib/constants";
import { TrendingTicker } from "@/lib/types";

interface TickerRowProps {
  ticker: TrendingTicker;
  onClick?: () => void;
}

export function TickerRow({ ticker, onClick }: TickerRowProps) {
  const level = getHypeLevel(ticker.hypeScore);

  const levelBg = {
    low: "bg-gray-600",
    medium: "bg-amber-500",
    high: "bg-green-500",
    extreme: "bg-red-500",
  };

  const momentumIndicator = {
    accelerating: { text: "[UP]", color: "text-green-400" },
    stable: { text: "[--]", color: "text-gray-400" },
    decelerating: { text: "[DOWN]", color: "text-red-400" },
  };

  return (
    <div
      onClick={onClick}
      className="glass rounded-lg p-4 card-hover cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Rank badge */}
          <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center">
            <span className="text-sm font-mono text-gray-400">
              {ticker.rank}
            </span>
          </div>

          {/* Ticker info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                {ticker.ticker}
              </span>
              <span
                className={`text-xs font-mono ${
                  momentumIndicator[ticker.momentum].color
                }`}
              >
                {momentumIndicator[ticker.momentum].text}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{ticker.mentionCount} mentions</span>
              <span>{ticker.bullishPercent}% bullish</span>
            </div>
          </div>
        </div>

        {/* Hype score */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${levelBg[level]} transition-all duration-300`}
              style={{ width: `${ticker.hypeScore}%` }}
            />
          </div>
          <span className="text-xl font-bold text-gold-400 w-8 text-right">
            {ticker.hypeScore}
          </span>
        </div>
      </div>
    </div>
  );
}
