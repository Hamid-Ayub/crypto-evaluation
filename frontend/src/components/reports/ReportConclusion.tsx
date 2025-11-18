import { TokenRecord } from "@/types/token";
import { CheckCircle2, XCircle, TrendingUp, AlertTriangle } from "lucide-react";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function ReportConclusion({ token }: Props) {
  const benchmarkScore = token.benchmarkScore;
  const riskLevel = token.risk;
  const conclusionLengthHint = getAiSectionLengthHint("reportConclusion");
  
  const getScoreCategory = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-[#3fe081]" };
    if (score >= 60) return { label: "Good", color: "text-[#8ee3ff]" };
    if (score >= 40) return { label: "Moderate", color: "text-[#f7c548]" };
    return { label: "Poor", color: "text-[#ff8a5c]" };
  };

  const scoreCategory = getScoreCategory(benchmarkScore);

  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-[#8ee3ff]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">10. Conclusion</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Overall assessment and long-term viability outlook
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overall Assessment */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Overall Assessment</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">
                Decentralization Score
              </p>
              <p className={`text-3xl font-bold ${scoreCategory.color}`}>
                {benchmarkScore.toFixed(1)}/100
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                {scoreCategory.label}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">
                Risk Level
              </p>
              <p className={`text-3xl font-bold ${
                riskLevel === "low" ? "text-[#3fe081]" :
                riskLevel === "medium" ? "text-[#f7c548]" :
                "text-[#ff8a5c]"
              }`}>
                {riskLevel.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#3fe081]" />
            <h3 className="text-lg font-semibold text-white">Strengths</h3>
          </div>
          <div className="space-y-2">
            {[
              {
                label: "Ownership Distribution",
                value: token.benchmarkDetails.ownership,
                threshold: 60,
                description: token.benchmarkDetails.ownership >= 60 
                  ? "Good token distribution with reasonable decentralization"
                  : "Moderate distribution, room for improvement"
              },
              {
                label: "Liquidity",
                value: token.benchmarkDetails.liquidity,
                threshold: 60,
                description: token.benchmarkDetails.liquidity >= 60
                  ? "Strong liquidity across DEX and CEX venues"
                  : "Adequate liquidity, could be improved"
              },
              {
                label: "Governance",
                value: token.benchmarkDetails.governance,
                threshold: 50,
                description: token.governanceDetail
                  ? "Active governance framework in place"
                  : "Limited governance activity detected"
              },
              {
                label: "Contract Security",
                value: token.contract?.verified ? 80 : 40,
                threshold: 60,
                description: token.contract?.verified
                  ? "Contract verified and auditable"
                  : "Contract verification status unclear"
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  item.value >= item.threshold
                    ? "border-[#3fe081]/30 bg-[#3fe081]/5"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[color:var(--color-text-muted)] mt-0.5">
                    {item.description}
                  </p>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-[#ff8a5c]" />
            <h3 className="text-lg font-semibold text-white">Weaknesses</h3>
          </div>
          <div className="space-y-2">
            {[
              {
                label: "Control Risk",
                value: token.benchmarkDetails.controlRisk,
                threshold: 40,
                description: token.benchmarkDetails.controlRisk > 40
                  ? "Elevated centralization risk detected"
                  : "Acceptable control risk levels"
              },
              {
                label: "Concentration",
                value: token.benchmarkDetails.gini,
                threshold: 0.5,
                description: token.benchmarkDetails.gini > 0.5
                  ? `High concentration (Gini: ${token.benchmarkDetails.gini.toFixed(2)})`
                  : "Reasonable distribution"
              },
              {
                label: "Governance Participation",
                value: token.benchmarkDetails.governance,
                threshold: 50,
                description: token.benchmarkDetails.governance < 50
                  ? "Low governance participation"
                  : "Adequate governance activity"
              },
            ]
              .filter(item => item.value > item.threshold || (item.label === "Governance Participation" && item.value < item.threshold))
              .map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-[#ff8a5c]/30 bg-[#ff8a5c]/5 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-[color:var(--color-text-muted)] mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {typeof item.value === "number" ? item.value.toFixed(1) : item.value}
                  </span>
                </div>
              ))}
            {token.contract?.upgradeable && (
              <div className="flex items-center justify-between rounded-lg border border-[#ff8a5c]/30 bg-[#ff8a5c]/5 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Upgradeable Contract</p>
                  <p className="text-xs text-[color:var(--color-text-muted)] mt-0.5">
                    Contract can be upgraded, introducing centralization risk
                  </p>
                </div>
                <AlertTriangle className="h-5 w-5 text-[#ff8a5c]" />
              </div>
            )}
          </div>
        </div>

        {/* Opportunities */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">Opportunities</h3>
          </div>
          <AiContentBlock
            tokenId={token.id}
            sectionId="reportConclusion"
            initialContent={token.aiSections?.reportConclusion?.content ?? ""}
            initialModel={token.aiSections?.reportConclusion?.model}
            initialUpdatedAt={token.aiSections?.reportConclusion?.updatedAt}
            initialSources={token.aiSections?.reportConclusion?.sources}
            helperText={`${conclusionLengthHint} Gemini synthesizes catalysts, risks, and watch items tailored to this token's current profile.`}
          />
        </div>

        {/* Long-term Viability Outlook */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Long-term Viability Outlook</h3>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              Based on the current analysis, the token demonstrates a decentralization score of <span className="font-semibold text-white">{benchmarkScore.toFixed(1)}/100</span>, 
              indicating a <span className="font-semibold text-white">{scoreCategory.label.toLowerCase()}</span> level of decentralization.
            </p>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Key Factors for Long-term Success:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-[color:var(--color-text-secondary)] ml-2">
                <li>Continued decentralization of token ownership</li>
                <li>Maintenance of strong liquidity across venues</li>
                <li>Active governance participation and community engagement</li>
                <li>Ongoing security audits and code quality improvements</li>
                <li>Regulatory compliance and adaptability</li>
              </ul>
            </div>
            <p className="text-xs text-[color:var(--color-text-muted)] mt-4">
              <span className="text-white/50">Note:</span> This assessment is based on current on-chain data and available information. 
              Long-term viability depends on ongoing project development, market conditions, and regulatory environment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

