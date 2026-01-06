"use client";

import { User, Bot } from "lucide-react";
import type { Message } from "@/types";
import SourceCard from "./SourceCard";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot size={18} className="text-primary" />
        </div>
      )}
      <div className={`max-w-[75%] space-y-2 ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted"
          }`}
        >
          <p className={`text-sm whitespace-pre-wrap ${isStreaming ? "typing-cursor" : ""}`}>
            {message.content}
          </p>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.sources.map((src, i) => (
              <SourceCard key={i} source={src} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <User size={18} className="text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
