"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ChatMessage } from "@/components/ChatMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isRateLimited?: boolean;
}

const quickPrompts = [
  { label: "What's the move?", prompt: "What's the move today?" },
  { label: "What's hot?", prompt: "What are the most hyped stocks right now?" },
  {
    label: "Top pick",
    prompt: "What's your top trade suggestion today?",
  },
  {
    label: "Risk check",
    prompt:
      "I'm looking for a conservative play. What do you suggest?",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowQuickPrompts(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // Check for rate limit or other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const isRateLimited = errorData.rateLimited || response.status === 429;

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isRateLimited
            ? ""
            : "Sorry, I had trouble processing that. Give me a second and try again.",
          isRateLimited,
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse the AI SDK stream format (lines starting with 0:)
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Extract the text content from the format 0:"text"
            const jsonContent = line.slice(2);
            try {
              const text = JSON.parse(jsonContent);
              if (typeof text === "string") {
                assistantContent += text;
              }
            } catch {
              // Not valid JSON, might be partial, skip
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: assistantContent }
              : m
          )
        );
      }

      // If we got no content after streaming, show rate limit message
      if (!assistantContent.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: "", isRateLimited: true }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I had trouble processing that. Give me a second and try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setShowQuickPrompts(false);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="pt-20 pb-32 max-w-3xl mx-auto px-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <Image
                src="/joel.jpg"
                alt="Joel"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-4 border-gold-500/50"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Chat with <span className="text-gold-400">Joel</span>
            </h1>
            <p className="text-gray-400 mb-8">
              Ask me about any stock&apos;s hype, trending tickers, or get trade
              suggestions based on social sentiment.
            </p>

            {/* Quick prompts */}
            {showQuickPrompts && (
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {quickPrompts.map((qp, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(qp.prompt)}
                    className="glass rounded-lg px-4 py-3 text-left hover:border-gold-500/50 transition-colors"
                  >
                    <span className="text-sm text-gold-400 font-medium">
                      {qp.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isRateLimited={message.isRateLimited}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <ChatMessage role="assistant" content="" isLoading={true} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-dark-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Joel about a stock..."
              className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 gold-gradient text-dark-900 font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Joel provides sentiment-based analysis only. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
