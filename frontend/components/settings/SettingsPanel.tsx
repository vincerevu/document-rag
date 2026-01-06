"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getSettings, updateSettings } from "@/lib/api";
import type { Settings } from "@/types";
import LoadingSpinner from "../ui/LoadingSpinner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [keys, setKeys] = useState({
    openai_api_key: "",
    groq_api_key: "",
    google_api_key: "",
    watsonx_api_key: "",
    watsonx_project_id: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getSettings().then(setSettings).catch(console.error);
      setKeys({
        openai_api_key: "",
        groq_api_key: "",
        google_api_key: "",
        watsonx_api_key: "",
        watsonx_project_id: "",
      });
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const update: Record<string, any> = { ...settings };
      Object.entries(keys).forEach(([k, v]) => {
        if (v) update[k] = v;
      });
      const updated = await updateSettings(update);
      setSettings(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const provider = settings?.llm_provider || "groq";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X size={20} />
          </button>
        </div>

        {!settings ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Provider */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">LLM Provider</label>
              <select
                value={settings.llm_provider}
                onChange={(e) =>
                  setSettings({ ...settings, llm_provider: e.target.value })
                }
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="groq">Groq (Free - Llama 3.1)</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="watsonx">WatsonX</option>
              </select>
            </div>

            {/* Provider-specific keys */}
            {provider === "groq" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Groq API Key</label>
                <input
                  type="password"
                  value={keys.groq_api_key}
                  onChange={(e) =>
                    setKeys({ ...keys, groq_api_key: e.target.value })
                  }
                  placeholder="gsk_..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Free at console.groq.com/keys
                </p>
              </div>
            )}

            {provider === "openai" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <input
                  type="password"
                  value={keys.openai_api_key}
                  onChange={(e) =>
                    setKeys({ ...keys, openai_api_key: e.target.value })
                  }
                  placeholder="sk-..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
            )}

            {provider === "gemini" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Google API Key</label>
                <input
                  type="password"
                  value={keys.google_api_key}
                  onChange={(e) =>
                    setKeys({ ...keys, google_api_key: e.target.value })
                  }
                  placeholder="AIza..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Free at aistudio.google.com/apikey
                </p>
              </div>
            )}

            {provider === "watsonx" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">WatsonX API Key</label>
                  <input
                    type="password"
                    value={keys.watsonx_api_key}
                    onChange={(e) =>
                      setKeys({ ...keys, watsonx_api_key: e.target.value })
                    }
                    placeholder="WatsonX API key"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    WatsonX Project ID
                  </label>
                  <input
                    value={keys.watsonx_project_id}
                    onChange={(e) =>
                      setKeys({ ...keys, watsonx_project_id: e.target.value })
                    }
                    placeholder="Project ID"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              </>
            )}

            {/* RAG params */}
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-3">RAG Parameters</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Chunk Size
                  </label>
                  <input
                    type="number"
                    value={settings.chunk_size}
                    onChange={(e) =>
                      setSettings({ ...settings, chunk_size: +e.target.value })
                    }
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Chunk Overlap
                  </label>
                  <input
                    type="number"
                    value={settings.chunk_overlap}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        chunk_overlap: +e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Retrieval Top K
                  </label>
                  <input
                    type="number"
                    value={settings.retrieval_top_k}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        retrieval_top_k: +e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Results Top K
                  </label>
                  <input
                    type="number"
                    value={settings.rerank_top_k}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        rerank_top_k: +e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Pipeline Features */}
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-3">Pipeline Features</p>
              <div className="space-y-3">
                {[
                  {
                    key: "use_hybrid_search" as const,
                    label: "Hybrid Search (BM25 + Vector)",
                    description:
                      "Combines keyword-based BM25 with vector similarity for better recall",
                  },
                  {
                    key: "use_multi_query" as const,
                    label: "Multi-Query Retrieval",
                    description:
                      "Generates alternate query phrasings to retrieve more relevant documents",
                  },
                  {
                    key: "use_hyde" as const,
                    label: "HyDE (Hypothetical Document Embeddings)",
                    description:
                      "Generates a hypothetical answer first, then uses it to find similar documents",
                  },
                  {
                    key: "use_reranking" as const,
                    label: "Reranking (CrossEncoder)",
                    description:
                      "Re-scores retrieved documents with a cross-encoder model for higher precision",
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={settings[toggle.key]}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [toggle.key]: e.target.checked,
                        })
                      }
                      className="mt-1 h-4 w-4 rounded border-border accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {toggle.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
