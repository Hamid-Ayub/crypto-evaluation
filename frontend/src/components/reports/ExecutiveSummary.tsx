import { TokenRecord } from "@/types/token";
import { FileText, Calendar, Network, Target, CheckCircle2, Clock } from "lucide-react";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function ExecutiveSummary({ token }: Props) {
  const networkStandard = token.chain.includes("eip155") ? "ERC-20" : "Token Standard";
  const executiveLengthHint = getAiSectionLengthHint("executiveSummary");
  const launchDate = token.marketData?.launch?.date 
    ? new Date(token.marketData.launch.date * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not available";

  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="h-6 w-6 text-[#8ee3ff]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">1. Executive Summary</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            High-level overview of the token and its key characteristics
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#3fe081]" />
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">Token Name / Ticker</p>
            </div>
            <p className="text-xl font-semibold text-white">{token.name}</p>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">({token.symbol})</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Network className="h-4 w-4 text-[#8ee3ff]" />
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">Network / Standards</p>
            </div>
            <p className="text-lg font-semibold text-white">{token.chainLabel}</p>
            <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">{networkStandard}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#f7c548]" />
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">Launch Date</p>
            </div>
            <p className="text-lg font-semibold text-white">{launchDate}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#c784ff]" />
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">Purpose</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {token.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[color:var(--color-text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#3fe081]" />
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">Current Status</p>
            </div>
            <p className="text-lg font-semibold text-white">Live</p>
            <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
              Last updated: {token.updatedAt}
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-3">Key Value Proposition</p>
            <AiContentBlock
              tokenId={token.id}
              sectionId="executiveSummary"
              initialContent={token.aiSections?.executiveSummary?.content ?? token.summary}
              initialModel={token.aiSections?.executiveSummary?.model}
              initialUpdatedAt={token.aiSections?.executiveSummary?.updatedAt}
              initialSources={token.aiSections?.executiveSummary?.sources}
              helperText={`${executiveLengthHint} Gemini generates a concise executive summary grounded in the latest benchmarks.`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">Note:</p>
        <p>Some fields may require manual research or additional API integrations. See implementation plan for details.</p>
      </div>
    </section>
  );
}

