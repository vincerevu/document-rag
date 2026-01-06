"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Globe, Database } from "lucide-react";
import type { Document, Connector } from "@/types";
import { listDocuments, deleteDocument, listConnectors } from "@/lib/api";
import DocumentUpload from "./DocumentUpload";
import DocumentList from "./DocumentList";
import ConnectorForm from "./ConnectorForm";
import ConnectorList from "./ConnectorList";

const TABS = [
  { key: "files", label: "Files", icon: FileText },
  { key: "urls", label: "URLs", icon: Globe },
  { key: "connectors", label: "Connectors", icon: Database },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface Props {
  onDocumentsChanged?: () => void;
}

export default function DataSourcesPanel({ onDocumentsChanged }: Props) {
  const [tab, setTab] = useState<TabKey>("files");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);

  const refreshDocuments = useCallback(() => {
    listDocuments().then(setDocuments).catch(console.error);
    onDocumentsChanged?.();
  }, [onDocumentsChanged]);

  const refreshConnectors = useCallback(() => {
    listConnectors().then(setConnectors).catch(console.error);
  }, []);

  useEffect(() => {
    refreshDocuments();
    refreshConnectors();
  }, [refreshDocuments, refreshConnectors]);

  const handleDeleteDoc = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      refreshDocuments();
    },
    [refreshDocuments]
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold">Data Sources</h2>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const count =
            t.key === "files"
              ? documents.filter((d) => d.source_type === "file").length
              : t.key === "urls"
                ? documents.filter((d) => d.source_type === "url").length
                : connectors.length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {t.label}
              {count > 0 && (
                <span
                  className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "files" && (
        <div className="space-y-6">
          <DocumentUpload onUploaded={refreshDocuments} mode="file" />
          <DocumentList
            documents={documents}
            onDelete={handleDeleteDoc}
            onRefresh={refreshDocuments}
            filterSourceType="file"
          />
        </div>
      )}

      {tab === "urls" && (
        <div className="space-y-6">
          <DocumentUpload onUploaded={refreshDocuments} mode="url" />
          <DocumentList
            documents={documents}
            onDelete={handleDeleteDoc}
            onRefresh={refreshDocuments}
            filterSourceType="url"
          />
        </div>
      )}

      {tab === "connectors" && (
        <div className="space-y-6">
          <ConnectorForm onCreated={refreshConnectors} />
          <ConnectorList
            connectors={connectors}
            onRefresh={refreshConnectors}
          />
        </div>
      )}
    </div>
  );
}
