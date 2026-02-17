"use client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isJoel = role === "assistant";

  return (
    <div className={`flex ${isJoel ? "justify-start" : "justify-end"} mb-4`}>
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
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}
