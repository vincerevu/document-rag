"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }
  };

  return (
    <div className="flex items-end gap-2 border border-border rounded-2xl bg-card px-4 py-2 shadow-sm hover:border-muted-foreground/40 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask a question..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[24px] max-h-[150px] py-1"
      />
      {text.length > 0 && (
        <span className="text-xs text-muted-foreground self-end pb-1.5 shrink-0">
          {text.length}
        </span>
      )}
      <button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        className={`p-2 rounded-xl transition-colors shrink-0 ${
          text.trim()
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground"
        } disabled:opacity-40`}
      >
        <Send size={18} />
      </button>
    </div>
  );
}
