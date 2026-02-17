"use client";

import Image from "next/image";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  isRateLimited?: boolean;
}

export function ChatMessage({ role, content, isLoading, isRateLimited }: ChatMessageProps) {
  const isJoel = role === "assistant";

  return (
    <div className={`flex ${isJoel ? "justify-start" : "justify-end"} mb-4`}>
      {isJoel && (
        <div className="flex-shrink-0 mr-3">
          <Image
            src="/joel.jpg"
            alt="Joel"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border-2 border-gold-500/50"
          />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isJoel
            ? "bg-dark-800 border border-dark-700 rounded-tl-sm"
            : "gold-gradient text-dark-900 rounded-tr-sm"
        }`}
      >
        {isJoel && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gold-400">Joel</span>
          </div>
        )}
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isJoel ? "text-gray-200" : "text-dark-900"
          }`}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
              <span
                className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
            </span>
          ) : isRateLimited ? (
            <div className="flex items-center gap-2 text-amber-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Waiting on more AI credits. Give me a moment...</span>
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}
