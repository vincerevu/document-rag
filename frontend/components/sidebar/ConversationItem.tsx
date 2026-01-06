"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import type { Conversation } from "@/types";

interface Props {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export default function ConversationItem({
  conversation,
  active,
  onClick,
  onDelete,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left group transition-colors ${
        active ? "bg-primary/10 text-primary" : "hover:bg-muted"
      }`}
    >
      <MessageSquare size={16} className="shrink-0" />
      <span className="truncate flex-1">{conversation.title}</span>
      <span
        role="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1"
      >
        <Trash2 size={14} />
      </span>
    </button>
  );
}
