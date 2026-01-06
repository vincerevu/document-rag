"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { Source } from "@/types";

export default function SourceCard({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
      >
        <FileText size={14} className="text-primary shrink-0" />
        <span className="truncate font-medium">{source.doc_name}</span>
        {source.page != null && (
          <span className="text-muted-foreground text-xs">p.{source.page}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {(source.relevance_score * 100).toFixed(0)}%
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
          {source.chunk_text}
        </div>
      )}
    </div>
  );
}
