"use client";

import { FormEvent, useState } from "react";
import {
  LoaderCircle,
  Search,
} from "lucide-react";
import { fetchScore, ScoreLookupResult } from "@/lib/api";

type Props = {
  onLookupSuccess?: (result: ScoreLookupResult) => void;
  lastLookup?: ScoreLookupResult | null;
};

export default function HeroSection({ onLookupSuccess, lastLookup }: Props) {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address.trim()) {
      setStatus("error");
      setMessage("Enter a token address to fetch a benchmark.");
      return;
    }
    try {
      setStatus("loading");
      setMessage(null);
      // Try to detect chain from CAIP-19 format or search across chains
      const input = address.trim();
      let chainId: string | null = null;
      
      // Check if it's a CAIP-19 identifier (eip155:1:erc20:0x...)
      if (input.includes(":")) {
        const parts = input.split(":");
        if (parts.length >= 4 && parts[0] === "eip155") {
          chainId = `${parts[0]}:${parts[1]}`;
        }
      }
      
      // If no chain detected, try searching across chains (start with Ethereum)
      const result = await fetchScore({ 
        chainId: chainId || "eip155:1", 
        address: input.includes(":") ? input.split(":").slice(3).join(":") : input 
      }, { autoQueue: true });
      setStatus("success");
      setMessage(
        result.totalScore
          ? `Benchmark score: ${result.totalScore}/100`
          : "Asset queued for fetching. Scorecard generation pending.",
      );
      onLookupSuccess?.(result);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Token not found. Try a different address or chain.",
      );
    }
  };

  return (
    <section className="rounded-[32px] border border-white/10 bg-[color:var(--color-bg-card)] p-8 sm:p-12">
      <div className="mx-auto max-w-3xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Decentralization Benchmarks
          </h1>
          <p className="text-base text-[color:var(--color-text-secondary)] max-w-2xl mx-auto">
            Measure token decentralization through ownership distribution, liquidity depth, and governance participation.
          </p>
        </div>

        <form className="max-w-xl mx-auto" onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[color:var(--color-text-muted)]" />
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-14 py-4 text-base text-white outline-none focus:border-white/40 placeholder:text-[color:var(--color-text-muted)]"
              placeholder="Enter token address (chain auto-detected)"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-[#3fe081] to-[#8ee3ff] px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
              disabled={status === "loading" || !address.trim()}
            >
              {status === "loading" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>
          {message && (
            <p
              className={`mt-3 text-sm text-center ${
                status === "error" ? "text-[#ff8a5c]" : "text-[#3fe081]"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

