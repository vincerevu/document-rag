"use client";

import { useRef, useEffect } from "react";
import { FileSearch, Lightbulb, GitCompareArrows, Sparkles } from "lucide-react";
import type { Message } from "@/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LoadingSpinner from "../ui/LoadingSpinner";

interface Props {
  messages: Message[];
  onSend: (message: string) => void;
  isLoading: boolean;
  streamingContent: string;
}

export default function ChatPanel({
  messages,
  onSend,
  isLoading,
  streamingContent,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="flex flex-col items-center gap-2">
              <Sparkles size={40} className="text-primary" strokeWidth={1.5} />
              <h2 className="text-xl font-semibold text-foreground">
                What would you like to explore?
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload documents, then ask questions about them
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                {
                  icon: FileSearch,
                  text: "Summarize my uploaded documents",
                  desc: "Get a concise overview of your data",
                },
                {
                  icon: Lightbulb,
                  text: "What are the key topics in my data?",
                  desc: "Discover themes and patterns",
                },
                {
                  icon: GitCompareArrows,
                  text: "Compare information across sources",
                  desc: "Find similarities and differences",
                },
              ].map((card) => (
                <button
                  key={card.text}
                  onClick={() => onSend(card.text)}
                  className="card-hover flex items-start gap-3 p-4 rounded-xl border border-border bg-card text-left hover:border-primary/40 transition-colors"
                >
                  <card.icon
                    size={20}
                    className="text-primary shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {card.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && streamingContent && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingContent,
              created_at: new Date().toISOString(),
            }}
            isStreaming
          />
        )}
        {isLoading && !streamingContent && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoadingSpinner size={16} />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-border">
        <ChatInput onSend={onSend} disabled={isLoading} />
      </div>
    </div>
  );
}
