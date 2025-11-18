import { TokenRecord } from "@/types/token";
import { Scale } from "lucide-react";

type Props = {
  token: TokenRecord;
};

export default function LegalRegulatory({ token }: Props) {
  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Scale className="h-6 w-6 text-[#f7c548]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">7. Legal & Regulatory Review</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Token classification, compliance, and jurisdictional considerations
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Token Classification (Howey Test Considerations)
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires legal analysis]</span> Token classification requires legal review based on the Howey Test criteria: (1) Investment of money, (2) In a common enterprise, (3) With expectation of profits, (4) Derived from efforts of others. This analysis should be conducted by legal professionals familiar with securities law.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {[
                  { label: "Utility Token", status: "Likely" },
                  { label: "Security Token", status: "Requires Analysis" },
                  { label: "Commodity", status: "Unknown" },
                  { label: "Currency", status: "Unknown" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
                  >
                    <span className="text-sm text-[color:var(--color-text-secondary)]">{item.label}</span>
                    <span className="text-xs font-semibold text-white/70">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Compliance Frameworks
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires legal research]</span> Compliance with frameworks such as MiCA (EU), SEC regulations (US), FCA guidelines (UK), and other jurisdictional requirements requires legal review and project documentation analysis.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Jurisdictional Risks
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires legal research]</span> Jurisdictional risk assessment requires analysis of: (1) Project entity location, (2) Token distribution geography, (3) Regulatory changes in key markets, (4) Enforcement actions against similar projects.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                KYC/AML Requirements
              </p>
              <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="text-white/50">[Requires project research]</span> KYC/AML compliance information can be found in project documentation, terms of service, or through direct inquiry. This is particularly relevant for centralized exchanges and certain DeFi protocols.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/20 bg-white/[0.01] p-4 text-xs text-[color:var(--color-text-muted)]">
        <p className="font-semibold text-white/70 mb-1">⚠️ Important Notice:</p>
        <p className="mb-2">This section requires professional legal analysis. The information provided here is for informational purposes only and does not constitute legal advice.</p>
        <p className="font-semibold text-white/70 mb-1">Recommended Actions:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Consult with securities law attorneys for token classification</li>
          <li>Review project legal documentation and disclaimers</li>
          <li>Check regulatory databases for enforcement actions</li>
          <li>Monitor regulatory updates in relevant jurisdictions</li>
        </ul>
      </div>
    </section>
  );
}

