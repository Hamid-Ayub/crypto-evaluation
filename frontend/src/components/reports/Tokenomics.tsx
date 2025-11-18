import { TokenRecord } from "@/types/token";
import { TrendingUp, PieChart, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/api";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function Tokenomics({ token }: Props) {
  const totalSupply = token.holdersDetail?.totalSupply || "0";
  const circulatingSupply = token.holdersDetail?.freeFloat || "Unknown";
  const tokenomicsLengthHint = getAiSectionLengthHint("tokenomics");
  
  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-[#3fe081]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">4. Token Economics (Tokenomics)</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Supply, allocation, and vesting schedules
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#3fe081]" />
          <h3 className="text-lg font-semibold text-white">4.4 AI Tokenomics Brief</h3>
        </div>
        <AiContentBlock
          tokenId={token.id}
          sectionId="tokenomics"
          title="AI View: Supply & Incentives"
          description="Gemini explains supply dynamics, float risks, and liquidity considerations using grounded data."
          initialContent={token.aiSections?.tokenomics?.content ?? null}
          initialModel={token.aiSections?.tokenomics?.model}
          initialUpdatedAt={token.aiSections?.tokenomics?.updatedAt}
          initialSources={token.aiSections?.tokenomics?.sources}
          helperText={`${tokenomicsLengthHint} Use when you need a narrative that ties concentration and liquidity signals together.`}
        />
      </div>

      <div className="space-y-6">
        {/* Supply Overview */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">4.1 Supply Overview</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Initial Supply</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatNumber(totalSupply)}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Max Supply</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {token.holdersDetail?.totalSupply ? formatNumber(totalSupply) : "Unknown"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {token.holdersDetail?.totalSupply ? "Capped" : "[Requires contract analysis]"}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Circulating Supply</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {typeof circulatingSupply === "string" && circulatingSupply !== "Unknown" 
                  ? formatNumber(circulatingSupply) 
                  : circulatingSupply}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Emission Schedule</p>
              <p className="mt-2 text-lg font-semibold text-white">Unknown</p>
              <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                [Requires contract analysis]
              </p>
            </div>
          </div>
        </div>

        {/* Allocation Breakdown */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-[#f7c548]" />
            <h3 className="text-lg font-semibold text-white">4.2 Allocation Breakdown</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Team", value: "Unknown", color: "bg-[#3fe081]" },
              { label: "Advisors", value: "Unknown", color: "bg-[#8ee3ff]" },
              { label: "Investors", value: "Unknown", color: "bg-[#f7c548]" },
              { label: "Foundation / Treasury", value: "Unknown", color: "bg-[#c784ff]" },
              { label: "Ecosystem / Community", value: "Unknown", color: "bg-[#ff8a5c]" },
              { label: "Liquidity", value: "Unknown", color: "bg-[#636b84]" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[color:var(--color-text-muted)]">
            Allocation data requires on-chain analysis of token distribution, vesting contracts, or project documentation.
          </p>
        </div>

        {/* Vesting & Release Schedules */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#c784ff]" />
            <h3 className="text-lg font-semibold text-white">4.3 Vesting & Release Schedules</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Lock-up periods
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires contract analysis]</span> Lock-up periods can be identified through vesting contract analysis or project documentation.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Cliff and vesting duration
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires contract analysis]</span> Vesting schedules require smart contract analysis of vesting contracts or token distribution contracts.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Upcoming unlock events
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires contract analysis]</span> Unlock events can be calculated from vesting contract schedules or tracked through on-chain monitoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">Implementation Note:</p>
        <p>Tokenomics data can be enhanced through: (1) Smart contract analysis micro-service for supply/emission, (2) On-chain vesting contract detection, (3) Project documentation parsing, or (4) Specialized tokenomics APIs.</p>
      </div>
    </section>
  );
}

