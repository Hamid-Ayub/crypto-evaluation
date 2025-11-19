"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Loader2, TrendingUp, Clock } from "lucide-react";
import { requestRefresh, refreshMarketData } from "@/lib/api";

type Props = {
  chainId: string;
  address: string;
  tokenId: string;
  assetId: string;
};

type JobStatus = {
  status: "idle" | "queued" | "running";
  queuePosition: number | null;
};

type QueueStats = {
  totalQueued: number;
  avgProcessingTimeSeconds: number;
};

export default function RefreshButton({ chainId, address, tokenId, assetId }: Props) {
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>({ status: "idle", queuePosition: null });
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);

  // Poll job status every 2 seconds
  useEffect(() => {
    const pollJobStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/status/${assetId}`);
        if (response.ok) {
          const data = await response.json();
          setJobStatus(data);
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
      }
    };

    const pollQueueStats = async () => {
      try {
        const response = await fetch("/api/jobs/queue-stats");
        if (response.ok) {
          const data = await response.json();
          setQueueStats(data);
        }
      } catch (error) {
        console.error("Failed to poll queue stats:", error);
      }
    };

    // Initial poll
    pollJobStatus();
    pollQueueStats();

    // Poll every 2 seconds
    const interval = setInterval(() => {
      pollJobStatus();
      pollQueueStats();
    }, 2000);

    return () => clearInterval(interval);
  }, [assetId]);

  // Calculate ETA
  const eta = jobStatus.queuePosition && queueStats?.avgProcessingTimeSeconds
    ? jobStatus.queuePosition * queueStats.avgProcessingTimeSeconds
    : null;

  const formatEta = (seconds: number) => {
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes}m`;
  };

  const isJobActive = jobStatus.status === "queued" || jobStatus.status === "running";

  const handleFullRefresh = async () => {
    try {
      setLoadingFull(true);
      setMessage(null);

      if (!chainId || !address) {
        setMessage("Missing chain ID or address");
        setTimeout(() => setMessage(null), 5000);
        return;
      }

      await requestRefresh(chainId, address);
      setMessage("Full refresh queued!");
    } catch (error) {
      console.error("Full refresh error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to queue refresh";
      setMessage(errorMessage);
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoadingFull(false);
    }
  };

  const handleMarketRefresh = async () => {
    try {
      setLoadingMarket(true);
      setMessage(null);

      await refreshMarketData(tokenId);
      setMessage("Market data refresh queued!");
    } catch (error: any) {
      console.error("Market refresh error:", error);
      if (error.message === "Refresh already in progress" || error.message === "refresh-already-in-progress") {
        setMessage("Market refresh already in progress");
      } else {
        setMessage(`Failed to refresh: ${error.message}`);
      }
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoadingMarket(false);
    }
  };

  const getJobStatusMessage = () => {
    if (jobStatus.status === "idle") return null;

    if (jobStatus.status === "running") {
      return "Processing data...";
    }

    if (jobStatus.status === "queued" && jobStatus.queuePosition) {
      const etaText = eta ? ` · ETA: ${formatEta(eta)}` : "";
      return `In queue (position ${jobStatus.queuePosition})${etaText}`;
    }

    return null;
  };

  const statusMessage = getJobStatusMessage();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleFullRefresh}
          disabled={loadingFull || loadingMarket || isJobActive}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-[#8ee3ff]/40 hover:bg-[#8ee3ff]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJobActive ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {jobStatus.status === "running" ? "Refreshing..." : "Queued..."}
            </>
          ) : loadingFull ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Queueing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh All Data
            </>
          )}
        </button>

        <button
          onClick={handleMarketRefresh}
          disabled={loadingFull || loadingMarket || isJobActive}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-[#3fe081]/40 hover:bg-[#3fe081]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingMarket ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Queueing...
            </>
          ) : (
            <>
              <TrendingUp className="h-3.5 w-3.5" />
              Refresh Price
            </>
          )}
        </button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-1.5 text-xs text-[#8ee3ff]">
          <Clock className="h-3 w-3" />
          {statusMessage}
        </div>
      )}

      {message && (
        <p className={`text-xs ${message.includes("Failed") || message.includes("Missing") || message.includes("already in progress") ? "text-[#ff8a5c]" : "text-[#3fe081]"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
