"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Settings, BrainCircuit } from "lucide-react";
import type { Conversation, Message, Source } from "@/types";
import {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
} from "@/lib/api";
import { useWebSocket } from "@/lib/websocket";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import DataSourcesPanel from "@/components/documents/DataSourcesPanel";
import SettingsPanel from "@/components/settings/SettingsPanel";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ToastProvider, useToast } from "@/components/ui/Toast";

type Panel = "chat" | "docs";

function HomeContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [panel, setPanel] = useState<Panel>("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const ws = useWebSocket();
  const toast = useToast();

  // Load initial data
  useEffect(() => {
    listConversations().then(setConversations).catch(console.error);
  }, []);

  // Load conversation messages when active changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    getConversation(activeConvId)
      .then((detail) => setMessages(detail.messages))
      .catch(console.error);
  }, [activeConvId]);

  const refreshConversations = useCallback(() => {
    listConversations().then(setConversations).catch(console.error);
  }, []);

  const handleNewChat = useCallback(async () => {
    const conv = await createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    setPanel("chat");
  }, []);

  const handleDeleteConv = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    },
    [activeConvId]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "n") {
          e.preventDefault();
          handleNewChat();
        } else if (e.key === "d") {
          e.preventDefault();
          setPanel((p) => (p === "docs" ? "chat" : "docs"));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNewChat]);

  const handleSend = useCallback(
    async (text: string) => {
      let convId = activeConvId;
      if (!convId) {
        const conv = await createConversation(text.slice(0, 50));
        setConversations((prev) => [conv, ...prev]);
        convId = conv.id;
        setActiveConvId(convId);
      }

      // Add user message to UI
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setStreamingContent("");

      try {
        let fullContent = "";
        let sources: Source[] = [];

        await ws.sendMessage(convId, text, (event) => {
          if (event.type === "token" && event.content) {
            fullContent += event.content;
            setStreamingContent(fullContent);
          } else if (event.type === "sources" && event.sources) {
            sources = event.sources;
          }
        });

        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: fullContent,
          sources,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        refreshConversations();
      } catch (e) {
        console.error(e);
        toast.error("Failed to get a response. Please try again.");
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [activeConvId, ws, refreshConversations, toast]
  );



  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit size={24} className="text-primary" />
          <span className="font-bold text-lg">RAG Forge</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPanel(panel === "docs" ? "chat" : "docs")}
            className={`p-2 rounded-lg transition-colors ${
              panel === "docs"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
            title="Documents (⌘D)"
          >
            <FileText size={20} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={(id) => {
            setActiveConvId(id);
            setPanel("chat");
          }}
          onNew={handleNewChat}
          onDelete={handleDeleteConv}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-hidden">
          {panel === "chat" ? (
            <ChatPanel
              messages={messages}
              onSend={handleSend}
              isLoading={isLoading}
              streamingContent={streamingContent}
            />
          ) : (
            <DataSourcesPanel />
          )}
        </main>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
