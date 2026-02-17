import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { JOEL_SYSTEM_PROMPT } from "@/lib/constants";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      system: JOEL_SYSTEM_PROMPT,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
