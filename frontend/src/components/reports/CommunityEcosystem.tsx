import { TokenRecord } from "@/types/token";
import { Users, Handshake, Code2, Building2 } from "lucide-react";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function CommunityEcosystem({ token }: Props) {
  const communityLengthHint = getAiSectionLengthHint("communityEcosystem");
  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-[#3fe081]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">9. Community & Ecosystem</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Community engagement, partnerships, and ecosystem development
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Community Size and Engagement */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">Community Size and Engagement</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Token Holders</p>
              <p className="mt-2 text-2xl font-semibold text-white">{token.holders.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Twitter Followers</p>
              <p className="mt-2 text-lg font-semibold text-white">
                <span className="text-white/50">[Requires API]</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Discord Members</p>
              <p className="mt-2 text-lg font-semibold text-white">
                <span className="text-white/50">[Requires API]</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Telegram Members</p>
              <p className="mt-2 text-lg font-semibold text-white">
                <span className="text-white/50">[Requires API]</span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
              Engagement Metrics
            </p>
            <p className="text-sm text-[color:var(--color-text-muted)]">
              <span className="text-white/50">[Requires social media API integration]</span> Engagement metrics (likes, retweets, active discussions) can be sourced from Twitter/X API, Discord API, Telegram API, or social analytics platforms.
            </p>
          </div>
        </div>

        {/* Partnerships */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Handshake className="h-5 w-5 text-[#f7c548]" />
            <h3 className="text-lg font-semibold text-white">Partnerships</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Strategic Partnerships
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires project research or AI analysis]</span> Partnership information can be extracted from project announcements, press releases, or AI-powered analysis of project documentation.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Integration Partners
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires ecosystem analysis]</span> Integration partnerships can be identified through on-chain analysis, protocol integrations, or project documentation.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Exchange Listings
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires exchange API]</span> Exchange listings can be sourced from CoinGecko, CoinMarketCap, or exchange-specific APIs.
              </p>
            </div>
          </div>
        </div>

        {/* Developer Ecosystem */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-[#c784ff]" />
            <h3 className="text-lg font-semibold text-white">Developer Ecosystem</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                GitHub Activity
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires GitHub API]</span> Developer activity metrics include commits, contributors, stars, forks, and issue resolution.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                SDK & Documentation
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires project research]</span> SDK availability and documentation quality require manual review or project website analysis.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Developer Grants Program
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires project research]</span> Grant programs and developer incentives require project documentation review.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Third-Party Integrations
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires ecosystem analysis]</span> Integration count and quality can be measured through on-chain analysis or ecosystem mapping.
              </p>
            </div>
          </div>
        </div>

        {/* DAO Structure */}
        {token.governanceDetail && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#3fe081]" />
              <h3 className="text-lg font-semibold text-white">DAO Structure (if applicable)</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">Governance Framework</p>
                <p className="text-lg font-semibold text-white">
                  {token.governanceDetail.framework || "Unknown"}
                </p>
              </div>
              {token.governanceDetail.quorumPct !== undefined && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">Quorum Requirement</p>
                  <p className="text-lg font-semibold text-white">
                    {token.governanceDetail.quorumPct.toFixed(1)}%
                  </p>
                </div>
              )}
              {token.governanceDetail.turnoutHistory && token.governanceDetail.turnoutHistory.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">
                    Proposal Activity
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {token.governanceDetail.turnoutHistory.length} proposals tracked
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    Average turnout: {(
                      token.governanceDetail.turnoutHistory.reduce((sum, p) => sum + p.turnoutPct, 0) /
                      token.governanceDetail.turnoutHistory.length
                    ).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#3fe081]" />
          <h3 className="text-lg font-semibold text-white">9.5 AI Community Pulse</h3>
        </div>
        <AiContentBlock
          tokenId={token.id}
          sectionId="communityEcosystem"
          title="AI View: Ecosystem & Governance"
          description="Gemini narrates community traction, partnership momentum, and DAO vitality using grounded facts."
          initialContent={token.aiSections?.communityEcosystem?.content ?? null}
          initialModel={token.aiSections?.communityEcosystem?.model}
          initialUpdatedAt={token.aiSections?.communityEcosystem?.updatedAt}
          initialSources={token.aiSections?.communityEcosystem?.sources}
          helperText={`${communityLengthHint} Great for summarizing social and governance signals when APIs are partial.`}
        />
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">Implementation Note:</p>
        <p>Community metrics can be enhanced with: (1) Twitter/X API for follower counts and engagement, (2) Discord API for member counts, (3) Telegram API for channel statistics, (4) GitHub API for developer activity, (5) Partnership announcement parsing or AI analysis.</p>
      </div>
    </section>
  );
}

