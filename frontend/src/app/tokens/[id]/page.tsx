import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, BarChart3, DollarSign, Waves, Users, Shield, AlertTriangle, TrendingUp } from "lucide-react";
import ScoreIndicator from "@/components/shared/ScoreIndicator";
import TokenAvatar from "@/components/shared/TokenAvatar";
import RefreshButton from "@/components/tokens/RefreshButton";
import { fetchToken, formatUsd } from "@/lib/api";
import ResearchDashboard from "@/components/reports/ResearchDashboard";
import ReportAppendices from "@/components/reports/ReportAppendices";
// import ExecutiveSummary from "@/components/reports/ExecutiveSummary";
// import ProjectOverview from "@/components/reports/ProjectOverview";
// import TokenFundamentals from "@/components/reports/TokenFundamentals";
// import Tokenomics from "@/components/reports/Tokenomics";
// import TechnologyReview from "@/components/reports/TechnologyReview";
// import MarketAnalysis from "@/components/reports/MarketAnalysis";
// import LegalRegulatory from "@/components/reports/LegalRegulatory";
// import RiskAnalysis from "@/components/reports/RiskAnalysis";
// import CommunityEcosystem from "@/components/reports/CommunityEcosystem";
// import ReportConclusion from "@/components/reports/ReportConclusion";

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
  const aiReport = token.aiReport?.report;

  const riskMeta = {
    low: {
      label: "Low Risk",
    },
    medium: {
      label: "Medium Risk",
    },
    high: {
      label: "High Risk",
    },
  }[token.risk] ?? {
    label: "Risk Unknown",
  };

  const verdictMeta = aiReport ? {
    "Bullish": { color: "text-[#3fe081]", border: "border-[#3fe081]/30", bg: "bg-[#3fe081]/10" },
    "Bearish": { color: "text-[#ff8a5c]", border: "border-[#ff8a5c]/30", bg: "bg-[#ff8a5c]/10" },
    "Neutral": { color: "text-[#f7c548]", border: "border-[#f7c548]/30", bg: "bg-[#f7c548]/10" },
    "High Risk": { color: "text-[#ff4d4d]", border: "border-[#ff4d4d]/30", bg: "bg-[#ff4d4d]/10" },
  }[aiReport.executive_summary.verdict] || { color: "text-white", border: "border-white/20", bg: "bg-white/5" } : null;


  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-[#0a0a0f] to-black pb-16 pt-10 text-[color:var(--color-text-primary)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-8 lg:px-12">
        {/* Hero Section */}
        <header className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[color:var(--color-bg-card)] via-[#070a11] to-[color:var(--color-bg-card-alt)] p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_10%_20%,rgba(143,227,255,0.45),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(63,224,129,0.35),transparent_40%)] blur-3xl" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:text-[#8ee3ff]"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Back to benchmarks
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">Updated {token.updatedAt}</span>
                <RefreshButton chainId={token.chain} address={token.address} />
              </div>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <TokenAvatar avatar={token.avatar} symbol={token.symbol} size="xl" />
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70">
                      {token.chainLabel} • {token.category}
                    </div>
                    <h1 className="mt-3 text-5xl font-bold text-white lg:text-6xl">
                      {token.name}
                      <span className="text-2xl font-semibold text-[color:var(--color-text-muted)] ml-2">({token.symbol})</span>
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

                {aiReport ? (
                  <div className="relative max-w-4xl">
                    <div className="rounded-xl border border-[#8ee3ff]/20 bg-gradient-to-r from-[#8ee3ff]/5 to-[#3fe081]/5 p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8ee3ff]/10">
                            <BarChart3 className="h-5 w-5 text-[#8ee3ff]" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-sm font-bold uppercase tracking-widest text-[#8ee3ff]">AI Analyst Verdict</p>
                            {verdictMeta && (
                              <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${verdictMeta.color} ${verdictMeta.border} ${verdictMeta.bg}`}>
                                {aiReport.executive_summary.verdict}
                              </span>
                            )}
                          </div>
                          <p className="text-lg leading-relaxed text-white/90">
                            {aiReport.executive_summary.one_liner}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="max-w-3xl text-base leading-relaxed text-[color:var(--color-text-secondary)]">
                    {token.summary}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {token.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[color:var(--color-text-secondary)] backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Decentralization Score - Hero Section */}
              <div className="flex w-full flex-col gap-4 rounded-[32px] border border-white/10 bg-white/5/50 p-6 backdrop-blur-lg lg:max-w-sm">
                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-6">
                  <div className="mb-4 text-center">
                    <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Decentralization Score</p>
                    <p className="text-4xl font-bold text-white">{token.benchmarkScore.toFixed(1)}/100</p>
                  </div>
                  <div className="flex justify-center mb-4">
                    <ScoreIndicator
                      score={token.benchmarkScore}
                      id={`${token.id}-hero`}
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
                    <div className="text-center rounded-lg bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Ownership</p>
                      <p className="text-base font-semibold text-[#3fe081]">{token.benchmarkDetails.ownership.toFixed(0)}/100</p>
                    </div>
                    <div className="text-center rounded-lg bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Governance</p>
                      <p className="text-base font-semibold text-[#8ee3ff]">{token.benchmarkDetails.governance.toFixed(0)}/100</p>
                    </div>
                    <div className="text-center rounded-lg bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Liquidity</p>
                      <p className="text-base font-semibold text-[#f7c548]">{token.benchmarkDetails.liquidity.toFixed(0)}/100</p>
                    </div>
                    <div className="text-center rounded-lg bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Control Risk</p>
                      <p className="text-base font-semibold text-[#ff8a5c]">{token.benchmarkDetails.controlRisk.toFixed(0)}/100</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Full-Width Key Metrics Bar */}
        <div className="rounded-[24px] border border-white/10 bg-gradient-to-r from-[#070a11] to-[#0a0a0f] p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Market Cap",
                value: token.marketCapUsd ? formatUsd(token.marketCapUsd, { notation: "compact" }) : "—",
                icon: DollarSign,
                color: "text-[#3fe081]",
              },
              {
                label: "Liquidity",
                value: token.liquidityUsd ? formatUsd(token.liquidityUsd, { notation: "compact" }) : "N/A",
                icon: Waves,
                color: "text-[#8ee3ff]",
              },
              {
                label: "Holders",
                value: token.holders.toLocaleString(),
                icon: Users,
                color: "text-[#f7c548]",
              },
              {
                label: "Risk Level",
                value: riskMeta.label,
                icon: riskMeta.label === "Low Risk" ? Shield : riskMeta.label === "Medium Risk" ? AlertTriangle : AlertTriangle,
                color: riskMeta.label === "Low Risk" ? "text-[#3fe081]" : riskMeta.label === "Medium Risk" ? "text-[#f7c548]" : "text-[#ff8a5c]",
              },
            ].map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div key={metric.label} className="rounded-xl border border-white/10 bg-white/5/50 p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <IconComponent className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-white/40 mb-1">{metric.label}</p>
                  <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div id="full-report" className="sr-only" aria-hidden="true" />

        {/* Comprehensive Token Analysis Report */}
        <ResearchDashboard token={token} />
        {/* 
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
        */}
        <ReportAppendices token={token} />
      </main>
    </div>
  );
}
