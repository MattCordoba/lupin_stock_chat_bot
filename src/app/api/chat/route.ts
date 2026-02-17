import { JOEL_SYSTEM_PROMPT } from "@/lib/constants";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
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

    // Add system instruction as first user message if needed
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      // Check if it's an HTML error page
      if (rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
        return new Response(
          JSON.stringify({
            error: "API returned HTML instead of JSON - likely rate limited",
            rateLimited: true,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      throw parseError;
    }

    // Check for rate limit errors
    if (data.error) {
      const errorMessage = data.error.message || "";
      const isRateLimited =
        data.error.code === 429 ||
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
        JSON.stringify({ error: data.error.message || "API error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract the response text
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response. Try again in a moment.";

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
