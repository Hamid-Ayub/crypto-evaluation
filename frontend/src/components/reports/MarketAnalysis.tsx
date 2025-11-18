import { TokenRecord } from "@/types/token";
import { TrendingUp, BarChart3, Users, ExternalLink } from "lucide-react";
import { formatUsd } from "@/lib/api";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function MarketAnalysis({ token }: Props) {
  const currentPrice = token.marketData?.current?.priceUsd;
  const marketLengthHint = getAiSectionLengthHint("marketAnalysis");
  const marketCap = token.marketData?.current?.marketCapUsd || token.marketCapUsd;
  const volume24h = token.marketData?.current?.volume24hUsd || token.volume24hUsd;
  const exchangeListings = token.marketData?.listings ?? [];
  const topListings = exchangeListings.slice(0, 4);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp * 1000));
  };
  
  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-[#3fe081]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">6. Market Analysis</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Market performance, competitors, and demand drivers
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#3fe081]" />
          <h3 className="text-lg font-semibold text-white">6.4 AI Market Narrative</h3>
        </div>
        <AiContentBlock
          tokenId={token.id}
          sectionId="marketAnalysis"
          title="AI View: Market Structure"
          description="Gemini synthesizes liquidity, venue quality, and demand catalysts with grounded citations."
          initialContent={token.aiSections?.marketAnalysis?.content ?? null}
          initialModel={token.aiSections?.marketAnalysis?.model}
          initialUpdatedAt={token.aiSections?.marketAnalysis?.updatedAt}
          initialSources={token.aiSections?.marketAnalysis?.sources}
          helperText={`${marketLengthHint} Use for competitor positioning and exchange depth narratives.`}
        />
      </div>

      <div className="space-y-6">
        {/* Market Performance */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">6.1 Market Performance</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Current Price</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {currentPrice ? formatUsd(currentPrice) : "N/A"}
              </p>
              {token.marketData?.current?.source && (
                <p className="mt-1 text-[10px] text-[color:var(--color-text-muted)]">
                  Source: {token.marketData.current.source}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Market Cap</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {marketCap ? formatUsd(marketCap, { notation: "compact" }) : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">24h Volume</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {volume24h ? formatUsd(volume24h, { notation: "compact" }) : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Liquidity</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {token.liquidityUsd ? formatUsd(token.liquidityUsd, { notation: "compact" }) : "N/A"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Exchange Listings
              </p>
              {topListings.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {topListings.map((listing) => (
                    <div
                      key={`${listing.exchange}-${listing.pair}`}
                      className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{listing.exchange}</p>
                          <p className="text-xs text-[color:var(--color-text-muted)]">{listing.pair}</p>
                        </div>
                        {listing.trustScore && (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-text-muted)]">
                            {listing.trustScore}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
                          <span>Price</span>
                          <span className="font-semibold text-white">
                            {listing.priceUsd ? formatUsd(listing.priceUsd) : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
                          <span>24h Volume</span>
                          <span className="font-semibold text-white">
                            {listing.volume24hUsd ? formatUsd(listing.volume24hUsd, { notation: "compact" }) : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
                          <span>Venue</span>
                          <span className="font-semibold text-white">
                            {listing.isDex ? "DEX" : "CEX"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-[color:var(--color-text-muted)]">
                        <span>
                          {listing.lastTradedAt
                            ? `Updated ${formatTimestamp(listing.lastTradedAt)}`
                            : "Fresh via CoinGecko"}
                        </span>
                        {listing.url && (
                          <a
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8ee3ff] hover:text-[#8ee3ff]/80"
                          >
                            Trade
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--color-text-muted)]">
                  No exchange listing data yet. Trigger a refresh to pull live markets from CoinGecko.
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Liquidity Conditions
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-xs text-[color:var(--color-text-muted)]">DEX Liquidity</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {token.liquidityDetail?.cexSharePct !== undefined
                      ? `${(100 - token.liquidityDetail.cexSharePct).toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-xs text-[color:var(--color-text-muted)]">CEX Liquidity</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {token.liquidityDetail?.cexSharePct !== undefined
                      ? `${token.liquidityDetail.cexSharePct.toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competitor Landscape */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#f7c548]" />
            <h3 className="text-lg font-semibold text-white">6.2 Competitor Landscape</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Comparable Projects
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires market analysis API or AI]</span> Competitor identification can be done through category analysis, market cap comparison, or AI-powered similarity analysis.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Differentiators
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires project research or AI analysis]</span> Key differentiators can be extracted from project documentation or generated using AI comparison analysis.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Relative Advantages & Weaknesses
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires comprehensive analysis or AI]</span> Comparative analysis can be performed using AI tools or manual research comparing features, tokenomics, and market position.
              </p>
            </div>
          </div>
        </div>

        {/* Demand Drivers */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#c784ff]" />
            <h3 className="text-lg font-semibold text-white">6.3 Demand Drivers</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Usage Metrics
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[color:var(--color-text-muted)]">Total Holders</span>
                  <span className="text-sm font-semibold text-white">{token.holders.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[color:var(--color-text-muted)]">Active Addresses</span>
                  <span className="text-sm font-semibold text-white">
                    <span className="text-white/50">[Requires on-chain analysis]</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[color:var(--color-text-muted)]">Transaction Volume</span>
                  <span className="text-sm font-semibold text-white">
                    <span className="text-white/50">[Requires on-chain analysis]</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Community Growth
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires social media API integration]</span> Community metrics can be sourced from Twitter/X, Discord, Telegram APIs, or social analytics platforms.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Institutional Interest
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires manual research]</span> Institutional holdings and interest typically require on-chain analysis of known institutional wallets or manual research.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Network Effects
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires ecosystem analysis]</span> Network effects can be measured through integration counts, partnership announcements, or ecosystem mapping.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">Implementation Note:</p>
        <p>Market analysis can be enhanced with: (1) CoinGecko/CoinMarketCap APIs for exchange listings, (2) On-chain analytics for usage metrics, (3) Social media APIs for community growth, (4) AI-powered competitor analysis, (5) Institutional wallet tracking services.</p>
      </div>
    </section>
  );
}

