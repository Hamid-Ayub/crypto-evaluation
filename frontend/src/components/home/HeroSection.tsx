"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowUpRight,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { fetchScore, ScoreLookupResult } from "@/lib/api";

type Props = {
  onLookupSuccess?: (result: ScoreLookupResult) => void;
  lastLookup?: ScoreLookupResult | null;
};

const chainOptions = [
  { label: "Ethereum Mainnet", value: "eip155:1" },
  { label: "Arbitrum One", value: "eip155:42161" },
  { label: "Base", value: "eip155:8453" },
  { label: "Solana", value: "eip155:501" },
  { label: "Avalanche", value: "eip155:43114" },
];

const heroHighlights = [
  {
    label: "Coverage ratio",
    value: "92% of tracked float",
    detail: "Across DeFi, L2s, stablecoins, and infra",
    icon: Sparkles,
  },
  {
    label: "Refresh cadence",
    value: "Every 4 blocks",
    detail: "Convex jobs reconcile holders + liquidity",
    icon: ShieldCheck,
  },
  {
    label: "Report formats",
    value: "CSV • JSON-LD • Markdown",
    detail: "LLM-ready summaries + schema artifacts",
    icon: ArrowUpRight,
  },
];

export default function HeroSection({ onLookupSuccess, lastLookup }: Props) {
  const [chainId, setChainId] = useState(chainOptions[0].value);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const lastLookupLabel = useMemo(() => {
    if (!lastLookup) return null;
    const parts = [
      lastLookup.name ?? lastLookup.symbol ?? lastLookup.address,
      lastLookup.symbol ? `(${lastLookup.symbol})` : null,
      lastLookup.totalScore ? `score ${lastLookup.totalScore}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    return `${parts} • ${lastLookup.chainId}`;
  }, [lastLookup]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address.trim()) {
      setStatus("error");
      setMessage("Enter a contract address to fetch a scorecard.");
      return;
    }
    try {
      setStatus("loading");
      setMessage(null);
      const result = await fetchScore({ chainId, address: address.trim() });
      setStatus("success");
      setMessage(
        result.totalScore
          ? `Fetched a ${result.totalScore} benchmark in ${
              result.updatedAt ?? "latest block"
            }`
          : "Asset located. Scorecard generation pending.",
      );
      onLookupSuccess?.(result);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unknown lookup failure.",
      );
    }
  };

  return (
    <section className="rounded-[32px] border border-white/10 bg-[color:var(--color-bg-card)] p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
              Evaluation studio
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Production-grade decentralization benchmarks
            </h1>
            <p className="text-base text-[color:var(--color-text-secondary)]">
              Operators, auditors, and ecosystem teams rely on this console to inspect holder dispersion,
              venue liquidity, governance health, and chain-level guarantees before every listing decision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[color:var(--color-text-muted)]">
            {["LLM-native narratives", "JSON-LD schema", "Magnetic CTAs"].map((pill) => (
              <span key={pill} className="rounded-full border border-white/10 px-3 py-1.5">
                {pill}
              </span>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Diligence-ready tokens", value: "312", detail: "7 day net-new listings" },
              { title: "Benchmarks refreshed today", value: "86", detail: "Queued + completed jobs" },
            ].map((metric) => (
              <div
                key={metric.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                  {metric.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                <p className="text-xs text-[color:var(--color-text-secondary)]">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[color:var(--color-bg-card-alt)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Quick lookup
            </p>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
              Real-time
            </span>
          </div>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
              Chain
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  value={chainId}
                  onChange={(event) => setChainId(event.target.value)}
                >
                  {chainOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[color:var(--color-bg-card)] text-black"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <ArrowUpRight className="pointer-events-none absolute right-4 top-3 h-4 w-4 text-[color:var(--color-text-muted)]" />
              </div>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
              Address
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-[color:var(--color-text-muted)]" />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-11 py-3 text-sm text-white outline-none focus:border-white/40"
                  placeholder="0x0000... or CAIP-19 identifier"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
            </label>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3fe081] via-[#8ee3ff] to-[#c784ff] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Fetching
                </>
              ) : (
                <>
                  Generate scorecard <ShieldCheck className="h-4 w-4" />
                </>
              )}
            </button>
            {message && (
              <p
                className={`text-sm ${
                  status === "error" ? "text-[#ff8a5c]" : "text-[#3fe081]"
                }`}
              >
                {message}
              </p>
            )}
            {lastLookupLabel && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-[color:var(--color-text-secondary)]">
                <p className="font-semibold uppercase tracking-[0.35em] text-white/60">
                  Recent lookup
                </p>
                <p className="mt-1 text-sm text-white">{lastLookupLabel}</p>
              </div>
            )}
          </form>
          <div className="mt-6 space-y-3 text-xs text-[color:var(--color-text-secondary)]">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Why teams rely on us
            </p>
            <ul className="space-y-2">
              {[
                "Deterministic scoring weights with transparency on calc versioning.",
                "Cross-checks liquidity (CeFi + DeFi) against governance participation.",
                "Exports structured data for AI agents, analysts, and listings teams.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 text-[#c784ff]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {heroHighlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <span className="rounded-full border border-white/10 bg-black/30 p-2">
                <Icon className="h-4 w-4 text-[#8ee3ff]" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                  {item.label}
                </p>
                <p className="text-base font-semibold text-white">{item.value}</p>
                <p className="text-xs text-[color:var(--color-text-secondary)]">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

