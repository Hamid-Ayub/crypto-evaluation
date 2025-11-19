"use client";

import React, { ReactNode, useMemo, useState } from "react";
import { Wand2, Loader2, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { generateReportSection } from "@/lib/api";
import { AiSectionSource } from "@/types/token";

type AiContentBlockProps = {
  tokenId: string;
  sectionId: string;
  title?: string;
  description?: string;
  initialContent?: string | null;
  initialUpdatedAt?: number;
  initialModel?: string;
  initialSources?: AiSectionSource[];
  helperText?: string;
};

export default function AiContentBlock({
  tokenId,
  sectionId,
  title = "AI Narrative",
  description,
  initialContent,
  initialUpdatedAt,
  initialModel,
  initialSources,
  helperText,
}: AiContentBlockProps) {
  const [content, setContent] = useState(initialContent ?? "");
  const [model, setModel] = useState(initialModel ?? "");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt ?? 0);
  const [sources, setSources] = useState<AiSectionSource[]>(initialSources ?? []);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    initialContent ? "success" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (force?: boolean) => {
    try {
      setStatus("loading");
      setError(null);
      const result = await generateReportSection(tokenId, sectionId, undefined, { force });
      setContent(result.content);
      setModel(result.model ?? "");
      setUpdatedAt(result.updatedAt ?? Date.now());
      setSources(result.sources ?? []);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Failed to generate section";
      setError(message);
    }
  };

  const updatedLabel = updatedAt ? new Date(updatedAt).toLocaleString() : null;

  const renderedContent = useMemo(() => renderWithCitations(content, sources), [content, sources]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-[#c784ff]" />
            {title}
          </p>
          {helperText && (
            <p className="text-xs text-[color:var(--color-text-muted)] mt-1">{helperText}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerate()}
            disabled={status === "loading"}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 hover:text-white disabled:opacity-50"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating
              </>
            ) : content ? (
              <>
                <RefreshCcw className="h-3 w-3" />
                Refresh
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3" />
                Generate
              </>
            )}
          </button>
          {content && (
            <button
              onClick={() => handleGenerate(true)}
              disabled={status === "loading"}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white disabled:opacity-50"
            >
              <Wand2 className="h-3 w-3" />
              Force
            </button>
          )}
        </div>
      </div>

      {description && (
        <p className="text-xs text-[color:var(--color-text-muted)] mt-2">{description}</p>
      )}

      <div className="mt-4 rounded-lg border border-white/5 bg-black/10 p-4 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        {content ? (
          <div className="whitespace-pre-wrap">{renderedContent}</div>
        ) : (
          <p className="text-white/40">No AI-generated content yet. Run Gemini to populate this section.</p>
        )}
      </div>

      {sources.length > 0 && (
        <div className="mt-3 space-y-1 text-[11px] text-[color:var(--color-text-muted)]">
          <p className="font-semibold text-white/70">Sources</p>
          <ol className="space-y-1">
            {sources.map((source) => (
              <li key={source.id} className="flex items-start gap-2">
                <span className="text-white/80">[{source.id}]</span>
                <a
                  className="text-[#8ee3ff] hover:underline"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title ?? source.url}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-[color:var(--color-text-muted)]">
        <div className="flex items-center gap-2">
          {status === "success" && (
            <span className="inline-flex items-center gap-1 text-[#3fe081]">
              <CheckCircle2 className="h-3 w-3" />
              Updated with Gemini
            </span>
          )}
          {status === "error" && error && (
            <span className="inline-flex items-center gap-1 text-[#ff8a5c]">
              <AlertCircle className="h-3 w-3" />
              {error}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {model && <span>Model: {model}</span>}
          {updatedLabel && <span>Updated: {updatedLabel}</span>}
        </div>
      </div>
    </div>
  );
}

function renderWithCitations(content: string, sources: AiSectionSource[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  if (!content) return nodes;
  const sourceMap = new Map<number, AiSectionSource>(sources.map((source) => [source.id, source]));
  const citationRegex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(content)) !== null) {
    const index = match.index;
    if (index > lastIndex) {
      nodes.push(content.slice(lastIndex, index));
    }
    const citationId = Number(match[1]);
    const source = sourceMap.get(citationId);
    nodes.push(<CitationSup key={`cite-${index}-${citationId}`} number={citationId} source={source} />);
    lastIndex = citationRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes;
}

function CitationSup({ number, source }: { number: number; source?: AiSectionSource }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (source?.url) {
      window.open(source.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <sup className="group relative mx-0.5">
      <button
        onClick={handleClick}
        className="cursor-pointer text-[#8ee3ff] transition-all hover:text-[#3fe081] hover:underline focus:outline-none focus:ring-1 focus:ring-[#8ee3ff]/50 rounded-sm px-0.5"
        title={source?.title || source?.url || `Citation ${number}`}
        type="button"
      >
        [{number}]
      </button>
      {source && (
        <span className="pointer-events-none absolute left-1/2 bottom-full mb-2 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-white/20 bg-black/95 p-3 text-[10px] leading-snug text-white shadow-2xl group-hover:block backdrop-blur-sm">
          <span className="block font-semibold text-[11px] text-white mb-1">
            {source.title ?? source.url}
          </span>
          {source.snippet && <span className="block text-white/70 mb-1">{source.snippet}</span>}
          <span className="block truncate text-[#8ee3ff] text-[9px]">{source.url}</span>
          <span className="block mt-1 text-[9px] text-white/40 italic">Click to open</span>
        </span>
      )}
    </sup>
  );
}
