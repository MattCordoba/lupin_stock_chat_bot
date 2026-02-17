#!/bin/bash
# Simple test script for the chat API

BASE_URL="${1:-http://localhost:3001}"

echo "Testing chat API at $BASE_URL"
echo "================================"

# Test 1: Simple greeting
echo -e "\nTest 1: Simple greeting"
response=$(curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}')

if echo "$response" | grep -q "^0:"; then
  echo "✓ PASS - Got valid response"
  echo "Response: $(echo "$response" | head -c 100)..."
elif echo "$response" | grep -q "rateLimited"; then
  echo "⚠ RATE LIMITED - API quota exceeded"
else
  echo "✗ FAIL - Unexpected response"
  echo "Response: $response"
  exit 1
fi

# Test 2: Check model fallback logging
echo -e "\nTest 2: Verify API returns proper format"
if echo "$response" | grep -qE '^0:".*"'; then
  echo "✓ PASS - Response is in correct stream format (0:\"...\")"
else
  echo "⚠ WARNING - Response format may be incorrect"
fi

echo -e "\n================================"
echo "Tests complete"
