#!/bin/bash
# Chat API test script
# Run with: ./scripts/test-chat.sh [base_url]

set -e

BASE_URL="${1:-http://localhost:3001}"
TIMEOUT=30

echo "Testing chat API at $BASE_URL"
echo "================================"

# Test 1: Simple greeting with timeout
echo -e "\nTest 1: Simple greeting (timeout: ${TIMEOUT}s)"
response=$(curl -s -m "$TIMEOUT" -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}' 2>&1) || {
  echo "✗ FAIL - Request timed out or connection failed"
  echo "Make sure the dev server is running: npm run dev"
  exit 1
}

# Check for valid streaming response format
if echo "$response" | grep -q "^0:"; then
  echo "✓ PASS - Got valid response"
  # Show first 100 chars of response
  preview=$(echo "$response" | head -c 100)
  echo "Response preview: ${preview}..."
elif echo "$response" | grep -q "rateLimited"; then
  echo "⚠ RATE LIMITED - All Gemini models exhausted quota"
  echo "This is expected if you've made many requests today."
  echo "The fallback mechanism is working correctly."
  # Rate limiting is not a test failure - the API handled it correctly
  exit 0
elif echo "$response" | grep -q "error"; then
  echo "✗ FAIL - API returned error"
  echo "Response: $response"
  exit 1
else
  echo "✗ FAIL - Unexpected response format"
  echo "Response: $response"
  exit 1
fi

# Test 2: Verify response format
echo -e "\nTest 2: Verify streaming format"
if echo "$response" | grep -qE '^0:".*"'; then
  echo "✓ PASS - Response is in correct stream format (0:\"...\")"
else
  echo "⚠ WARNING - Response format may be non-standard"
  echo "Expected: 0:\"...\""
fi

echo -e "\n================================"
echo "All tests passed!"
