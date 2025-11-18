import { TokenRecord } from "@/types/token";
import { FileText, Link as LinkIcon, Shield, Code } from "lucide-react";

type Props = {
  token: TokenRecord;
};

function getExplorerUrl(chainId: string, address: string): string {
  const chainMap: Record<string, string> = {
    "eip155:1": "https://etherscan.io",
    "eip155:42161": "https://arbiscan.io",
    "eip155:8453": "https://basescan.org",
    "eip155:137": "https://polygonscan.com",
    "eip155:10": "https://optimistic.etherscan.io",
    "eip155:43114": "https://snowtrace.io",
  };
  const base = chainMap[chainId] || "https://etherscan.io";
  return `${base}/address/${address}`;
}

function formatAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ReportAppendices({ token }: Props) {
  const explorerUrl = getExplorerUrl(token.chain, token.address);

  return (
    <section className="card-sheen rounded-[28px] border border-white/5 bg-[color:var(--color-bg-card)] p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="h-6 w-6 text-[#8ee3ff]" />
        <div>
          <h2 className="text-2xl font-semibold text-white">Appendices</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Additional resources, links, and data sources
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Glossary */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Glossary</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { term: "Gini Coefficient", definition: "Measure of distribution inequality (0 = perfect equality, 1 = perfect inequality)" },
              { term: "HHI", definition: "Herfindahl-Hirschman Index for concentration measurement" },
              { term: "Nakamoto Coefficient", definition: "Minimum number of entities needed to compromise the network" },
              { term: "Free Float", definition: "Circulating supply excluding locked or reserved tokens" },
              { term: "Quorum", definition: "Minimum voting participation required for proposal execution" },
              { term: "Timelock", definition: "Delay mechanism preventing immediate execution of governance decisions" },
            ].map((item) => (
              <div
                key={item.term}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <p className="text-sm font-semibold text-white mb-1">{item.term}</p>
                <p className="text-xs text-[color:var(--color-text-muted)]">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Links to Audits */}
        {token.audits && token.audits.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#3fe081]" />
              <h3 className="text-lg font-semibold text-white">Links to Audits</h3>
            </div>
            <div className="space-y-2">
              {token.audits.map((audit, idx) => (
                <a
                  key={idx}
                  href={audit.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.05] transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{audit.firm}</p>
                    <p className="text-xs text-[color:var(--color-text-muted)] mt-0.5">
                      {new Date(audit.date * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <LinkIcon className="h-4 w-4 text-[#8ee3ff]" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Smart Contract Addresses */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Code className="h-5 w-5 text-[#8ee3ff]" />
            <h3 className="text-lg font-semibold text-white">Smart Contract Addresses</h3>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">
                Token Contract
              </p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
              >
                {token.address}
                <LinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
            {token.contract?.implementation && (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">
                  Implementation Contract
                </p>
                <a
                  href={`${explorerUrl.replace("/address/", "/address/")}${token.contract.implementation}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                >
                  {formatAddress(token.contract.implementation)}
                  <LinkIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
            {token.contract?.proxyAdmin && (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">
                  Proxy Admin
                </p>
                <a
                  href={`${explorerUrl.replace("/address/", "/address/")}${token.contract.proxyAdmin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                >
                  {formatAddress(token.contract.proxyAdmin)}
                  <LinkIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
            {token.contract?.timelock && (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)] mb-2">
                  Timelock Contract
                </p>
                <a
                  href={`${explorerUrl.replace("/address/", "/address/")}${token.contract.timelock.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                >
                  {formatAddress(token.contract.timelock.address)}
                  <LinkIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Data Sources */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Data Sources</h3>
          <div className="space-y-2">
            {token.crossValidation?.sources && token.crossValidation.sources.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                  Current Data Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {token.crossValidation.sources.map((source, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[color:var(--color-text-secondary)]"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4">
              <p className="text-sm font-medium text-[color:var(--color-text-secondary)] mb-2">
                Potential Additional Sources
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  "CoinGecko API",
                  "CoinMarketCap API",
                  "DeFiLlama",
                  "Etherscan API",
                  "GitHub API",
                  "Twitter/X API",
                  "Discord API",
                  "Telegram API",
                ].map((source) => (
                  <div
                    key={source}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs text-[color:var(--color-text-muted)]"
                  >
                    {source}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report Metadata */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Report Metadata</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Generated</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Last Updated</p>
              <p className="mt-1 text-sm font-semibold text-white">{token.updatedAt}</p>
            </div>
            {token.contract?.asOfBlock && (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Contract Data Block</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {token.contract.asOfBlock.toLocaleString()}
                </p>
              </div>
            )}
            {token.holdersDetail?.asOfBlock && (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">Holder Data Block</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {token.holdersDetail.asOfBlock.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

