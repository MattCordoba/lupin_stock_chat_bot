"use client";

import { PositionSuggestion } from "@/lib/types";
import { getHypeLevel } from "@/lib/constants";

interface SuggestionCardProps {
  suggestion: PositionSuggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const level = getHypeLevel(suggestion.hypeScore);

  const strategyBadgeColors = {
    buy_shares: "bg-green-900/50 text-green-400 border-green-700",
    sell_shares: "bg-red-900/50 text-red-400 border-red-700",
    hold: "bg-amber-900/50 text-amber-400 border-amber-700",
    watch: "bg-blue-900/50 text-blue-400 border-blue-700",
    no_trade: "bg-gray-800/50 text-gray-400 border-gray-700",
  };

  const confidenceColors = {
    high: "text-green-400",
    medium: "text-amber-400",
    low: "text-gray-400",
  };

  const levelBg = {
    low: "hype-gradient-low",
    medium: "hype-gradient-medium",
    high: "hype-gradient-high",
    extreme: "hype-gradient-extreme",
  };

  return (
    <div className="glass rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-bold text-white">
              {suggestion.ticker}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                strategyBadgeColors[suggestion.strategyType]
              }`}
            >
              {suggestion.strategy}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Confidence:</span>
            <span
              className={`font-medium ${
                confidenceColors[suggestion.confidenceLevel]
              }`}
            >
              {suggestion.confidenceLevel.toUpperCase()}
            </span>
          </div>
        </div>
        <div
          className={`w-16 h-16 rounded-xl ${levelBg[level]} flex items-center justify-center`}
        >
          <span className="text-2xl font-bold text-white">
            {suggestion.hypeScore}
          </span>
        </div>
      </div>

      {/* Rationale */}
      <div className="mb-4">
        <p className="text-gray-300 leading-relaxed">{suggestion.rationale}</p>
      </div>

      {/* Risks */}
      {suggestion.risks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Risks</h4>
          <ul className="space-y-1">
            {suggestion.risks.map((risk, index) => (
              <li
                key={index}
                className="text-sm text-gray-500 flex items-start gap-2"
              >
                <span className="text-red-400">*</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="pt-4 border-t border-dark-700">
        <p className="text-xs text-gray-500 italic">{suggestion.disclaimer}</p>
      </div>
    </div>
  );
}
