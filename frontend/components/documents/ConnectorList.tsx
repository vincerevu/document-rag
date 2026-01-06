"use client";

import { useState } from "react";
import { Trash2, RefreshCw, Loader2, Database } from "lucide-react";
import type { Connector } from "@/types";
import { testConnector, syncConnector, deleteConnector } from "@/lib/api";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  connectors: Connector[];
  onRefresh: () => void;
}

export default function ConnectorList({ connectors, onRefresh }: Props) {
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const handleTest = async (id: string) => {
    setTesting((p) => ({ ...p, [id]: true }));
    try {
      const result = await testConnector(id);
      if (!result.ok) alert(result.message);
      onRefresh();
    } catch (e: any) {
      alert(e.message || "Test failed");
    } finally {
      setTesting((p) => ({ ...p, [id]: false }));
    }
  };

  const handleSync = async (id: string) => {
    setSyncing((p) => ({ ...p, [id]: true }));
    try {
      await syncConnector(id);
      // Poll for completion
      setTimeout(onRefresh, 2000);
    } catch (e: any) {
      alert(e.message || "Sync failed");
    } finally {
      setSyncing((p) => ({ ...p, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConnector(id);
      onRefresh();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  if (connectors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No connectors configured
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {connectors.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card group"
        >
          <Database size={18} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {c.type} &middot; {c.document_count} docs
              {c.last_synced && ` \u00b7 synced ${new Date(c.last_synced).toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleTest(c.id)}
              disabled={testing[c.id]}
              className="p-1.5 hover:text-primary transition-colors text-xs border border-border rounded"
              title="Test connection"
            >
              {testing[c.id] ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Test"
              )}
            </button>
            <button
              onClick={() => handleSync(c.id)}
              disabled={syncing[c.id]}
              className="p-1.5 hover:text-primary transition-colors"
              title="Sync"
            >
              {syncing[c.id] ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
