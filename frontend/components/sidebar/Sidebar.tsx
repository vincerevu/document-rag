"use client";

import { Plus, PanelLeftClose, PanelLeft, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types";
import ConversationItem from "./ConversationItem";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  collapsed,
  onToggle,
}: Props) {
  if (collapsed) {
    return (
      <div className="w-12 border-r border-border flex flex-col items-center py-3 gap-2">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={onNew}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-semibold text-sm">Chats</span>
        <div className="flex gap-1">
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="New Chat (⌘N)"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Collapse"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <MessageSquare size={24} strokeWidth={1.5} />
            <p className="text-xs text-center">No conversations yet</p>
          </div>
        )}
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            active={conv.id === activeId}
            onClick={() => onSelect(conv.id)}
            onDelete={() => onDelete(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}
