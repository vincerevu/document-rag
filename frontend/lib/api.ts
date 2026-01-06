import type {
  Conversation,
  ConversationDetail,
  Connector,
  Document,
  Settings,
  ChatResponse,
} from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

// Chat
export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  return fetchJSON("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });
}

// Documents
export async function uploadDocuments(files: File[]): Promise<Document[]> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${API}/api/documents/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function ingestURL(url: string, deepCrawl = false): Promise<Document> {
  return fetchJSON("/api/documents/url", {
    method: "POST",
    body: JSON.stringify({ url, deep_crawl: deepCrawl }),
  });
}

export async function listDocuments(): Promise<Document[]> {
  return fetchJSON("/api/documents");
}

export async function deleteDocument(id: string): Promise<void> {
  await fetchJSON(`/api/documents/${id}`, { method: "DELETE" });
}

export async function getDocumentStatus(
  id: string
): Promise<{ status: string; progress: number; error_message: string | null }> {
  return fetchJSON(`/api/documents/${id}/status`);
}

// Connectors
export async function listConnectors(): Promise<Connector[]> {
  return fetchJSON("/api/connectors");
}

export async function createConnector(data: {
  name: string;
  type: string;
  config: Record<string, string>;
}): Promise<Connector> {
  return fetchJSON("/api/connectors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function testConnector(
  id: string
): Promise<{ ok: boolean; message: string }> {
  return fetchJSON(`/api/connectors/${id}/test`, { method: "POST" });
}

export async function syncConnector(id: string): Promise<void> {
  await fetchJSON(`/api/connectors/${id}/sync`, { method: "POST" });
}

export async function deleteConnector(id: string): Promise<void> {
  await fetchJSON(`/api/connectors/${id}`, { method: "DELETE" });
}

// Conversations
export async function listConversations(): Promise<Conversation[]> {
  return fetchJSON("/api/conversations");
}

export async function createConversation(
  title = "New Chat"
): Promise<Conversation> {
  return fetchJSON("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return fetchJSON(`/api/conversations/${id}`);
}

export async function deleteConversation(id: string): Promise<void> {
  await fetchJSON(`/api/conversations/${id}`, { method: "DELETE" });
}

// Settings
export async function getSettings(): Promise<Settings> {
  return fetchJSON("/api/settings");
}

export async function updateSettings(
  data: Partial<Settings> & {
    openai_api_key?: string;
    watsonx_api_key?: string;
    watsonx_project_id?: string;
    watsonx_url?: string;
  }
): Promise<Settings> {
  return fetchJSON("/api/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
