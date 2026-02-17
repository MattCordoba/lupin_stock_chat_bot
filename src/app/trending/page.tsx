"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TickerRow } from "@/components/TickerRow";
import { HypeScoreCard } from "@/components/HypeScoreCard";
import { SuggestionCard } from "@/components/SuggestionCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TrendingTicker, HypeScore, PositionSuggestion } from "@/lib/types";

export default function TrendingPage() {
  const [trending, setTrending] = useState<TrendingTicker[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [tickerDetails, setTickerDetails] = useState<HypeScore | null>(null);
  const [suggestion, setSuggestion] = useState<PositionSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  async function fetchTrending() {
    try {
      setLoading(true);
      const response = await fetch("/api/trending?limit=15");
      const data = await response.json();
      setTrending(data.tickers || []);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTickerClick(ticker: string) {
    setSelectedTicker(ticker);
    setDetailsLoading(true);
    setTickerDetails(null);
    setSuggestion(null);

    try {
      const [hypeRes, suggestRes] = await Promise.all([
        fetch(`/api/hype/${ticker}`),
        fetch(`/api/suggest?ticker=${ticker}&risk=moderate`),
      ]);

      const hypeData = await hypeRes.json();
      const suggestData = await suggestRes.json();

      setTickerDetails(hypeData);
      setSuggestion(suggestData);
    } catch (error) {
      console.error("Error fetching ticker details:", error);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Trending Tickers
            </h1>
            <p className="text-gray-400">
              Stocks ranked by social media hype and sentiment momentum.
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ticker list */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner size="lg" text="Loading trending tickers..." />
                </div>
              ) : trending.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-gray-400 mb-4">
                    No trending data available right now. This could be due to
                    API rate limits.
                  </p>
                  <button
                    onClick={fetchTrending}
                    className="px-4 py-2 gold-gradient text-dark-900 rounded-lg font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trending.map((ticker) => (
                    <TickerRow
                      key={ticker.ticker}
                      ticker={ticker}
                      onClick={() => handleTickerClick(ticker.ticker)}
                    />
                  ))}
                </div>
              )}

              {/* Refresh button */}
              {!loading && trending.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={fetchTrending}
                    className="text-sm text-gray-400 hover:text-gold-400 transition-colors"
                  >
                    Refresh data
                  </button>
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              {selectedTicker ? (
                <div className="space-y-6 sticky top-24">
                  {detailsLoading ? (
                    <div className="glass rounded-xl p-8 flex justify-center">
                      <LoadingSpinner text="Loading details..." />
                    </div>
                  ) : (
                    <>
                      {tickerDetails && (
                        <HypeScoreCard
                          ticker={tickerDetails.ticker}
                          hypeScore={tickerDetails.hypeScore}
                          momentum={tickerDetails.momentum}
                          summary={tickerDetails.summary}
                        />
                      )}
                      {suggestion && <SuggestionCard suggestion={suggestion} />}
                    </>
                  )}
                </div>
              ) : (
                <div className="glass rounded-xl p-8 text-center sticky top-24">
                  <p className="text-gray-400">
                    Click on a ticker to see details and Joel&apos;s suggestion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
