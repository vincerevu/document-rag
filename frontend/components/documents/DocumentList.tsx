"use client";

import { useEffect, useRef } from "react";
import { FileText, Trash2, Globe, Database, AlertCircle } from "lucide-react";
import type { Document } from "@/types";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  documents: Document[];
  onDelete: (id: string) => void;
  onRefresh?: () => void;
  filterSourceType?: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SourceIcon({ type }: { type: string }) {
  switch (type) {
    case "url":
      return <Globe size={18} className="text-primary shrink-0" />;
    case "connector":
      return <Database size={18} className="text-primary shrink-0" />;
    default:
      return <FileText size={18} className="text-primary shrink-0" />;
  }
}

export default function DocumentList({
  documents,
  onDelete,
  onRefresh,
  filterSourceType,
}: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for processing documents
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.status === "processing" || d.status === "pending"
    );
    if (hasProcessing && onRefresh) {
      intervalRef.current = setInterval(onRefresh, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [documents, onRefresh]);

  const filtered = filterSourceType
    ? documents.filter((d) => d.source_type === filterSourceType)
    : documents;

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No documents yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((doc) => {
        const isProcessing =
          doc.status === "processing" || doc.status === "pending";
        const isFailed = doc.status === "failed";

        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card group"
          >
            <SourceIcon type={doc.source_type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{doc.filename}</p>
                <StatusBadge status={doc.status} />
              </div>
              {isProcessing && (
                <div className="mt-1.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary animate-pulse transition-all duration-500"
                    style={{ width: `${Math.max(doc.progress, 2)}%` }}
                  />
                </div>
              )}
              {isFailed && doc.error_message && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {doc.error_message}
                </p>
              )}
              {!isProcessing && (
                <p className="text-xs text-muted-foreground">
                  {formatSize(doc.file_size)} &middot; {doc.chunk_count ?? 0}{" "}
                  chunks
                </p>
              )}
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
