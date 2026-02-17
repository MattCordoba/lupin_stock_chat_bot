import { JOEL_SYSTEM_PROMPT } from "@/lib/constants";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Models to try in order of preference
// Verified available via Google AI API ListModels
// Using 2.0-flash as primary due to higher rate limits (RPD)
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
  };
}

/**
 * Check if an error indicates rate limiting
 */
function isRateLimitError(data: GeminiResponse | null, rawText?: string): boolean {
  if (rawText?.includes("<!DOCTYPE") || rawText?.includes("<html")) {
    return true;
  }
  if (!data?.error) return false;

  const errorMessage = data.error.message || "";
  return (
    data.error.code === 429 ||
    errorMessage.includes("quota") ||
    errorMessage.includes("RESOURCE_EXHAUSTED") ||
    errorMessage.includes("rate limit")
  );
}

/**
 * Try to get a response from a specific Gemini model
 */
async function tryGeminiModel(
  model: string,
  requestBody: object
): Promise<{ success: boolean; data?: GeminiResponse; responseText?: string; rateLimited?: boolean; error?: string }> {
  try {
    console.log(`Trying model: ${model}`);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    console.log(`Model ${model} response status: ${response.status}`);
    const rawText = await response.text();
    console.log(`Model ${model} raw response length: ${rawText.length}`);

    let data: GeminiResponse;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Check if it's an HTML error page (rate limit)
      if (rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
        console.log(`Model ${model} returned HTML (likely rate limited)`);
        return { success: false, rateLimited: true };
      }
      console.error(`Model ${model} returned unparseable response:`, rawText.substring(0, 200));
      return { success: false, rateLimited: false, error: "Unparseable response" };
    }

    // Check for rate limit
    if (isRateLimitError(data, rawText)) {
      console.log(`Model ${model} is rate limited`);
      return { success: false, rateLimited: true };
    }

    // Check for other errors
    if (data.error) {
      console.error(`Model ${model} error:`, data.error.code, data.error.message);
      return { success: false, rateLimited: false, error: data.error.message };
    }

    // Extract response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      console.log(`Model ${model} returned empty response, candidates:`, JSON.stringify(data.candidates));
      return { success: false, rateLimited: false, error: "Empty response" };
    }

    console.log(`Successfully got response from ${model}, length: ${responseText.length}`);
    return { success: true, data, responseText };
  } catch (error) {
    console.error(`Exception with model ${model}:`, error);
    return { success: false, rateLimited: false, error: String(error) };
  }
}

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages } = await request.json() as { messages: Message[] };

    // Build the conversation for Gemini API
    const contents = messages.map((m: Message) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: JOEL_SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
      },
    };

    // Try each model in order until one succeeds
    let responseText: string | undefined;
    let allRateLimited = true;
    let lastError: string | undefined;

    for (const model of GEMINI_MODELS) {
      const result = await tryGeminiModel(model, requestBody);

      if (result.success && result.responseText) {
        responseText = result.responseText;
        break;
      }

      if (!result.rateLimited) {
        allRateLimited = false;
      }

      if (result.error) {
        lastError = result.error;
      }
    }

    // If no model succeeded
    if (!responseText) {
      console.error("All models failed. Last error:", lastError, "All rate limited:", allRateLimited);

      if (allRateLimited) {
        return new Response(
          JSON.stringify({
            error: "All models are rate limited - please try again later",
            rateLimited: true,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Failed to get response: ${lastError || "Unknown error"}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return as a simple text stream format for the frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the text in the format the frontend expects: 0:"text"
        controller.enqueue(encoder.encode(`0:${JSON.stringify(responseText)}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    console.error("Error in chat API:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimited =
      errorMessage.includes("429") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("RESOURCE_EXHAUSTED");

    if (isRateLimited) {
      return new Response(
        JSON.stringify({
          error: "Rate limited - waiting on more AI credits",
          rateLimited: true,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
