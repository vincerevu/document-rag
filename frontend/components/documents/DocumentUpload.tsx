"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Link } from "lucide-react";
import { uploadDocuments, ingestURL } from "@/lib/api";
import type { Document } from "@/types";
import { useIngestionSocket } from "@/lib/useIngestionSocket";
import { useToast } from "@/components/ui/Toast";

interface Props {
  onUploaded: () => void;
  mode?: "file" | "url";
}

function IngestionProgressBar({ docId }: { docId: string }) {
  const event = useIngestionSocket(docId);
  if (!event) return null;

  const stageLabels: Record<string, string> = {
    crawling: "Crawling",
    loading: "Loading",
    chunking: "Chunking",
    embedding: "Embedding",
    indexing: "Indexing",
    complete: "Done",
    error: "Failed",
  };

  const isError = event.stage === "error";
  const isDone = event.stage === "complete";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={isError ? "text-red-500" : "text-muted-foreground"}>
          {isError ? event.error : stageLabels[event.stage] || event.stage}
        </span>
        {!isError && (
          <span className="text-muted-foreground">{event.progress}%</span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isError
              ? "bg-red-500"
              : isDone
              ? "bg-green-500"
              : "bg-primary animate-pulse"
          }`}
          style={{ width: `${Math.max(event.progress, 2)}%` }}
        />
      </div>
    </div>
  );
}

export default function DocumentUpload({ onUploaded, mode = "file" }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [error, setError] = useState("");
  const [activeUploads, setActiveUploads] = useState<
    { docId: string; name: string }[]
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError("");
      setUploading(true);
      try {
        const docs: Document[] = await uploadDocuments(Array.from(files));
        setActiveUploads((prev) => [
          ...prev,
          ...docs.map((d) => ({ docId: d.id, name: d.filename })),
        ]);
        toast.success(`${docs.length} file${docs.length > 1 ? "s" : ""} uploaded successfully.`);
        // Refresh after a delay to let processing start
        setTimeout(onUploaded, 500);
      } catch (e: any) {
        toast.error(e.message || "Upload failed");
        setError(e.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleURL = async () => {
    if (!urlInput.trim()) return;
    setError("");
    setUploading(true);
    try {
      const doc = await ingestURL(urlInput.trim(), deepCrawl);
      setActiveUploads((prev) => [
        ...prev,
        { docId: doc.id, name: doc.filename },
      ]);
      setUrlInput("");
      toast.success("URL ingested successfully.");
      setTimeout(onUploaded, 500);
    } catch (e: any) {
      toast.error(e.message || "URL ingestion failed");
      setError(e.message || "URL ingestion failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {mode === "file" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.md,.csv,.txt,.json"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-muted-foreground" />
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, PPTX, XLSX, MD, CSV, TXT, JSON
            </p>
          </div>
        </div>
      )}

      {mode === "url" && (
        <>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1 border border-border rounded-lg px-3 py-2">
              <Link size={16} className="text-muted-foreground shrink-0" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste a URL to ingest..."
                className="flex-1 text-sm bg-transparent outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleURL()}
              />
            </div>
            <button
              onClick={handleURL}
              disabled={!urlInput.trim() || uploading}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              Ingest
            </button>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deepCrawl}
              onChange={(e) => setDeepCrawl(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <div>
              <span className="text-sm font-medium">Deep crawl (follow sublinks)</span>
              <p className="text-xs text-muted-foreground">
                Recursively crawls linked pages on the same domain
              </p>
            </div>
          </label>
        </>
      )}

      {/* Per-file progress bars */}
      {activeUploads.length > 0 && (
        <div className="space-y-3">
          {activeUploads.map((u) => (
            <div
              key={u.docId}
              className="p-3 rounded-lg border border-border bg-card"
            >
              <p className="text-sm font-medium truncate mb-2">{u.name}</p>
              <IngestionProgressBar docId={u.docId} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
          <X size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
