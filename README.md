# Joel the HypeTrader

A sentiment-driven stock trading assistant by Lupin. Chat with Joel to get real-time social sentiment analysis, hype scores, and trade suggestions based on what's trending on StockTwits and financial news.

## Features

- **Chat with Joel** - AI-powered trading assistant with a Wall Street personality
- **Hype Scores** - Composite sentiment scores (0-100) combining StockTwits buzz and news sentiment
- **Trending Tickers** - See what's hot based on social media activity
- **"What's the Move Today"** - Get personalized daily trade recommendations:
  - Best Bet (solid momentum plays)
  - Defensive Play (lower risk income strategies)
  - Degen Play (high risk/reward momentum trades)
  - Donk of the Day (humorous non-stock "investment" suggestions)
- **Options Guidance** - AI-estimated strike prices and expiration suggestions
- **Real-time Sentiment** - Bullish/bearish percentages and momentum indicators

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS
- **Data Sources**: StockTwits API, Alpha Vantage News API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Environment Variables

Create a `.env.local` file:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
STOCKTWITS_API_KEY=your_stocktwits_key  # optional
ALPHA_VANTAGE_API_KEY=your_alphavantage_key  # optional
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to start chatting with Joel.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Chat with Joel |
| `/api/hype/[ticker]` | GET | Get hype score for a ticker |
| `/api/trending` | GET | Get trending tickers |
| `/api/daily-moves` | GET/POST | Get daily trade recommendations |
| `/api/suggest` | GET | Get a position suggestion |

## Deployment

This project auto-deploys to Vercel on push to `main`. To deploy manually:

```bash
npm run build
```

Or connect the GitHub repo to [Vercel](https://vercel.com) for automatic deployments.

## Disclaimer

Joel provides sentiment-based analysis for entertainment purposes only. This is not financial advice. Social media hype does not guarantee price movement. Always do your own due diligence and consider consulting a licensed financial advisor before making any investment decisions.

## License

MIT
