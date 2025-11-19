"use client";

import { useState } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { fetchJsonLdUrl } from "@/lib/api";

type Props = {
  chainId: string;
  address: string;
};

export default function JsonLdButton({ chainId, address }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = await fetchJsonLdUrl(chainId, address);
      if (url) {
        window.open(url, "_blank");
      } else {
        setError("JSON-LD not available");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch JSON-LD");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm text-white transition hover:border-white/40 disabled:opacity-50"
      >
        {loading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            View JSON-LD
            <ExternalLink className="h-4 w-4" />
          </>
        )}
      </button>
      {error && <p className="text-xs text-[#ff8a5c]">{error}</p>}
    </div>
  );
}



