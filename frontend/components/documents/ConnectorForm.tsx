"use client";

import { useState } from "react";
import { Plus, Plug, Loader2 } from "lucide-react";
import { createConnector, testConnector } from "@/lib/api";

interface Props {
  onCreated: () => void;
}

const CONNECTOR_TYPES = [
  { value: "chroma_remote", label: "ChromaDB Remote" },
  { value: "pinecone", label: "Pinecone" },
  { value: "weaviate", label: "Weaviate" },
];

const CONFIG_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  chroma_remote: [
    { key: "host", label: "Host", placeholder: "localhost" },
    { key: "port", label: "Port", placeholder: "8000" },
    { key: "collection", label: "Collection", placeholder: "default" },
  ],
  pinecone: [
    { key: "api_key", label: "API Key", placeholder: "pk-..." },
    { key: "environment", label: "Environment", placeholder: "us-east-1" },
    { key: "index_name", label: "Index Name", placeholder: "my-index" },
  ],
  weaviate: [
    { key: "host", label: "Host", placeholder: "localhost:8080" },
    { key: "api_key", label: "API Key (optional)", placeholder: "" },
    { key: "class_name", label: "Class Name", placeholder: "Document" },
  ],
};

export default function ConnectorForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("chroma_remote");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fields = CONFIG_FIELDS[type] || [];

  const handleCreate = async () => {
    if (!name.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await createConnector({ name: name.trim(), type, config });
      setName("");
      setConfig({});
      setSuccess("Connector created");
      onCreated();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to create connector");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Plug size={16} />
        Add Connector
      </h3>

      <div className="grid gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Connector name"
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-transparent outline-none focus:border-primary"
        />

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setConfig({});
          }}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-transparent outline-none focus:border-primary"
        >
          {CONNECTOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {fields.map((f) => (
          <input
            key={f.key}
            type={f.key.includes("key") ? "password" : "text"}
            value={config[f.key] || ""}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
            placeholder={`${f.label} (${f.placeholder})`}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-transparent outline-none focus:border-primary"
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Create
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-600">{success}</p>
      )}
    </div>
  );
}
