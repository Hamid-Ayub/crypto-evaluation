const CHAIN_METADATA: Record<number, { llama: string }> = {
  1: { llama: "ethereum" },
  10: { llama: "optimism" },
  137: { llama: "polygon" },
  42161: { llama: "arbitrum" },
  8453: { llama: "base" },
};

export function toNumericChainId(chainId: string | number): number {
  if (typeof chainId === "number") return chainId;
  if (chainId.startsWith("eip155:")) return Number(chainId.split(":")[1] || "0");
  return Number(chainId);
}

export function toCaipChainId(chainId: string | number): string {
  const numeric = toNumericChainId(chainId);
  return `eip155:${numeric}`;
}

export function llamaChainName(chainId: string | number): string {
  const numeric = toNumericChainId(chainId);
  return CHAIN_METADATA[numeric]?.llama ?? "ethereum";
}

