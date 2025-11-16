"use client";

import { useState } from "react";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { requestRefresh } from "@/lib/api";

type Props = {
  chainId: string;
  address: string;
};

export default function RefreshButton({ chainId, address }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setMessage(null);
      await requestRefresh(chainId, address);
      setMessage("Refresh queued successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to queue refresh");
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 disabled:opacity-50"
      >
        {loading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Queueing...
          </>
        ) : (
          <>
            Request refresh
            <ShieldCheck className="h-4 w-4" />
          </>
        )}
      </button>
      {message && (
        <p className={`text-xs ${message.includes("Failed") ? "text-[#ff8a5c]" : "text-[#3fe081]"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

