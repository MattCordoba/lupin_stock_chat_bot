# CLAUDE.md - Project Guidelines for AI Assistants

## Project Overview
Joel the HypeTrader - A sentiment-driven stock trading assistant powered by Google Gemini AI.

## Pre-Commit Rules

**IMPORTANT: Before committing to main, always run the test suite:**

```bash
npm test
```

This runs the chat API test to verify:
- The API endpoint is responding
- Model fallback is working (tries gemini-2.0-flash, falls back to gemini-2.5-flash or gemini-2.0-flash-lite on rate limit)
- Response format is correct (streaming format: `0:"text"`)

Do NOT commit to main if tests fail.

## Key Files

- `src/app/api/chat/route.ts` - Main chat API with Gemini model fallback
- `src/lib/constants.ts` - Joel's system prompt and configuration
- `src/components/ChatMessage.tsx` - Chat UI with markdown rendering
- `scripts/test-chat.sh` - API test script

## Architecture Notes

### Model Fallback
The chat API tries models in order until one succeeds:
1. `gemini-2.0-flash` (primary - higher rate limits)
2. `gemini-2.5-flash`
3. `gemini-2.0-flash-lite`

### Response Format
The API returns a streaming format: `0:"response text here"\n`

### Rate Limiting
When all models are rate limited, returns 429 with `rateLimited: true` in the response body.

## Common Commands

```bash
npm run dev      # Start dev server (usually port 3001 if 3000 is in use)
npm run build    # Build for production
npm test         # Run API tests
npm run lint     # Run ESLint
```

## Testing Locally

1. Start the dev server: `npm run dev`
2. Run tests: `npm test`
3. Or test manually: `curl -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hi"}]}'`
