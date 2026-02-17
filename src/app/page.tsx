"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { HypeScoreCard } from "@/components/HypeScoreCard";
import { TickerRow } from "@/components/TickerRow";
import { SuggestionCard } from "@/components/SuggestionCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TrendingTicker, HypeScore, PositionSuggestion } from "@/lib/types";

export default function Dashboard() {
  const [mostHyped, setMostHyped] = useState<HypeScore | null>(null);
  const [trending, setTrending] = useState<TrendingTicker[]>([]);
  const [suggestion, setSuggestion] = useState<PositionSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [trendingRes, suggestRes] = await Promise.all([
        fetch("/api/trending?limit=10"),
        fetch("/api/suggest?risk=moderate"),
      ]);

      const trendingData = await trendingRes.json();
      const suggestData = await suggestRes.json();

      setTrending(trendingData.tickers || []);
      setLastUpdated(trendingData.lastUpdated);

      // Get most hyped ticker details
      if (trendingData.tickers && trendingData.tickers.length > 0) {
        const topTicker = trendingData.tickers[0].ticker;
        const hypeRes = await fetch(`/api/hype/${topTicker}`);
        const hypeData = await hypeRes.json();
        setMostHyped(hypeData);
      }

      if (!suggestData.error) {
        setSuggestion(suggestData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome section */}
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <Image
                src="/lupin-logo.png"
                alt="Lupin Logo"
                width={48}
                height={48}
              />
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400">
                  Your daily dose of market sentiment
                </p>
              </div>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                <button
                  onClick={fetchDashboardData}
                  className="ml-4 text-gold-400 hover:underline"
                >
                  Refresh
                </button>
              </p>
            )}
          </section>

          {loading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner
                size="lg"
                text="Joel is gathering the latest sentiment data..."
              />
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main content - 2 columns */}
              <div className="lg:col-span-2 space-y-8">
                {/* Most Hyped */}
                {mostHyped && (
                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-gold-400">*</span>
                      Most Hyped Right Now
                    </h2>
                    <HypeScoreCard
                      ticker={mostHyped.ticker}
                      hypeScore={mostHyped.hypeScore}
                      momentum={mostHyped.momentum}
                      summary={mostHyped.summary}
                    />
                  </section>
                )}

                {/* Top Trending */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <span className="text-gold-400">*</span>
                      Trending Tickers
                    </h2>
                    <Link
                      href="/trending"
                      className="text-sm text-gold-400 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  {trending.length > 0 ? (
                    <div className="space-y-3">
                      {trending.slice(0, 5).map((ticker) => (
                        <TickerRow key={ticker.ticker} ticker={ticker} />
                      ))}
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-6 text-center">
                      <p className="text-gray-400">
                        No trending data available. Try again in a moment.
                      </p>
                    </div>
                  )}
                </section>
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-8">
                {/* Joel's Top Pick */}
                {suggestion && (
                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-gold-400">*</span>
                      Joel&apos;s Take
                    </h2>
                    <SuggestionCard suggestion={suggestion} />
                  </section>
                )}

                {/* Quick Actions */}
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-gold-400">*</span>
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <Link
                      href="/chat"
                      className="block glass rounded-lg p-4 hover:border-gold-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-dark-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            Ask Joel anything
                          </p>
                          <p className="text-sm text-gray-400">
                            Get personalized insights
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/trending"
                      className="block glass rounded-lg p-4 hover:border-gold-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-dark-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            Explore trending
                          </p>
                          <p className="text-sm text-gray-400">
                            See all hyped tickers
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </section>

                {/* Joel Quote */}
                <div className="glass rounded-xl p-6">
                  <p className="text-gray-300 italic mb-3">
                    &quot;Listen, I&apos;ve been in this game long enough to know
                    that sentiment moves markets. Let me show you where the
                    action is.&quot;
                  </p>
                  <p className="text-gold-400 font-medium text-sm">— Joel</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/lupin-logo.png"
                alt="Lupin Logo"
                width={24}
                height={24}
              />
              <span className="text-gray-400 text-sm">Built by Lupin</span>
            </div>
            <p className="text-gray-500 text-xs text-center">
              Sentiment-based analysis only. Not financial advice. Always do
              your own research.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
