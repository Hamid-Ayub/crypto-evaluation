"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import ScoreIndicator from "@/components/shared/ScoreIndicator";
import Sparkline from "@/components/shared/Sparkline";
import TokenAvatar from "@/components/shared/TokenAvatar";
import { TokenRecord } from "@/types/token";
import { formatUsd } from "@/lib/api";
import {
  ArrowDown,
  ArrowUp,
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
  sort?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sort: string, sortDir: "asc" | "desc") => void;
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
  sort,
  sortDir,
  onSortChange,
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
          sort={sort}
          sortDir={sortDir}
          onSortChange={onSortChange}
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

type ColumnConfig = {
  label: string;
  sortKey: string | null;
};

const COLUMNS: ColumnConfig[] = [
  { label: "Asset", sortKey: "alphabetical" },
  { label: "Contract", sortKey: null },
  { label: "Benchmark", sortKey: "score" },
  { label: "Liquidity", sortKey: "liquidity" },
  { label: "Holders", sortKey: "holders" },
  { label: "24h volume", sortKey: "volume" },
  { label: "Risk", sortKey: "risk" },
  { label: "Updated", sortKey: "updated" },
  { label: "", sortKey: null },
];

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: string | null;
  currentSort?: string;
  currentDir?: "asc" | "desc";
  onSort?: (sort: string, sortDir: "asc" | "desc") => void;
}) {
  const isActive = sortKey && currentSort === sortKey;
  const isAsc = isActive && currentDir === "asc";
  const isDesc = isActive && currentDir === "desc";

  const handleClick = () => {
    if (!sortKey || !onSort) return;
    
    if (isActive) {
      // Toggle direction
      onSort(sortKey, isDesc ? "asc" : "desc");
    } else {
      // Set new sort with default direction
      onSort(sortKey, "desc");
    }
  };

  if (!sortKey) {
    return (
      <th className="border-b border-white/5 px-6 py-4">
        {label}
      </th>
    );
  }

  return (
    <th className="border-b border-white/5 px-6 py-4">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 hover:text-white transition-colors group"
      >
        <span>{label}</span>
        <span className="flex flex-col">
          <ArrowUp
            className={`h-3 w-3 transition-opacity ${
              isAsc
                ? "opacity-100 text-white"
                : isActive
                ? "opacity-30"
                : "opacity-20 group-hover:opacity-40"
            }`}
          />
          <ArrowDown
            className={`h-3 w-3 -mt-1 transition-opacity ${
              isDesc
                ? "opacity-100 text-white"
                : isActive
                ? "opacity-30"
                : "opacity-20 group-hover:opacity-40"
            }`}
          />
        </span>
      </button>
    </th>
  );
}

function TokenTableView({
  tokens,
  expanded,
  onToggle,
  sort,
  sortDir,
  onSortChange,
}: {
  tokens: TokenRecord[];
  expanded: string | null;
  onToggle: (id: string) => void;
  sort?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sort: string, sortDir: "asc" | "desc") => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            {COLUMNS.map((column) => (
              <SortableHeader
                key={column.label}
                label={column.label}
                sortKey={column.sortKey}
                currentSort={sort}
                currentDir={sortDir}
                onSort={onSortChange}
              />
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
  const isWellDecentralized = token.benchmarkDetails.nakamoto >= 4 && token.benchmarkDetails.gini < 0.5;
  const hasConcentrationRisk = token.benchmarkDetails.hhi >= 1500 || token.benchmarkDetails.nakamoto < 4;
  
  const insights = [
    {
      label: "Decentralization Status",
      value: isWellDecentralized ? "Well Decentralized" : hasConcentrationRisk ? "Centralization Risk" : "Moderate",
      color: isWellDecentralized ? "#3fe081" : hasConcentrationRisk ? "#ff8a5c" : "#f7c548",
      detail: token.benchmarkDetails.nakamoto >= 4 
        ? `${token.benchmarkDetails.nakamoto} entities needed for majority control`
        : `Only ${token.benchmarkDetails.nakamoto} entities control majority`,
    },
    {
      label: "Ownership Distribution",
      value: token.benchmarkDetails.gini < 0.5 ? "Distributed" : "Concentrated",
      color: token.benchmarkDetails.gini < 0.5 ? "#3fe081" : "#ff8a5c",
      detail: `Gini ${token.benchmarkDetails.gini.toFixed(3)} • ${token.holders.toLocaleString()} holders`,
    },
    {
      label: "Liquidity Quality",
      value: token.benchmarkDetails.liquidity >= 70 ? "Strong" : token.benchmarkDetails.liquidity >= 50 ? "Moderate" : "Weak",
      color: token.benchmarkDetails.liquidity >= 70 ? "#3fe081" : token.benchmarkDetails.liquidity >= 50 ? "#f7c548" : "#ff8a5c",
      detail: `Score: ${token.benchmarkDetails.liquidity}/100 • ${formatUsd(token.liquidityUsd, { notation: "compact" })} depth`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-0.5">
            Ownership
          </p>
          <p className="text-lg font-bold text-white">{token.benchmarkDetails.ownership}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-0.5">
            Control Risk
          </p>
          <p className="text-lg font-bold text-white">{token.benchmarkDetails.controlRisk}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-0.5">
            Liquidity
          </p>
          <p className="text-lg font-bold text-white">{token.benchmarkDetails.liquidity}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-0.5">
            Governance
          </p>
          <p className="text-lg font-bold text-white">{token.benchmarkDetails.governance}</p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-0.5">
            Gini
          </p>
          <p className="text-base font-bold text-white">{token.benchmarkDetails.gini.toFixed(3)}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-0.5">
            HHI
          </p>
          <p className="text-base font-bold text-white">{token.benchmarkDetails.hhi.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-0.5">
            Nakamoto
          </p>
          <p className="text-base font-bold text-white">{token.benchmarkDetails.nakamoto}</p>
        </div>
      </div>

      {/* Decentralization Insights */}
      <div className="rounded-lg border border-white/5 bg-black/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            Decentralization Assessment
          </p>
          <Link
            href={`/tokens/${encodeURIComponent(token.id)}`}
            className="text-[10px] text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition flex items-center gap-1"
          >
            Full report
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div 
                className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" 
                style={{ backgroundColor: insight.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-semibold text-white">{insight.value}</p>
                  <p className="text-[9px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                    {insight.label}
                  </p>
                </div>
                <p className="text-[10px] text-[color:var(--color-text-secondary)] leading-tight">
                  {insight.detail}
                </p>
              </div>
            </div>
          ))}
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
            href={`/tokens/${encodeURIComponent(token.id)}`}
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

