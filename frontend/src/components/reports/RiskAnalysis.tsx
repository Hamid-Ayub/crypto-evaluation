import { TokenRecord } from "@/types/token";
import { AlertTriangle } from "lucide-react";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function RiskAnalysis({ token }: Props) {
  const riskLevel = token.risk;
  const riskLengthHint = getAiSectionLengthHint("riskAnalysis");
  const riskColor = {
    low: "text-[#3fe081]",
    medium: "text-[#f7c548]",
    high: "text-[#ff8a5c]",
  }[riskLevel];

  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-[#ff8a5c]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">8. Risk Analysis</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Comprehensive risk assessment across multiple dimensions
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[#ff8a5c]" />
          <h3 className="text-lg font-semibold text-white">8.6 AI Risk Outlook</h3>
        </div>
        <AiContentBlock
          tokenId={token.id}
          sectionId="riskAnalysis"
          title="AI View: Risk Radar"
          description="Gemini flags the most material technical, governance, and market risks from the current dataset."
          initialContent={token.aiSections?.riskAnalysis?.content ?? null}
          initialModel={token.aiSections?.riskAnalysis?.model}
          initialUpdatedAt={token.aiSections?.riskAnalysis?.updatedAt}
          initialSources={token.aiSections?.riskAnalysis?.sources}
          helperText={`${riskLengthHint} Handy for quick briefings before deeper manual diligence.`}
        />
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Overall Risk Level</h3>
            <span className={`text-lg font-bold ${riskColor} uppercase`}>{riskLevel}</span>
          </div>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Based on decentralization benchmark score: {token.benchmarkScore.toFixed(1)}/100
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Technical Risks */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Technical Risks</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Smart Contract Vulnerabilities
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {token.contract?.verified ? "✅ Contract verified" : "⚠️ Contract unverified"}
                  {token.contract?.upgradeable && " • ⚠️ Upgradeable contract"}
                  {token.contract?.pausable && " • ⚠️ Pausable contract"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Audit Coverage
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {token.audits && token.audits.length > 0
                    ? `✅ ${token.audits.length} audit(s) completed`
                    : "⚠️ No audits found"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Code Quality
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires GitHub analysis]</span> Code quality metrics require repository analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Market Risks */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Market Risks</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Liquidity Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  Liquidity Score: {token.benchmarkDetails.liquidity}/100
                  {token.liquidityDetail?.cexSharePct !== undefined && (
                    <span> • CEX: {token.liquidityDetail.cexSharePct.toFixed(1)}%</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Volatility
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires price history analysis]</span> Volatility metrics require historical price data.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Market Manipulation Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires on-chain analysis]</span> Wash trading and manipulation detection requires transaction analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Regulatory Risks */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Regulatory Risks</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Securities Classification Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires legal analysis]</span> See Legal & Regulatory section for detailed assessment.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Jurisdictional Compliance
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires legal research]</span> Compliance status varies by jurisdiction.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Enforcement Actions
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires regulatory database]</span> Check SEC, CFTC, and other regulatory databases.
                </p>
              </div>
            </div>
          </div>

          {/* Token Supply Risks */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Token Supply Risks</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Unlock Pressure
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires vesting analysis]</span> Upcoming unlocks can create selling pressure.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Concentration Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  Top 10%: {token.holdersDetail?.top10Pct.toFixed(1)}% • 
                  Gini: {token.benchmarkDetails.gini.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Low Liquidity Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {token.liquidityUsd < 1_000_000 ? "⚠️ Low liquidity" : "✅ Adequate liquidity"}
                </p>
              </div>
            </div>
          </div>

          {/* Governance Risks */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Governance Risks</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Centralization Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  Control Risk Score: {token.benchmarkDetails.controlRisk}/100
                  {token.contract?.owner && " • ⚠️ Single owner address"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Participation Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  Governance Score: {token.benchmarkDetails.governance}/100
                  {token.governanceDetail?.turnoutHistory && (
                    <span> • {token.governanceDetail.turnoutHistory.length} proposals tracked</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Proposal Execution Risk
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires governance analysis]</span> Review proposal execution history and timelock mechanisms.
                </p>
              </div>
            </div>
          </div>

          {/* Team/Operational Risks */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Team/Operational Risks</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Team Transparency
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires project research]</span> Team information requires manual verification.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Development Activity
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires GitHub analysis]</span> Code activity metrics require repository access.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">
                  Operational Continuity
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires ongoing monitoring]</span> Track project updates, announcements, and community engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">Implementation Note:</p>
        <p>Risk analysis can be enhanced with: (1) Automated vulnerability scanning, (2) Price volatility calculations, (3) On-chain manipulation detection, (4) Regulatory database integration, (5) Vesting schedule analysis, (6) GitHub activity monitoring.</p>
      </div>
    </section>
  );
}

