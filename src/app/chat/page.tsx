"use client";

import { useChat } from "@ai-sdk/react";
import { Header } from "@/components/Header";
import { ChatMessage } from "@/components/ChatMessage";
import { useState } from "react";

const quickPrompts = [
  { label: "What's hot?", prompt: "What are the most hyped stocks right now?" },
  {
    label: "Top pick",
    prompt: "What's your top trade suggestion today?",
  },
  {
    label: "Check NVDA",
    prompt: "What's the hype score for NVDA? Should I buy?",
  },
  {
    label: "Risk check",
    prompt:
      "I'm looking for a conservative play. What do you suggest?",
  },
];

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });

  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const handleQuickPrompt = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as React.ChangeEvent<HTMLInputElement>);
    setShowQuickPrompts(false);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="pt-20 pb-32 max-w-3xl mx-auto px-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="text-center py-12">
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
              role={message.role as "user" | "assistant"}
              content={message.content}
            />
          ))}
          {isLoading && (
            <ChatMessage role="assistant" content="" isLoading={true} />
          )}
        </div>
      </main>

      {/* Input area - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-dark-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
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
