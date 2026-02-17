import { JOEL_SYSTEM_PROMPT } from "@/lib/constants";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Models to try in order of preference
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
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
): Promise<{ success: boolean; data?: GeminiResponse; responseText?: string; rateLimited?: boolean }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const rawText = await response.text();

    let data: GeminiResponse;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Check if it's an HTML error page (rate limit)
      if (rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
        console.log(`Model ${model} returned HTML (likely rate limited)`);
        return { success: false, rateLimited: true };
      }
      throw new Error("Failed to parse response");
    }

    // Check for rate limit
    if (isRateLimitError(data, rawText)) {
      console.log(`Model ${model} is rate limited`);
      return { success: false, rateLimited: true };
    }

    // Check for other errors
    if (data.error) {
      console.error(`Model ${model} error:`, data.error.message);
      return { success: false, rateLimited: false };
    }

    // Extract response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      console.log(`Model ${model} returned empty response`);
      return { success: false, rateLimited: false };
    }

    console.log(`Successfully got response from ${model}`);
    return { success: true, data, responseText };
  } catch (error) {
    console.error(`Error with model ${model}:`, error);
    return { success: false, rateLimited: false };
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

    for (const model of GEMINI_MODELS) {
      const result = await tryGeminiModel(model, requestBody);

      if (result.success && result.responseText) {
        responseText = result.responseText;
        break;
      }

      if (!result.rateLimited) {
        allRateLimited = false;
      }
    }

    // If no model succeeded
    if (!responseText) {
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
        JSON.stringify({ error: "Failed to get response from any model" }),
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
