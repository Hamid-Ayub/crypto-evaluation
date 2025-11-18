export type ProjectMetadata = {
  githubRepos?: string[];
  website?: string;
  docs?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
};

const PROJECT_METADATA_BY_TOKEN: Record<string, ProjectMetadata> = {
  // WETH
  "eip155:1:erc20:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
    githubRepos: ["weth-protocol/weth10"],
    website: "https://weth.io",
    twitter: "https://twitter.com/ethereum",
  },
  // USDC
  "eip155:1:erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
    githubRepos: ["centrehq/centre-tokens"],
    website: "https://www.circle.com/usdc",
    docs: "https://developers.circle.com/stablecoins",
    twitter: "https://twitter.com/circlepay",
  },
};

function buildKey(chainId: string, address: string, standard = "erc20") {
  return `${chainId.toLowerCase()}:${standard}:${address.toLowerCase()}`;
}

export function lookupProjectMetadata(chainId: string, address: string, standard = "erc20") {
  const normalizedAddress = address.toLowerCase();
  const caipKey = buildKey(chainId, normalizedAddress, standard);
  const simpleKey = `${chainId.toLowerCase()}:${normalizedAddress}`;
  return PROJECT_METADATA_BY_TOKEN[caipKey] ?? PROJECT_METADATA_BY_TOKEN[simpleKey];
}


