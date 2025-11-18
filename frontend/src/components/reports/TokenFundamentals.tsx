import { TokenRecord } from "@/types/token";
import { Coins, Settings, Zap } from "lucide-react";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function TokenFundamentals({ token }: Props) {
  const tokenType = token.category === "stablecoin" ? "Stablecoin" : "Utility Token";
  const fundamentalsLengthHint = getAiSectionLengthHint("tokenFundamentals");
  
  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Coins className="h-6 w-6 text-[#f7c548]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">3. Token Fundamentals</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Token utility, type, and design mechanisms
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Token Utility */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#3fe081]" />
            <h3 className="text-lg font-semibold text-white">3.1 Token Utility</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Governance", value: token.governanceDetail ? "Yes" : "Unknown", icon: "🗳️" },
              { label: "Payments", value: "Unknown", icon: "💳" },
              { label: "Staking / Validation", value: "Unknown", icon: "🔒" },
              { label: "Access Rights", value: "Unknown", icon: "🔑" },
              { label: "Gas Fees", value: token.chain.includes("eip155:1") ? "No (ERC-20)" : "Unknown", icon: "⛽" },
              { label: "Rewards", value: "Unknown", icon: "🎁" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-[color:var(--color-text-secondary)]">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[color:var(--color-text-muted)]">
            Utility information can be enhanced with smart contract analysis or project documentation parsing.
          </p>
        </div>

        {/* Token Type */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">3.2 Token Type</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-sm text-[color:var(--color-text-secondary)]">Primary Classification</span>
              <span className="text-base font-semibold text-white">{tokenType}</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                { label: "Utility Token", checked: token.category !== "stablecoin" },
                { label: "Governance Token", checked: !!token.governanceDetail },
                { label: "Security Token", checked: false },
                { label: "Stablecoin", checked: token.category === "stablecoin" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg border p-2 ${
                    item.checked
                      ? "border-[#3fe081]/30 bg-[#3fe081]/5"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      item.checked ? "bg-[#3fe081]" : "bg-white/20"
                    }`}
                  />
                  <span className="text-sm text-[color:var(--color-text-secondary)]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Token Design / Mechanism */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#c784ff]" />
            <h3 className="text-lg font-semibold text-white">3.3 Token Design / Mechanism</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Consensus mechanism (if applicable)
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                {token.chainLabel} network consensus mechanism. Token-specific mechanisms require contract analysis.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Token sinks (burns, fees, etc.)
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires contract analysis]</span> Burn mechanisms and fee structures can be identified through smart contract analysis.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Token sources (issuance, inflation schedule)
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires contract analysis]</span> Issuance schedule and inflation mechanisms require smart contract analysis or documentation review.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Incentive mechanisms
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires project research]</span> Staking rewards, yield mechanisms, and other incentives require project documentation review.
              </p>
            </div>
          </div>
        </div>

        {/* AI Narrative */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#c784ff]" />
            <h3 className="text-lg font-semibold text-white">3.4 Analyst Narrative</h3>
          </div>
          <AiContentBlock
            tokenId={token.id}
            sectionId="tokenFundamentals"
            title="AI View: Utility & Architecture"
            description="Gemini summarizes how the token is positioned, why it exists, and any architecture signals that impact utility."
            initialContent={token.aiSections?.tokenFundamentals?.content ?? null}
            initialModel={token.aiSections?.tokenFundamentals?.model}
            initialUpdatedAt={token.aiSections?.tokenFundamentals?.updatedAt}
            initialSources={token.aiSections?.tokenFundamentals?.sources}
            helperText={`${fundamentalsLengthHint} Grounded with fresh Google Search citations for architectural accuracy.`}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">Implementation Note:</p>
        <p>Enhanced utility detection can be achieved through smart contract analysis micro-service. Token design mechanisms require contract introspection or documentation parsing.</p>
      </div>
    </section>
  );
}

