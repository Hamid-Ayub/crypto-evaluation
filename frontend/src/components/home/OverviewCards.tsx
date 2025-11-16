import { TokenRecord } from "@/types/token";
import { ScoreLookupResult, formatUsd } from "@/lib/api";
import { ArrowUpRight, Gauge, Layers, ShieldCheck } from "lucide-react";

type Props = {
  tokens: TokenRecord[];
  lastLookup?: ScoreLookupResult | null;
};

const cardBase =
  "card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-5 flex flex-col gap-3";

export default function OverviewCards({ tokens, lastLookup }: Props) {
  const avgBenchmark =
    tokens.reduce((sum, token) => sum + token.benchmarkScore, 0) / tokens.length;
  const liquidityValues = [...tokens].map((token) => token.liquidityUsd).sort((a, b) => a - b);
  const medianLiquidity =
    liquidityValues.length > 0
      ? liquidityValues[Math.floor(liquidityValues.length / 2)]
      : 0;
  const riskBreakdown = tokens.reduce(
    (acc, token) => {
      acc[token.risk] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 },
  );

  const cards = [
    {
      label: "Assets benchmarked",
      value: tokens.length.toString(),
      subLabel: "Across 5 priority ecosystems",
      icon: <Layers className="h-5 w-5 text-[#8ee3ff]" />,
    },
    {
      label: "Average benchmark",
      value: `${avgBenchmark.toFixed(1)} / 100`,
      subLabel: "Liquidity-weighted",
      icon: <Gauge className="h-5 w-5 text-[#3fe081]" />,
    },
    {
      label: "Median liquidity",
      value: formatUsd(medianLiquidity, { notation: "compact" }),
      subLabel: "Per asset in scope",
      icon: <ShieldCheck className="h-5 w-5 text-[#f7c548]" />,
    },
    {
      label: "Last fetched score",
      value: lastLookup?.totalScore ? `${lastLookup.totalScore}/100` : "—",
      subLabel: lastLookup?.name ?? "Awaiting lookup",
      icon: <ArrowUpRight className="h-5 w-5 text-[#c784ff]" />,
    },
  ];

  const topLiquidity = tokens
    .slice()
    .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
    .slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className={cardBase}>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                {card.label}
              </p>
              {card.icon}
            </div>
            <p className="text-3xl font-semibold text-white">{card.value}</p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {card.subLabel}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                Liquidity anchors
              </p>
              <h2 className="text-xl font-semibold text-white">Who underwrites the benchmark</h2>
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                We weight distribution, liquidity, and governance inputs so diligence teams can compare like-for-like signals.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-[color:var(--color-text-secondary)]">
                CSV / JSON-LD export
              </span>
              <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-[color:var(--color-text-secondary)]">
                Tooltip sub-scores
              </span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {topLiquidity.map((token) => (
              <div
                key={token.id}
                className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{token.avatar}</span>
                  <div>
                    <p className="text-base font-semibold text-white">{token.name}</p>
                    <p className="text-xs text-[color:var(--color-text-secondary)]">
                      {token.chainLabel} • {token.symbol}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-[color:var(--color-text-secondary)]">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em]">Liquidity</dt>
                    <dd className="mt-1 text-white">
                      {formatUsd(token.liquidityUsd, { notation: "compact" })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em]">Benchmark</dt>
                    <dd className="mt-1 text-white">{token.benchmarkScore}/100</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--color-text-secondary)]">
                  {token.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            Risk posture
          </p>
          {(["low", "medium", "high"] as const).map((level) => {
            const count = riskBreakdown[level];
            const pct = (count / tokens.length) * 100 || 0;
            const tone =
              level === "low" ? "#3fe081" : level === "medium" ? "#f7c548" : "#ff8a5c";
            return (
              <div key={level} className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em]">
                  <span className="capitalize">{level} risk</span>
                  <span>{count} assets</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: tone }}
                  />
                </div>
              </div>
            );
          })}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-[color:var(--color-text-secondary)]">
            {lastLookup ? (
              <>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Last lookup context
                </p>
                <p className="mt-1 text-base text-white">
                  {lastLookup.name ?? lastLookup.symbol ?? lastLookup.address}
                </p>
                <p>Score {lastLookup.totalScore ?? "pending"} • {lastLookup.chainId}</p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Awaiting search
                </p>
                <p>Use the hero lookup to bring an asset into focus.</p>
              </>
            )}
          </div>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Benchmarks are versioned; expect calc version bumps when weightings shift.
          </p>
        </article>
      </div>
    </section>
  );
}

