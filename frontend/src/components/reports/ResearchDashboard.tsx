import React from "react";
import { TokenRecord, AiReportStructure, AiSectionSource } from "@/types/token";
import { AlertTriangle, CheckCircle, TrendingUp, Shield, Users, DollarSign } from "lucide-react";
import CitationRenderer from "./CitationRenderer";

interface Props {
  token: TokenRecord;
}

export default function ResearchDashboard({ token }: Props) {
  const report = token.aiReport?.report;
  const sources = token.aiReport?.sources || [];

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-white/5 p-12 text-center">
        <div className="animate-pulse text-lg font-semibold text-white/50">
          AI Research Analyst is auditing {token.symbol}...
        </div>
        <p className="mt-2 text-sm text-white/30">
          Analyzing on-chain data, governance forums, and market signals.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Executive Verdict */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Analyst Verdict</h2>
              <VerdictBadge verdict={report.executive_summary.verdict} />
            </div>
            <p className="mt-3 text-lg leading-relaxed text-white/80">
              {report.executive_summary.one_liner}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-green-500/5 p-4 border border-green-500/10">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-400">
              <CheckCircle className="h-4 w-4" /> Key Strengths
            </h3>
            <ul className="flex flex-col gap-2">
              {report.executive_summary.key_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-400" />
                  <span><CitationRenderer content={s} sources={sources} /></span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-red-500/5 p-4 border border-red-500/10">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
              <AlertTriangle className="h-4 w-4" /> Risk Factors
            </h3>
            <ul className="flex flex-col gap-2">
              {report.executive_summary.key_weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                  <span><CitationRenderer content={w} sources={sources} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Decentralization Analysis */}
        <DashboardCard
          title="Decentralization"
          icon={<Users className="h-5 w-5 text-[#8ee3ff]" />}
          className="lg:col-span-1"
        >
          <div className="flex flex-col gap-4">
            <MetricRow
              label="Owner Influence"
              value={<CitationRenderer content={report.decentralization_analysis.owner_influence} sources={sources} />}
            />
            <MetricRow
              label="Governance Health"
              value={<CitationRenderer content={report.decentralization_analysis.governance_health} sources={sources} />}
            />

            <div className="mt-2">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Centralization Vectors</h4>
              <ul className="space-y-2">
                {report.decentralization_analysis.centralization_vectors.map((vector, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg bg-white/5 p-3 text-xs text-white/70">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-[#f7c548] mt-0.5" />
                    <span><CitationRenderer content={vector} sources={sources} /></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DashboardCard>

        {/* Market Intelligence */}
        <DashboardCard
          title="Market Intelligence"
          icon={<DollarSign className="h-5 w-5 text-[#3fe081]" />}
          className="lg:col-span-1"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-white/5 p-3">
              <h4 className="mb-1 text-xs text-white/40">Competitor Landscape</h4>
              <p className="text-sm text-white/80"><CitationRenderer content={report.market_intelligence.competitor_comparison} sources={sources} /></p>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <h4 className="mb-1 text-xs text-white/40">Liquidity Analysis</h4>
              <p className="text-sm text-white/80"><CitationRenderer content={report.market_intelligence.liquidity_commentary} sources={sources} /></p>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Upcoming Catalysts</h4>
              <div className="flex flex-wrap gap-2">
                {report.market_intelligence.catalysts.map((c, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#3fe081]">
                    <CitationRenderer content={c} sources={sources} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Security Audit */}
        <DashboardCard
          title="Security & Audit"
          icon={<Shield className="h-5 w-5 text-[#f7c548]" />}
          className="lg:col-span-1"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-white/5 p-3">
              <h4 className="mb-1 text-xs text-white/40">Audit Coverage</h4>
              <p className="text-sm text-white/80"><CitationRenderer content={report.security_audit.audit_coverage} sources={sources} /></p>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Identified Contract Risks</h4>
              <ul className="space-y-2">
                {report.security_audit.contract_risks.length > 0 ? (
                  report.security_audit.contract_risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                      <AlertTriangle className="h-3 w-3 shrink-0 text-[#f7c548] mt-0.5" />
                      <span><CitationRenderer content={risk} sources={sources} /></span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-white/40 italic">No critical risks flagged by AI</li>
                )}
              </ul>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Sources & Citations */}
      {token.aiReport?.sources && token.aiReport.sources.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-6">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Verified Sources</h3>
          <div className="flex flex-wrap gap-3">
            {token.aiReport.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                <span className="font-mono text-white/30">[{source.id}]</span>
                {source.title || new URL(source.url).hostname}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles = {
    "Bullish": "bg-green-500/20 text-green-400 border-green-500/30",
    "Bearish": "bg-red-500/20 text-red-400 border-red-500/30",
    "Neutral": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "High Risk": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }[verdict] || "bg-white/10 text-white/60 border-white/20";

  return (
    <span className={`rounded-full border px-4 py-1 text-sm font-bold uppercase tracking-widest ${styles}`}>
      {verdict}
    </span>
  );
}

function DashboardCard({ title, icon, children, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[28px] border border-white/10 bg-[color:var(--color-bg-card)] p-6 ${className}`}>
      <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
          {icon}
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-xs text-white/40">{label}</h4>
      <p className="text-sm font-medium text-white/90">{value}</p>
    </div>
  );
}

