"use client";

import { getHypeLevel } from "@/lib/constants";

interface HypeScoreCardProps {
  ticker: string;
  hypeScore: number;
  momentum: "accelerating" | "stable" | "decelerating";
  summary?: string;
  compact?: boolean;
}

export function HypeScoreCard({
  ticker,
  hypeScore,
  momentum,
  summary,
  compact = false,
}: HypeScoreCardProps) {
  const level = getHypeLevel(hypeScore);

  const levelColors = {
    low: "text-gray-400 border-gray-600",
    medium: "text-amber-400 border-amber-600",
    high: "text-green-400 border-green-600",
    extreme: "text-red-400 border-red-600",
  };

  const levelBg = {
    low: "hype-gradient-low",
    medium: "hype-gradient-medium",
    high: "hype-gradient-high",
    extreme: "hype-gradient-extreme",
  };

  const momentumText = {
    accelerating: "[UP]",
    stable: "[--]",
    decelerating: "[DOWN]",
  };

  const momentumColor = {
    accelerating: "text-green-400",
    stable: "text-gray-400",
    decelerating: "text-red-400",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-lg ${levelBg[level]} flex items-center justify-center`}
        >
          <span className="text-lg font-bold text-white">{hypeScore}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{ticker}</span>
            <span className={`text-xs font-mono ${momentumColor[momentum]}`}>
              {momentumText[momentum]}
            </span>
          </div>
          <span className={`text-xs ${levelColors[level].split(" ")[0]}`}>
            {level.charAt(0).toUpperCase() + level.slice(1)} Hype
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{ticker}</h3>
          <span className={`text-sm font-mono ${momentumColor[momentum]}`}>
            {momentumText[momentum]} {momentum}
          </span>
        </div>
        <div
          className={`w-20 h-20 rounded-xl ${levelBg[level]} flex items-center justify-center`}
        >
          <span className="text-3xl font-bold text-white">{hypeScore}</span>
        </div>
      </div>

      {/* Hype bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Hype Score</span>
          <span className={levelColors[level].split(" ")[0]}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        </div>
        <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${levelBg[level]} transition-all duration-500`}
            style={{ width: `${hypeScore}%` }}
          />
        </div>
      </div>

      {summary && <p className="text-sm text-gray-400">{summary}</p>}
    </div>
  );
}
