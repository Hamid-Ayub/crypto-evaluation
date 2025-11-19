"use client";

import { TokenRecord } from "@/types/token";
import { FileText, Shield, Code, Database, Calendar, Copy, Check, ExternalLink, Network, Clock, Hash, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

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
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-1 text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition"
      title={label || "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-[#3fe081]" />
          <span className="text-[#3fe081] text-[10px]">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span className="text-[10px]">Copy</span>
        </>
      )}
    </button>
  );
}

export default function ReportAppendices({ token }: Props) {
  const explorerUrl = getExplorerUrl(token.chain, token.address);

  return (
    <section className="rounded-[24px] border border-white/10 bg-gradient-to-br from-[color:var(--color-bg-card)] to-[#070a11] p-5">
      <div className="mb-5 flex items-center gap-2">
        <FileText className="h-4 w-4 text-[#8ee3ff]" />
        <h2 className="text-lg font-bold text-white">Appendices</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Smart Contract Addresses */}
        <div className="rounded-xl border border-white/10 bg-white/5/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Code className="h-3.5 w-3.5 text-[#8ee3ff]" />
            <h3 className="text-sm font-bold text-white">Contracts</h3>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Token</p>
                <CopyButton text={token.address} />
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
              >
                {formatAddress(token.address)}
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              </a>
              <div className="mt-1.5 flex items-center gap-1.5">
                {token.contract?.verified ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-[#3fe081]/10 border border-[#3fe081]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#3fe081]">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded bg-[#f7c548]/10 border border-[#f7c548]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#f7c548]">
                    <AlertCircle className="h-2.5 w-2.5" />
                    Unverified
                  </span>
                )}
                {token.contract?.upgradeable && (
                  <span className="rounded bg-[#ff8a5c]/10 border border-[#ff8a5c]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#ff8a5c]">
                    Upgradeable
                  </span>
                )}
              </div>
            </div>

            {token.contract?.implementation && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Implementation</p>
                  <CopyButton text={token.contract.implementation} />
                </div>
                <a
                  href={getExplorerUrl(token.chain, token.contract.implementation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                >
                  {formatAddress(token.contract.implementation)}
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              </div>
            )}

            {token.contract?.proxyAdmin && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Proxy Admin</p>
                  <CopyButton text={token.contract.proxyAdmin} />
                </div>
                <a
                  href={getExplorerUrl(token.chain, token.contract.proxyAdmin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                >
                  {formatAddress(token.contract.proxyAdmin)}
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              </div>
            )}

            {token.contract?.timelock && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Timelock</p>
                  <CopyButton text={token.contract.timelock.address} />
                </div>
                <a
                  href={getExplorerUrl(token.chain, token.contract.timelock.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 text-xs font-mono text-[#8ee3ff] hover:text-[#8ee3ff]/80 transition"
                >
                  {formatAddress(token.contract.timelock.address)}
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                  <span className="ml-auto text-[10px] text-white/40">
                    {Math.floor(token.contract.timelock.delaySec / 86400)}d
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Data Sources */}
        <div className="rounded-xl border border-white/10 bg-white/5/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#3fe081]" />
            <h3 className="text-sm font-bold text-white">Data Sources</h3>
          </div>
          <div className="space-y-3">
            {token.crossValidation?.sources && token.crossValidation.sources.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/50">Active</p>
                <div className="flex flex-wrap gap-1.5">
                  {token.crossValidation.sources.map((source, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full border border-[#3fe081]/30 bg-[#3fe081]/10 px-2 py-0.5 text-[10px] font-medium text-[#3fe081]"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {source}
                    </span>
                  ))}
                </div>
                {token.crossValidation.status && (
                  <p className="mt-2 text-[10px] text-white/40 italic">{token.crossValidation.status}</p>
                )}
              </div>
            )}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/50">Providers</p>
              <div className="flex flex-wrap gap-1.5">
                {["CoinGecko", "DeFiLlama", "Etherscan", "GitHub"].map((source) => (
                  <span
                    key={source}
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/50"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report Metadata */}
        <div className="rounded-xl border border-white/10 bg-white/5/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#f7c548]" />
            <h3 className="text-sm font-bold text-white">Metadata</h3>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Updated</p>
              <p className="text-xs text-white/90">{token.updatedAt}</p>
            </div>
            {token.contract?.asOfBlock && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Contract Block</p>
                <p className="text-xs text-white/90 font-mono">{token.contract.asOfBlock.toLocaleString()}</p>
              </div>
            )}
            {token.holdersDetail?.asOfBlock && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Holder Block</p>
                <p className="text-xs text-white/90 font-mono">{token.holdersDetail.asOfBlock.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Audits */}
        {token.audits && token.audits.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5/50 p-4 lg:col-span-3">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[#3fe081]" />
              <h3 className="text-sm font-bold text-white">Security Audits</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {token.audits.map((audit, idx) => (
                <a
                  key={idx}
                  href={audit.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 hover:border-[#3fe081]/30 hover:bg-[#3fe081]/5 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{audit.firm}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {new Date(audit.date * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-white/40 group-hover:text-[#3fe081] transition ml-2 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
