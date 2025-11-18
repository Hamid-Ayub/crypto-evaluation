"use client";

import { useState } from "react";
import { Globe, LoaderCircle, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { parseProjectData } from "@/lib/api";

type Props = {
  tokenId: string;
  onParsed?: (data: any) => void;
};

export default function ParseProjectButton({ tokenId, onParsed }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleParse = async (force?: boolean) => {
    try {
      setLoading(true);
      setMessage(null);
      setStatus("idle");

      const result = await parseProjectData(tokenId, { force });

      if (result.error) {
        setStatus("error");
        setMessage(result.error);
        setTimeout(() => {
          setMessage(null);
          setStatus("idle");
        }, 5000);
        return;
      }

      if (result.cached) {
        setMessage("Using cached parsed data");
      } else {
        setMessage("Project data parsed successfully");
      }

      setStatus("success");
      if (onParsed && result.data) {
        onParsed(result.data);
      }

      // Refresh the page after a short delay to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Parse error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to parse project data";
      setMessage(errorMessage);
      setStatus("error");
      setTimeout(() => {
        setMessage(null);
        setStatus("idle");
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleParse()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-[#8ee3ff]/40 bg-[#8ee3ff]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ee3ff] transition hover:border-[#8ee3ff]/60 hover:bg-[#8ee3ff]/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Parsing...
            </>
          ) : (
            <>
              <Globe className="h-3.5 w-3.5" />
              Parse Project Data
            </>
          )}
        </button>
        {!loading && (
          <button
            onClick={() => handleParse(true)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white hover:border-white/20 disabled:opacity-50"
            title="Force re-parse (ignore cache)"
          >
            <RefreshCcw className="h-3 w-3" />
            Force
          </button>
        )}
      </div>
      {message && (
        <p
          className={`text-xs flex items-center gap-1 ${
            status === "error"
              ? "text-[#ff8a5c]"
              : status === "success"
                ? "text-[#3fe081]"
                : "text-[color:var(--color-text-muted)]"
          }`}
        >
          {status === "error" && <AlertCircle className="h-3 w-3" />}
          {status === "success" && <CheckCircle2 className="h-3 w-3" />}
          {message}
        </p>
      )}
    </div>
  );
}

