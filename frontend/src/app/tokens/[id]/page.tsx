import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowUpRight, 
  Sparkles, 
  Trophy, 
  Shield, 
  Users, 
  TrendingUp, 
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Lock,
  Unlock
} from "lucide-react";
import ScoreIndicator from "@/components/shared/ScoreIndicator";
import Sparkline from "@/components/shared/Sparkline";
import TokenAvatar from "@/components/shared/TokenAvatar";
import RefreshButton from "@/components/tokens/RefreshButton";
import JsonLdButton from "@/components/tokens/JsonLdButton";
import { formatUsd, fetchToken } from "@/lib/api";

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

// Helper to format large numbers
function formatNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "N/A";
  if (num >= 1e18) return `${(num / 1e18).toFixed(2)}B`;
  if (num >= 1e15) return `${(num / 1e15).toFixed(2)}T`;
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
}

// Helper to format timelock delay
function formatTimelockDelay(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default async function TokenDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const token = await fetchToken(decodedId);
  if (!token) {
    notFound();
  }

  const explorerUrl = getExplorerUrl(token.chain, token.address);
  const benchmarkEntries = [
    { label: "Gini Coefficient", value: token.benchmarkDetails.gini.toFixed(2), description: "Measure of distribution inequality" },
    { label: "HHI", value: token.benchmarkDetails.hhi.toFixed(2), description: "Herfindahl-Hirschman Index for concentration" },
    { label: "Nakamoto Coefficient", value: token.benchmarkDetails.nakamoto.toString(), description: "Minimum entities to compromise network" },
    { label: "Liquidity Score", value: token.benchmarkDetails.liquidity.toString(), description: "DEX/CEX liquidity assessment" },
    { label: "Governance Score", value: token.benchmarkDetails.governance.toString(), description: "Governance participation metrics" },
    { label: "Ownership Score", value: token.benchmarkDetails.ownership.toString(), description: "Token distribution quality" },
    { label: "Control Risk", value: token.benchmarkDetails.controlRisk.toString(), description: "Centralization risk assessment" },
  ];

  const launchDateFormatted = token.marketData?.launch?.date
    ? new Date(token.marketData.launch.date * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const currentDataUpdated = token.marketData?.current?.updatedAt
    ? new Date(token.marketData.current.updatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-[#0a0a0f] to-black pb-16 pt-10 text-[color:var(--color-text-primary)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-8 lg:px-12">
        {/* Header Section */}
        <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[color:var(--color-bg-card)] to-[color:var(--color-bg-card-alt)] p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3fe081]/5 via-transparent to-[#8ee3ff]/5" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-between text-sm text-[color:var(--color-text-secondary)]">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:text-[#8ee3ff]"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Back to benchmarks
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/50">Last updated: {token.updatedAt}</span>
                <JsonLdButton chainId={token.chain} address={token.address} />
              </div>
            </div>
            
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <TokenAvatar avatar={token.avatar} symbol={token.symbol} size="lg" />
                  <div>
                    <h1 className="text-4xl font-bold text-white">
                      {token.name}{" "}
                      <span className="text-xl font-semibold text-[color:var(--color-text-muted)]">
                        ({token.symbol})
                      </span>
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="text-sm uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        {token.chainLabel} • {token.category}
                      </p>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                      >
                        {formatAddress(token.address)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
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
                </div>
              </div>
              
              <div className="rounded-[28px] border border-white/10 bg-[color:var(--color-bg-card-alt)] p-6 backdrop-blur-sm">
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
                <div className="mt-6 grid gap-3">
                  {benchmarkEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className="group rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-white/10 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-[color:var(--color-text-secondary)]">{entry.label}</p>
                          {entry.description && (
                            <p className="mt-0.5 text-[10px] text-white/40">{entry.description}</p>
                          )}
                        </div>
                        <span className="text-base font-semibold text-white">{entry.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Benchmark Trail Section */}
        <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                Benchmark trail
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Ten-sample rolling signal</h2>
              <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                Historical benchmark score progression over the last 10 samples
              </p>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/5 bg-black/20 p-6">
            <Sparkline data={token.sparkline} height={160} gradientId={`${token.id}-spark`} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {token.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                <p
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    stat.delta >= 0 ? "text-[#3fe081]" : "text-[#ff8a5c]"
                  }`}
                >
                  {stat.delta >= 0 ? "+" : ""}
                  {stat.delta}% vs previous sample
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contract Security Section */}
        {token.contract && (
          <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-[#8ee3ff]" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Contract Security Analysis</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  Smart contract security and upgradeability assessment
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">Verification Status</p>
                  {token.contract.verified ? (
                    <div className="flex items-center gap-2 text-[#3fe081]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-semibold">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#ff8a5c]">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-semibold">Unverified</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[color:var(--color-text-muted)]">Upgradeable</span>
                    <span className={`text-xs font-semibold ${token.contract.upgradeable ? "text-[#ff8a5c]" : "text-[#3fe081]"}`}>
                      {token.contract.upgradeable ? "Yes" : "No"}
                    </span>
                  </div>
                  {token.contract.proxyType && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[color:var(--color-text-muted)]">Proxy Type</span>
                      <span className="text-xs font-semibold text-white">{token.contract.proxyType}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[color:var(--color-text-muted)]">Pausable</span>
                    <span className={`text-xs font-semibold ${token.contract.pausable ? "text-[#ff8a5c]" : "text-[#3fe081]"}`}>
                      {token.contract.pausable ? "Yes" : "No"}
                    </span>
                  </div>
                  {token.contract.timelock && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[color:var(--color-text-muted)]">Timelock</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#8ee3ff]" />
                        <span className="text-xs font-semibold text-white">
                          {formatTimelockDelay(token.contract.timelock.delaySec)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 text-[10px] text-white/40">
                    Block: {token.contract.asOfBlock.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="mb-4 text-sm font-medium text-[color:var(--color-text-secondary)]">Access Control</p>
                <div className="space-y-3">
                  {token.contract.owner && (
                    <div>
                      <p className="text-xs text-[color:var(--color-text-muted)] mb-1">Owner</p>
                      <a
                        href={`${explorerUrl.replace("/address/", "/address/")}${token.contract.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                      >
                        {formatAddress(token.contract.owner)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {token.contract.proxyAdmin && (
                    <div>
                      <p className="text-xs text-[color:var(--color-text-muted)] mb-1">Proxy Admin</p>
                      <a
                        href={`${explorerUrl.replace("/address/", "/address/")}${token.contract.proxyAdmin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                      >
                        {formatAddress(token.contract.proxyAdmin)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {token.contract.implementation && (
                    <div>
                      <p className="text-xs text-[color:var(--color-text-muted)] mb-1">Implementation</p>
                      <a
                        href={`${explorerUrl.replace("/address/", "/address/")}${token.contract.implementation}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                      >
                        {formatAddress(token.contract.implementation)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {token.contract.roles && token.contract.roles.length > 0 && (
                    <div>
                      <p className="text-xs text-[color:var(--color-text-muted)] mb-2">Roles ({token.contract.roles.length})</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {token.contract.roles.slice(0, 5).map((role, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-white/70">{role.name}</span>
                            <a
                              href={`${explorerUrl.replace("/address/", "/address/")}${role.holder}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                            >
                              {formatAddress(role.holder)}
                            </a>
                          </div>
                        ))}
                        {token.contract.roles.length > 5 && (
                          <p className="text-[10px] text-white/40">+{token.contract.roles.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Ownership Distribution Section */}
        {token.holdersDetail && (
          <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-6 w-6 text-[#3fe081]" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Ownership Distribution</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  Token holder analysis and distribution metrics
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Total Supply</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(token.holdersDetail.totalSupply)}</p>
                {token.holdersDetail.freeFloat && (
                  <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                    Free float: {formatNumber(token.holdersDetail.freeFloat)}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Top 10% Share</p>
                <p className="mt-2 text-2xl font-semibold text-white">{token.holdersDetail.top10Pct.toFixed(1)}%</p>
                {token.holdersDetail.top1Pct && (
                  <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                    Top 1%: {token.holdersDetail.top1Pct.toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Holders</p>
                <p className="mt-2 text-2xl font-semibold text-white">{token.holders.toLocaleString()}</p>
                {token.holdersDetail.sampleSize && (
                  <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                    Sample: {token.holdersDetail.sampleSize} addresses
                  </p>
                )}
              </div>
            </div>
            {token.holdersDetail.contractSharePct !== undefined && token.holdersDetail.eoaSharePct !== undefined && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-3">Composition</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--color-text-secondary)]">Contract-held</span>
                      <span className="text-sm font-semibold text-white">{token.holdersDetail.contractSharePct.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--color-text-secondary)]">EOA-held</span>
                      <span className="text-sm font-semibold text-white">{token.holdersDetail.eoaSharePct.toFixed(1)}%</span>
                    </div>
                    {token.holdersDetail.coveragePct && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[color:var(--color-text-secondary)]">Coverage</span>
                        <span className="text-sm font-semibold text-white">{token.holdersDetail.coveragePct.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {token.holdersDetail.topHolders && token.holdersDetail.topHolders.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="mb-4 text-sm font-medium text-[color:var(--color-text-secondary)]">Top Holders</p>
                <div className="space-y-2">
                  {token.holdersDetail.topHolders.slice(0, 10).map((holder, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-white">
                          #{idx + 1}
                        </div>
                        <a
                          href={`${explorerUrl.replace("/address/", "/address/")}${holder.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                        >
                          {formatAddress(holder.address)}
                        </a>
                        {holder.label && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70">
                            {holder.label}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-white">{holder.pct.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {token.crossValidation?.sources && token.crossValidation.sources.length > 0 && (
              <div className="mt-4 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-3 text-xs text-[color:var(--color-text-muted)]">
                <p className="font-semibold text-white/70 mb-1">Data Sources:</p>
                <p>{token.crossValidation.sources.join(", ")}</p>
                {token.crossValidation.status && (
                  <p className="mt-1 text-[#3fe081]">{token.crossValidation.status}</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Liquidity Analysis Section */}
        {token.liquidityDetail && (
          <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-[#8ee3ff]" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Liquidity Analysis</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  DEX and CEX liquidity distribution across venues
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-3">Total Liquidity</p>
                <p className="text-2xl font-semibold text-white">{formatUsd(token.liquidityUsd, { notation: "compact" })}</p>
                {token.liquidityDetail.cexSharePct !== undefined && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--color-text-secondary)]">DEX Share</span>
                      <span className="text-sm font-semibold text-white">
                        {(100 - token.liquidityDetail.cexSharePct).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--color-text-secondary)]">CEX Share</span>
                      <span className="text-sm font-semibold text-white">
                        {token.liquidityDetail.cexSharePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {token.liquidityDetail.pools && token.liquidityDetail.pools.length > 0 && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="mb-4 text-sm font-medium text-[color:var(--color-text-secondary)]">
                    Liquidity Pools ({token.liquidityDetail.pools.length})
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {token.liquidityDetail.pools.map((pool, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-white">{pool.dex}</span>
                          <a
                            href={`${explorerUrl.replace("/address/", "/address/")}${pool.poolAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                          >
                            {formatAddress(pool.poolAddress)}
                          </a>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{formatUsd(pool.tvlUsd, { notation: "compact" })}</p>
                          <p className="text-xs text-white/50">{pool.sharePct.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-[10px] text-white/40">
              Block: {token.liquidityDetail.asOfBlock.toLocaleString()}
            </div>
          </section>
        )}

        {/* Governance Section */}
        {token.governanceDetail && (
          <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#f7c548]" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Governance</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  Governance framework and participation metrics
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {token.governanceDetail.framework && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-3">Framework</p>
                  <p className="text-lg font-semibold text-white">{token.governanceDetail.framework}</p>
                </div>
              )}
              {token.governanceDetail.quorumPct !== undefined && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-3">Quorum</p>
                  <p className="text-lg font-semibold text-white">{token.governanceDetail.quorumPct.toFixed(1)}%</p>
                </div>
              )}
            </div>
            {token.governanceDetail.turnoutHistory && token.governanceDetail.turnoutHistory.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="mb-4 text-sm font-medium text-[color:var(--color-text-secondary)]">
                  Turnout History ({token.governanceDetail.turnoutHistory.length} proposals)
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {token.governanceDetail.turnoutHistory.slice(0, 10).map((proposal, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-white/70">{proposal.proposalId.slice(0, 8)}...</span>
                        <span className="text-xs text-white/50">
                          {new Date(proposal.ts * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">{proposal.turnoutPct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Audit Information Section */}
        {token.audits && token.audits.length > 0 && (
          <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-[#3fe081]" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Security Audits</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  Third-party security audit reports
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {token.audits.map((audit, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{audit.firm}</p>
                    <span className="text-xs text-white/50">
                      {new Date(audit.date * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  {audit.severitySummary && (
                    <p className="mb-3 text-xs text-[color:var(--color-text-secondary)]">
                      {audit.severitySummary}
                    </p>
                  )}
                  <a
                    href={audit.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                  >
                    View Report
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Market Context Section */}
        {(token.marketData?.launch || token.marketData?.current) && (
          <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                Market context
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Research Information</h2>
              <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                Historical and current market position for due diligence context
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {token.marketData.launch && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                      At Launch (Historical)
                    </p>
                    {token.marketData.launch.source && (
                      <span className="text-[10px] text-white/40">
                        {token.marketData.launch.source}
                      </span>
                    )}
                  </div>
                  {launchDateFormatted && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        Launch Date
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">{launchDateFormatted}</p>
                    </div>
                  )}
                  {token.marketData.launch.marketCapUsd && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        Initial Market Cap
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {formatUsd(token.marketData.launch.marketCapUsd, { notation: "compact" })}
                      </p>
                    </div>
                  )}
                  {token.marketData.launch.priceUsd && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        Initial Price
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatUsd(token.marketData.launch.priceUsd)}
                      </p>
                    </div>
                  )}
                  {token.marketData.launch.sourceUrl && (
                    <a
                      href={token.marketData.launch.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                    >
                      View on {token.marketData.launch.source}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {token.marketData.current && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                      Current (Latest Snapshot)
                    </p>
                    {token.marketData.current.source && (
                      <span className="text-[10px] text-white/40">
                        {token.marketData.current.source}
                      </span>
                    )}
                  </div>
                  {currentDataUpdated && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        Updated
                      </p>
                      <p className="mt-1 text-xs font-semibold text-white">{currentDataUpdated}</p>
                    </div>
                  )}
                  {token.marketData.current.marketCapUsd && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        Market Cap
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {formatUsd(token.marketData.current.marketCapUsd, { notation: "compact" })}
                      </p>
                    </div>
                  )}
                  {token.marketData.current.priceUsd && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        Current Price
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatUsd(token.marketData.current.priceUsd)}
                      </p>
                    </div>
                  )}
                  {token.marketData.current.volume24hUsd && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                        24h Volume
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatUsd(token.marketData.current.volume24hUsd, { notation: "compact" })}
                      </p>
                    </div>
                  )}
                  {token.marketData.current.sourceUrl && (
                    <a
                      href={token.marketData.current.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                    >
                      View on {token.marketData.current.source}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 rounded-lg border border-dashed border-white/10 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
              <p className="font-semibold text-white/70 mb-1">Note:</p>
              <p>
                Market data provided for research context only. For real-time trading data, visit exchanges directly.
              </p>
            </div>
          </section>
        )}

        {/* Proof of Diligence Section */}
        <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-[#f7c548]" />
            <div>
              <h2 className="text-2xl font-semibold text-white">Proof of Diligence</h2>
              <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                Evidencing decentralization across key pillars
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Ownership dispersion",
                description:
                  "Top holder share, timelocked contracts, and treasury wallets across the last block sample.",
                icon: Users,
              },
              {
                title: "Liquidity venues",
                description:
                  "DEX + CEX mix, pool addresses, and depth assumptions underpinning liquidity sub-scores.",
                icon: TrendingUp,
              },
              {
                title: "Governance liveliness",
                description:
                  "Turnout, quorum targets, and vote escrow trends from Snapshot/Tally lookups.",
                icon: FileText,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm"
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.35em] text-white">
                  <item.icon className="h-3.5 w-3.5 text-[#8ee3ff]" />
                  Pillar
                </div>
                <p className="text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
