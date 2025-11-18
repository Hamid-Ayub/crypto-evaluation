import { TokenRecord } from "@/types/token";
import { Code, Shield, Github, ExternalLink } from "lucide-react";
import { CheckCircle2, XCircle } from "lucide-react";
import AiContentBlock from "@/components/reports/AiContentBlock";
import { getAiSectionLengthHint } from "@/lib/aiSectionMeta";

type Props = {
  token: TokenRecord;
};

export default function TechnologyReview({ token }: Props) {
  const contractVerified = token.contract?.verified ?? false;
  const contractUpgradeable = token.contract?.upgradeable ?? false;
  const devRepos = token.development?.repos ?? [];
  const primaryRepo = devRepos[0];
  const hasDevelopmentData = devRepos.length > 0;
  const technologyLengthHint = getAiSectionLengthHint("technologyReview");

  const formatCount = (value?: number, options?: Intl.NumberFormatOptions) => {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1, ...options }).format(value);
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  
  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Code className="h-6 w-6 text-[#8ee3ff]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">5. Technology Review</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Blockchain infrastructure, security, and development activity
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-2">
          <Code className="h-5 w-5 text-[#8ee3ff]" />
          <h3 className="text-lg font-semibold text-white">5.4 AI Engineering Insight</h3>
        </div>
        <AiContentBlock
          tokenId={token.id}
          sectionId="technologyReview"
          title="AI View: Technology & Security"
          description="Gemini covers contract security posture, audit coverage, and engineering velocity."
          initialContent={token.aiSections?.technologyReview?.content ?? null}
          initialModel={token.aiSections?.technologyReview?.model}
          initialUpdatedAt={token.aiSections?.technologyReview?.updatedAt}
          initialSources={token.aiSections?.technologyReview?.sources}
          helperText={`${technologyLengthHint} Grounded summaries call out repos, audits, and contract controls with citations.`}
        />
      </div>

      <div className="space-y-6">
        {/* Blockchain & Infrastructure */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Code className="h-5 w-5 text-[#3fe081]" />
            <h3 className="text-lg font-semibold text-white">5.1 Blockchain & Infrastructure</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">Base Layer</p>
              <p className="text-lg font-semibold text-white">{token.chainLabel}</p>
              <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">{token.chain}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">Smart Contract Language</p>
              <p className="text-lg font-semibold text-white">Solidity</p>
              <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">[Assumed - requires verification]</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">Oracles, Bridges, L2s</p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                {token.chain.includes("eip155:42161") ? "Arbitrum L2" : 
                 token.chain.includes("eip155:8453") ? "Base L2" :
                 token.chain.includes("eip155:137") ? "Polygon Sidechain" :
                 token.chain.includes("eip155:10") ? "Optimism L2" :
                 "Ethereum Mainnet"}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">Contract Address</p>
              <p className="text-sm font-mono text-[#8ee3ff] break-all">{token.address}</p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#f7c548]" />
            <h3 className="text-lg font-semibold text-white">5.2 Security</h3>
          </div>
          <div className="space-y-4">
            {/* Smart Contract Audit Results */}
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-3">
                Smart Contract Audit Results
              </p>
              {token.audits && token.audits.length > 0 ? (
                <div className="space-y-3">
                  {token.audits.map((audit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{audit.firm}</p>
                        <p className="text-xs text-[color:var(--color-text-muted)]">
                          {new Date(audit.date * 1000).toLocaleDateString()}
                        </p>
                        {audit.severitySummary && (
                          <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                            {audit.severitySummary}
                          </p>
                        )}
                      </div>
                      <a
                        href={audit.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                      >
                        View Report →
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.01] p-4">
                  <p className="text-sm text-[color:var(--color-text-muted)]">
                    <span className="text-white/50">[Requires audit database integration]</span> Audit information can be sourced from specialized security audit databases or project websites.
                  </p>
                </div>
              )}
            </div>

            {/* Contract Security Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-[color:var(--color-text-secondary)]">Verification Status</p>
                  {contractVerified ? (
                    <div className="flex items-center gap-2 text-[#3fe081]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-semibold">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#ff8a5c]">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-semibold">Unverified</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[color:var(--color-text-muted)]">Upgradeable</span>
                    <span className={`text-xs font-semibold ${contractUpgradeable ? "text-[#ff8a5c]" : "text-[#3fe081]"}`}>
                      {contractUpgradeable ? "Yes" : "No"}
                    </span>
                  </div>
                  {token.contract?.pausable !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[color:var(--color-text-muted)]">Pausable</span>
                      <span className={`text-xs font-semibold ${token.contract.pausable ? "text-[#ff8a5c]" : "text-[#3fe081]"}`}>
                        {token.contract.pausable ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                  {token.contract?.timelock && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[color:var(--color-text-muted)]">Timelock</span>
                      <span className="text-xs font-semibold text-white">Yes</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-3">
                  Bug Bounty Programs
                </p>
                <p className="text-sm text-[color:var(--color-text-muted)]">
                  <span className="text-white/50">[Requires project research]</span> Bug bounty information requires manual research or integration with platforms like Immunefi, HackerOne.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Known Vulnerabilities
              </p>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                <span className="text-white/50">[Requires security database integration]</span> Vulnerability tracking can be integrated with security databases or monitoring services.
              </p>
            </div>
          </div>
        </div>

        {/* Code Repos & Development Activity */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Github className="h-5 w-5 text-[#c784ff]" />
            <h3 className="text-lg font-semibold text-white">5.3 Code Repos & Development Activity</h3>
          </div>
          {hasDevelopmentData ? (
            <div className="space-y-6">
              {primaryRepo && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Stars", value: formatCount(primaryRepo.stars), helper: "GitHub" },
                    { label: "Forks", value: formatCount(primaryRepo.forks), helper: "Protocol integrations" },
                    {
                      label: "Commits (4w)",
                      value: formatCount(primaryRepo.commitsLast4Weeks),
                      helper: "Velocity",
                    },
                    {
                      label: "Contributors",
                      value: formatCount(primaryRepo.contributorsCount),
                      helper: "All-time",
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">{stat.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                      <p className="text-[11px] text-[color:var(--color-text-muted)]">{stat.helper}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {devRepos.map((repo) => (
                  <div key={repo.repoUrl} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{repo.repo}</p>
                        <p className="text-xs text-[color:var(--color-text-muted)]">
                          {repo.primaryLanguage ?? "Language pending"} · {formatCount(repo.openIssues)} open issues
                        </p>
                      </div>
                      <a
                        href={repo.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8ee3ff] hover:text-[#8ee3ff]/80"
                      >
                        View Repo
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {repo.description && (
                      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{repo.description}</p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-xs text-[color:var(--color-text-muted)]">Watchers</p>
                        <p className="text-lg font-semibold text-white">{formatCount(repo.watchers)}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-xs text-[color:var(--color-text-muted)]">Subscribers</p>
                        <p className="text-lg font-semibold text-white">{formatCount(repo.subscribers)}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-xs text-[color:var(--color-text-muted)]">Avg Weekly Commits</p>
                        <p className="text-lg font-semibold text-white">{formatCount(repo.avgWeeklyCommits)}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-xs text-[color:var(--color-text-muted)]">Commits (52w)</p>
                        <p className="text-lg font-semibold text-white">{formatCount(repo.commitsThisYear)}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-xs text-[color:var(--color-text-muted)]">Latest Release</p>
                        <p className="text-lg font-semibold text-white">
                          {repo.lastReleaseTag ? `${repo.lastReleaseTag}` : "No releases"}
                        </p>
                        {repo.lastReleaseAt && (
                          <p className="text-[11px] text-[color:var(--color-text-muted)]">
                            {formatDateTime(repo.lastReleaseAt)}
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-xs text-[color:var(--color-text-muted)]">Last Commit</p>
                        <p className="text-lg font-semibold text-white">{formatDateTime(repo.lastCommitAt)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[color:var(--color-text-muted)]">
                      <span>Default branch: {repo.defaultBranch ?? "unknown"}</span>
                      <span>Synced: {formatDateTime(repo.fetchedAt)}</span>
                      {repo.license && <span>License: {repo.license}</span>}
                    </div>

                    {repo.topics && repo.topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {repo.topics.slice(0, 6).map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-white/5 px-3 py-1 text-[11px] text-[color:var(--color-text-muted)]"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {repo.error && (
                      <p className="mt-2 text-xs text-[#ff8a5c]">Unable to refresh repository fully: {repo.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.01] p-4">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                No GitHub repositories are linked to this asset yet. Add a repo to the project profile to track stars,
                forks, commit velocity, and contributor depth automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">Implementation Note:</p>
        <p>Security section can be enhanced with: (1) Audit database APIs (e.g., DefiLlama audits, project websites), (2) Bug bounty platform integrations, (3) Deeper GitHub/GitLab analytics (issue velocity, PR response times), (4) Vulnerability tracking services.</p>
      </div>
    </section>
  );
}

