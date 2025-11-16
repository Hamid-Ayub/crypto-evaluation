"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import ScoreIndicator from "@/components/shared/ScoreIndicator";
import Sparkline from "@/components/shared/Sparkline";
import TokenAvatar from "@/components/shared/TokenAvatar";
import { TokenRecord } from "@/types/token";
import { formatUsd } from "@/lib/api";
import {
  BarChart3,
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";

type ViewMode = "table" | "grid";

type Props = {
  tokens: TokenRecord[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  view: ViewMode;
};

const riskMeta = {
  low: {
    label: "Low dispersion risk",
    tone: "text-[#3fe081]",
    border: "border-[#3fe081]/40",
    bg: "bg-[#3fe081]/10",
  },
  medium: {
    label: "Moderate risk",
    tone: "text-[#f7c548]",
    border: "border-[#f7c548]/40",
    bg: "bg-[#f7c548]/15",
  },
  high: {
    label: "Heightened risk",
    tone: "text-[#ff8a5c]",
    border: "border-[#ff8a5c]/40",
    bg: "bg-[#ff8a5c]/10",
  },
};

export default function TokenTable({
  tokens,
  page,
  totalPages,
  onPageChange,
  totalItems,
  view,
  pageSize,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-[24px] border border-white/5 bg-black/10">
      {tokens.length === 0 ? (
        <EmptyState view={view} />
      ) : view === "grid" ? (
        <TokenGrid tokens={tokens} />
      ) : (
        <TokenTableView
          tokens={tokens}
          expanded={expanded}
          onToggle={toggle}
        />
      )}
      <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-xs text-[color:var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing <strong className="text-white">{tokens.length}</strong> of{" "}
          <strong className="text-white">{totalItems}</strong> benchmarked assets •{" "}
          {pageSize} per page
        </p>
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

function TokenTableView({
  tokens,
  expanded,
  onToggle,
}: {
  tokens: TokenRecord[];
  expanded: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            {[
              "Asset",
              "Contract",
              "Benchmark",
              "Liquidity",
              "Holders",
              "24h volume",
              "Risk",
              "Updated",
              "",
            ].map((column) => (
              <th key={column} className="border-b border-white/5 px-6 py-4">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => {
            const isExpanded = expanded === token.id;
            return (
              <Fragment key={token.id}>
                <tr className="border-b border-white/[0.06] text-[color:var(--color-text-secondary)] transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <TokenAvatar avatar={token.avatar} symbol={token.symbol} />
                          <div>
                        <p className="text-base font-semibold text-white">{token.name}</p>
                        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                          {token.symbol} • {token.chainLabel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-white/80">
                    <button className="rounded-full border border-white/10 px-3 py-1 transition hover:border-white/40">
                      {token.address.slice(0, 6)}…{token.address.slice(-4)}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <ScoreIndicator 
                      score={token.benchmarkScore} 
                      id={token.id}
                      details={{
                        ownership: token.benchmarkDetails.ownership,
                        controlRisk: token.benchmarkDetails.controlRisk,
                        liquidity: token.benchmarkDetails.liquidity,
                        governance: token.benchmarkDetails.governance,
                        gini: token.benchmarkDetails.gini,
                        hhi: token.benchmarkDetails.hhi,
                        nakamoto: token.benchmarkDetails.nakamoto,
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {formatUsd(token.liquidityUsd, { notation: "compact" })}
                  </td>
                  <td className="px-6 py-4">{token.holders.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {formatUsd(token.volume24hUsd, { notation: "compact" })}
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={token.risk} />
                  </td>
                  <td className="px-6 py-4 text-xs">{token.updatedAt}</td>
                  <td className="px-6 py-4">
                    <button
                      className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40"
                      onClick={() => onToggle(token.id)}
                    >
                      {isExpanded ? "Collapse" : "Open benchmark"}
                      <ChevronDown
                        className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-white/[0.06]">
                    <td colSpan={9} className="bg-white/[0.02] px-6 py-6">
                      <ExpandedRow token={token} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RiskBadge({ level }: { level: TokenRecord["risk"] }) {
  const meta = riskMeta[level];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${meta.border} ${meta.bg} ${meta.tone}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {level}
    </span>
  );
}

function ExpandedRow({ token }: { token: TokenRecord }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <TokenAvatar avatar={token.avatar} symbol={token.symbol} />
          <div>
            <p className="text-lg font-semibold text-white">
              {token.name} <span className="text-sm text-[color:var(--color-text-muted)]">({token.symbol})</span>
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
              {token.chainLabel} • {token.category}
            </p>
          </div>
        </div>
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          {token.summary}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-[color:var(--color-text-secondary)]">
          {token.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={`/tokens/${token.id}`}
          className="flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
        >
          Open detailed page
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-white/5 bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            Signal trail
          </p>
          <BarChart3 className="h-4 w-4 text-[#8ee3ff]" />
        </div>
        <Sparkline data={token.sparkline} />
        <div className="grid gap-3 sm:grid-cols-3">
          {token.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs text-[color:var(--color-text-secondary)]"
            >
              <p className="uppercase tracking-[0.35em]">{stat.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
              <p
                className={`text-[11px] ${
                  stat.delta >= 0 ? "text-[#3fe081]" : "text-[#ff8a5c]"
                }`}
              >
                {stat.delta >= 0 ? "+" : ""}
                {stat.delta}%
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-[color:var(--color-text-secondary)]">
          <p className="text-xs uppercase tracking-[0.35em] font-semibold">
            Benchmark commitment
          </p>
          <p className="mt-2">
            Attach governance docs, audits, and L2 proofs to elevate this listing.
          </p>
          <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f7c548] to-[#ff8a5c] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110">
            Push to diligence flow
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-30"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Prev
      </button>
      <span className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
        Page {page} / {totalPages}
      </span>
      <button
        className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-30"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}

function EmptyState({ view }: { view: ViewMode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-8 py-16 text-center text-sm text-[color:var(--color-text-secondary)]">
      <div className="rounded-3xl border border-dashed border-white/15 p-8">
        {view === "grid" ? (
          <LayoutGrid className="h-8 w-8 text-[#8ee3ff]" />
        ) : (
          <List className="h-8 w-8 text-[#8ee3ff]" />
        )}
      </div>
      <p className="text-base font-semibold text-white">No assets match the current filters.</p>
      <p>Adjust the filters or clear the query to reload the benchmark universe.</p>
    </div>
  );
}

function TokenGrid({ tokens }: { tokens: TokenRecord[] }) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {tokens.map((token) => (
        <article
          key={token.id}
          className="rounded-3xl border border-white/10 bg-[color:var(--color-bg-card)] p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenAvatar avatar={token.avatar} symbol={token.symbol} />
              <div>
                <p className="text-lg font-semibold text-white">{token.name}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                  {token.symbol} • {token.chainLabel}
                </p>
              </div>
            </div>
            <ScoreIndicator 
              score={token.benchmarkScore}
              details={{
                ownership: token.benchmarkDetails.ownership,
                controlRisk: token.benchmarkDetails.controlRisk,
                liquidity: token.benchmarkDetails.liquidity,
                governance: token.benchmarkDetails.governance,
                gini: token.benchmarkDetails.gini,
                hhi: token.benchmarkDetails.hhi,
                nakamoto: token.benchmarkDetails.nakamoto,
              }}
            />
          </div>
          <p className="mt-4 text-sm text-[color:var(--color-text-secondary)] line-clamp-2">
            {token.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--color-text-secondary)]">
            {token.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                Liquidity
              </p>
              <p>{formatUsd(token.liquidityUsd, { notation: "compact" })}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                24h Volume
              </p>
              <p>{formatUsd(token.volume24hUsd, { notation: "compact" })}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                Risk
              </p>
              <RiskBadge level={token.risk} />
            </div>
          </div>
          <div className="mt-4">
            <Sparkline data={token.sparkline} />
          </div>
          <Link
            href={`/tokens/${token.id}`}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
          >
            Launch benchmark brief
            <ExternalLink className="h-4 w-4" />
          </Link>
        </article>
      ))}
    </div>
  );
}

