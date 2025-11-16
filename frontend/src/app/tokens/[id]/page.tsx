import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Sparkles, Trophy } from "lucide-react";
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

export default async function TokenDetailPage({ params }: PageProps) {
  const { id } = await params;
  const token = await fetchToken(id);
  if (!token) {
    notFound();
  }

  const benchmarkEntries = [
    { label: "Gini Coefficient", value: token.benchmarkDetails.gini.toFixed(2) },
    { label: "HHI", value: token.benchmarkDetails.hhi.toFixed(2) },
    { label: "Nakamoto Coefficient", value: token.benchmarkDetails.nakamoto.toString() },
    { label: "Liquidity Score", value: token.benchmarkDetails.liquidity.toString() },
    { label: "Governance Score", value: token.benchmarkDetails.governance.toString() },
  ];

  const statHighlights = [
    { label: "Market cap", value: formatUsd(token.marketCapUsd, { notation: "compact" }) },
    { label: "Liquidity", value: formatUsd(token.liquidityUsd, { notation: "compact" }) },
    { label: "24h Volume", value: formatUsd(token.volume24hUsd, { notation: "compact" }) },
    { label: "Holders", value: token.holders.toLocaleString() },
  ];

  return (
    <div className="min-h-screen w-full pb-16 pt-10 text-[color:var(--color-text-primary)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-8 lg:px-12">
        <header className="space-y-6 rounded-[32px] border border-white/10 bg-[color:var(--color-bg-card)] p-6 sm:p-8">
          <div className="flex items-center justify-between text-sm text-[color:var(--color-text-secondary)]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white transition hover:text-[#8ee3ff]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to benchmarks
            </Link>
            <span>{token.updatedAt}</span>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <TokenAvatar avatar={token.avatar} symbol={token.symbol} size="lg" />
                <div>
                  <h1 className="text-3xl font-semibold text-white">
                    {token.name}{" "}
                    <span className="text-base text-[color:var(--color-text-muted)]">
                      ({token.symbol})
                    </span>
                  </h1>
                  <p className="text-sm uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                    {token.chainLabel} • {token.category}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[color:var(--color-text-secondary)]">{token.summary}</p>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--color-text-secondary)]">
                {token.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/tokens/${token.id}/report`}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3fe081] to-[#8ee3ff] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                >
                  Generate diligence brief
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <RefreshButton chainId={token.chain} address={token.address} />
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[color:var(--color-bg-card-alt)] p-5">
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
              <div className="mt-4 grid gap-3 text-sm text-[color:var(--color-text-secondary)]">
                {benchmarkEntries.map((entry) => (
                  <div
                    key={entry.label}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2"
                  >
                    <span>{entry.label}</span>
                    <span className="text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                  Benchmark trail
                </p>
                <h2 className="text-xl font-semibold text-white">Ten-sample rolling signal</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--color-text-secondary)]">
                Sparkline
              </span>
            </div>
            <div className="mt-4 rounded-[24px] border border-white/5 bg-black/20 p-4">
              <Sparkline data={token.sparkline} height={120} gradientId={`${token.id}-spark`} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {token.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-[color:var(--color-text-secondary)]"
                >
                  <p className="text-xs uppercase tracking-[0.35em]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                  <p
                    className={`text-xs ${
                      stat.delta >= 0 ? "text-[#3fe081]" : "text-[#ff8a5c]"
                    }`}
                  >
                    {stat.delta >= 0 ? "+" : ""}
                    {stat.delta}% vs previous sample
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
              Instrument telemetry
            </p>
            {statHighlights.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]"
              >
                <p className="text-xs uppercase tracking-[0.35em]">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-[color:var(--color-text-secondary)]">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                Risk insights
              </p>
              <p className="mt-2">
                Benchmark leans {token.risk} risk. Submit governance proofs or new audits to shift
                posture.
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f7c548] to-[#ff8a5c] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110"
              >
                Push update packet
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                Proof of diligence
              </p>
              <h2 className="text-xl font-semibold text-white">Evidencing decentralization</h2>
            </div>
            <JsonLdButton chainId={token.chain} address={token.address} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Ownership dispersion",
                description:
                  "Top holder share, timelocked contracts, and treasury wallets across the last block sample.",
              },
              {
                title: "Liquidity venues",
                description:
                  "DEX + CEX mix, pool addresses, and depth assumptions underpinning liquidity sub-scores.",
              },
              {
                title: "Governance liveliness",
                description:
                  "Turnout, quorum targets, and vote escrow trends from Snapshot/Tally lookups.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-[color:var(--color-text-secondary)]"
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white">
                  <Trophy className="h-3.5 w-3.5 text-[#8ee3ff]" />
                  Pillar
                </div>
                <p className="text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

