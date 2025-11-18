import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import ScoreIndicator from "@/components/shared/ScoreIndicator";
import TokenAvatar from "@/components/shared/TokenAvatar";
import RefreshButton from "@/components/tokens/RefreshButton";
import JsonLdButton from "@/components/tokens/JsonLdButton";
import ParseProjectButton from "@/components/tokens/ParseProjectButton";
import { fetchToken, formatUsd } from "@/lib/api";
import ExecutiveSummary from "@/components/reports/ExecutiveSummary";
import ProjectOverview from "@/components/reports/ProjectOverview";
import TokenFundamentals from "@/components/reports/TokenFundamentals";
import Tokenomics from "@/components/reports/Tokenomics";
import TechnologyReview from "@/components/reports/TechnologyReview";
import MarketAnalysis from "@/components/reports/MarketAnalysis";
import LegalRegulatory from "@/components/reports/LegalRegulatory";
import RiskAnalysis from "@/components/reports/RiskAnalysis";
import CommunityEcosystem from "@/components/reports/CommunityEcosystem";
import ReportConclusion from "@/components/reports/ReportConclusion";
import ReportAppendices from "@/components/reports/ReportAppendices";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

// Helper to get explorer URL for a chain
function getExplorerUrl(chainId: string, address: string): string {
  const chainMap: Record<string, string> = {
    "eip155:1": "https://etherscan.io",
    "eip155:42161": "https://arbiscan.io",
    "eip155:8453": "https://basescan.org",
    "eip155:137": "https://polygonscan.com",
    "eip155:10": "https://optimistic.etherscan.io",
    "eip155:43114": "https://snowtrace.io",
  };
  const base = chainMap[chainId] || "https://etherscan.io";
  return `${base}/address/${address}`;
}

// Helper to format address
function formatAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default async function TokenDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const token = await fetchToken(decodedId);
  if (!token) {
    notFound();
  }

  const explorerUrl = getExplorerUrl(token.chain, token.address);

  const riskMeta = {
    low: {
      label: "Low Risk",
      chip: "text-[#3fe081] border-[#3fe081]/30 bg-[#3fe081]/10",
    },
    medium: {
      label: "Medium Risk",
      chip: "text-[#f7c548] border-[#f7c548]/30 bg-[#f7c548]/10",
    },
    high: {
      label: "High Risk",
      chip: "text-[#ff8a5c] border-[#ff8a5c]/30 bg-[#ff8a5c]/10",
    },
  }[token.risk] ?? {
    label: "Risk Unknown",
    chip: "text-white border-white/20 bg-white/5",
  };

  const heroStats = [
    {
      label: "Benchmark Score",
      value: `${token.benchmarkScore.toFixed(1)}/100`,
      helper: "Composite decentralization",
    },
    {
      label: "Liquidity (USD)",
      value: token.liquidityUsd ? formatUsd(token.liquidityUsd, { notation: "compact" }) : "N/A",
      helper: "CEX + DEX depth",
    },
    {
      label: "Holders",
      value: token.holders.toLocaleString(),
      helper: "Unique addresses",
    },
    {
      label: "Market Cap",
      value: token.marketCapUsd ? formatUsd(token.marketCapUsd, { notation: "compact" }) : "—",
      helper: "Latest snapshot",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-[#0a0a0f] to-black pb-16 pt-10 text-[color:var(--color-text-primary)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-8 lg:px-12">
        {/* Hero Section */}
        <header className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[color:var(--color-bg-card)] via-[#070a11] to-[color:var(--color-bg-card-alt)] p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_10%_20%,rgba(143,227,255,0.45),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(63,224,129,0.35),transparent_40%)] blur-3xl" />
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-[color:var(--color-text-secondary)]">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:text-[#8ee3ff]"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Back to benchmarks
              </Link>
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.35em] text-[10px]">
                  Decentralization research asset
                </span>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${riskMeta.chip}`}>
                  {riskMeta.label}
                </span>
                <span className="text-white/40">Updated {token.updatedAt}</span>
                <JsonLdButton chainId={token.chain} address={token.address} />
              </div>
            </div>

            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 flex-col gap-5">
                <div className="flex flex-wrap items-center gap-4">
                  <TokenAvatar avatar={token.avatar} symbol={token.symbol} size="xl" />
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70">
                      {token.chainLabel} • {token.category}
                    </div>
                    <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
                      {token.name}
                      <span className="text-xl font-semibold text-[color:var(--color-text-muted)]"> ({token.symbol})</span>
                    </h1>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                    >
                      {formatAddress(token.address)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <p className="max-w-3xl text-base leading-relaxed text-[color:var(--color-text-secondary)]">
                  {token.summary}
                </p>

                <div className="flex flex-wrap gap-2">
                  {token.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[color:var(--color-text-secondary)] backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <RefreshButton chainId={token.chain} address={token.address} />
                  <ParseProjectButton tokenId={token.id} />
                  <a
                    href="#full-report"
                    className="inline-flex items-center gap-2 rounded-full border border-[#8ee3ff]/40 bg-[#8ee3ff]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8ee3ff] transition hover:border-[#8ee3ff]/60 hover:bg-[#8ee3ff]/20"
                  >
                    Jump to report
                  </a>
                </div>
              </div>

              <div className="flex w-full flex-col gap-4 rounded-[32px] border border-white/10 bg-white/5/50 p-6 backdrop-blur-lg lg:max-w-sm">
                <div className="rounded-[28px] border border-white/10 bg-[color:var(--color-bg-card-alt)] p-4">
                  <ScoreIndicator
                    score={token.benchmarkScore}
                    id={`${token.id}-detail`}
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
                <div className="grid grid-cols-2 gap-3">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">{stat.value}</p>
                      <p className="text-[11px] text-white/50">{stat.helper}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div id="full-report" className="sr-only" aria-hidden="true" />

        {/* Comprehensive Token Analysis Report */}
        <ExecutiveSummary token={token} />
        <ProjectOverview token={token} parsedProjectData={token.parsedProjectData} />
        <TokenFundamentals token={token} />
        <Tokenomics token={token} />
        <TechnologyReview token={token} />
        <MarketAnalysis token={token} />
        <LegalRegulatory token={token} />
        <RiskAnalysis token={token} />
        <CommunityEcosystem token={token} />
        <ReportConclusion token={token} />
        <ReportAppendices token={token} />
      </main>
    </div>
  );
}
