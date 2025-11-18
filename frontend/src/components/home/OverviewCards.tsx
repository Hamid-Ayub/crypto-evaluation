import { TokenRecord } from "@/types/token";
import { ScoreLookupResult, formatUsd } from "@/lib/api";
import { ArrowUpRight, Gauge, Layers, ShieldCheck } from "lucide-react";
import TokenAvatar from "@/components/shared/TokenAvatar";

type Props = {
  tokens: TokenRecord[];
  lastLookup?: ScoreLookupResult | null;
};

export default function OverviewCards({ tokens, lastLookup }: Props) {
  const avgBenchmark =
    tokens.length > 0
      ? tokens.reduce((sum, token) => sum + token.benchmarkScore, 0) / tokens.length
      : 0;
  const liquidityValues = [...tokens].map((token) => token.liquidityUsd).sort((a, b) => a - b);
  const medianLiquidity =
    liquidityValues.length > 0
      ? liquidityValues[Math.floor(liquidityValues.length / 2)]
      : 0;
  const totalLiquidity = tokens.reduce((sum, token) => sum + token.liquidityUsd, 0);
  const totalHolders = tokens.reduce((sum, token) => sum + token.holders, 0);
  const avgGini = tokens.length > 0
    ? tokens.reduce((sum, token) => sum + token.benchmarkDetails.gini, 0) / tokens.length
    : 0;
  const avgNakamoto = tokens.length > 0
    ? tokens.reduce((sum, token) => sum + token.benchmarkDetails.nakamoto, 0) / tokens.length
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
      subLabel: `Across ${new Set(tokens.map(t => t.chain)).size} chains`,
      icon: <Layers className="h-5 w-5 text-[#8ee3ff]" />,
    },
    {
      label: "Average benchmark",
      value: `${avgBenchmark.toFixed(1)}`,
      subLabel: `Nakamoto: ${avgNakamoto.toFixed(1)} avg`,
      icon: <Gauge className="h-5 w-5 text-[#3fe081]" />,
    },
    {
      label: "Total DEX liquidity",
      value: formatUsd(totalLiquidity, { notation: "compact" }),
      subLabel: "Across all DEX pools",
      icon: <ShieldCheck className="h-5 w-5 text-[#f7c548]" />,
    },
    {
      label: "Total holders",
      value: totalHolders.toLocaleString(),
      subLabel: `Gini: ${avgGini.toFixed(3)} avg`,
      icon: <ArrowUpRight className="h-5 w-5 text-[#c784ff]" />,
    },
  ];

  const topLiquidity = tokens
    .slice()
    .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
    .slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                {card.label}
              </p>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-[10px] text-[color:var(--color-text-secondary)]">
              {card.subLabel}
            </p>
          </article>
        ))}
      </div>

      {topLiquidity.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-3">
            Top DEX liquidity assets
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {topLiquidity.map((token) => (
              <div
                key={token.id}
                className="rounded-lg border border-white/5 bg-black/20 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TokenAvatar avatar={token.avatar} symbol={token.symbol} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{token.name}</p>
                    <p className="text-[10px] text-[color:var(--color-text-muted)]">
                      {token.chainLabel}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                      Score
                    </p>
                    <p className="text-sm font-semibold text-white">{token.benchmarkScore}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
                      Nakamoto
                    </p>
                    <p className="text-sm font-semibold text-white">{token.benchmarkDetails.nakamoto}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

