import { describe, expect, it } from "vitest";

import { SECTION_TEMPLATES, buildPrompt, shouldUseCachedSection } from "../aiContent";
import type { TokenView } from "../assets";

const baseToken: TokenView = {
  id: "sample-token",
  name: "Sample Token",
  symbol: "SMP",
  chain: "eip155:1",
  chainLabel: "Ethereum",
  address: "0x1234567890abcdef000000000000000000000000",
  avatar: "/token.png",
  category: "defi",
  risk: "medium",
  benchmarkScore: 72.5,
  benchmarkDetails: {
    gini: 0.42,
    hhi: 1200,
    nakamoto: 4,
    liquidity: 68,
    governance: 61,
    ownership: 59,
    controlRisk: 55,
  },
  marketCapUsd: 150_000_000,
  liquidityUsd: 12_500_000,
  holders: 28_500,
  volume24hUsd: 4_200_000,
  summary: "Sample protocol enables staking, governance, and synthetic asset issuance.",
  updatedAt: new Date().toISOString(),
  tags: ["defi", "staking"],
  sparkline: [],
  stats: [],
  marketData: {
    current: {
      priceUsd: 1.25,
      marketCapUsd: 150_000_000,
      volume24hUsd: 4_200_000,
      source: "coingecko",
    },
    listings: [
      {
        exchange: "Uniswap",
        pair: "SMP/USDC",
        baseSymbol: "SMP",
        targetSymbol: "USDC",
        priceUsd: 1.24,
        volume24hUsd: 1_100_000,
        trustScore: "green",
        isDex: true,
        lastTradedAt: Math.floor(Date.now() / 1000),
        url: "https://app.uniswap.org/",
        source: "coingecko",
      },
    ],
  },
  projectProfile: {
    website: "https://sample.finance",
    twitter: "https://twitter.com/sample",
    docs: "https://docs.sample.finance",
    githubRepos: ["sample/sample-core"],
  },
  development: {
    repos: [
      {
        repo: "sample/sample-core",
        repoUrl: "https://github.com/sample/sample-core",
        owner: "sample",
        name: "sample-core",
        description: "Core contracts",
        homepage: "https://sample.finance",
        license: "MIT",
        stars: 3200,
        forks: 420,
        watchers: 150,
        openIssues: 23,
        defaultBranch: "main",
        primaryLanguage: "TypeScript",
        commitsLast4Weeks: 42,
        commitsThisYear: 420,
        avgWeeklyCommits: 10,
        contributorsCount: 18,
        lastCommitAt: Date.now(),
        lastReleaseAt: Date.now() - 86_400_000,
        lastReleaseTag: "v2.1.0",
        fetchedAt: Date.now(),
      },
    ],
  },
  holdersDetail: {
    totalSupply: "100000000",
    freeFloat: "65000000",
    topHolders: [{ address: "0xabc", pct: 4.5 }],
    top10Pct: 52.4,
    top1Pct: 12.5,
    asOfBlock: 19_000_000,
  },
  liquidityDetail: {
    pools: [
      {
        dex: "Uniswap V3",
        poolAddress: "0xpool",
        tvlUsd: 6_000_000,
        sharePct: 58,
      },
    ],
    cexSharePct: 35,
    asOfBlock: 19_000_000,
  },
  governanceDetail: {
    framework: "DAO",
    quorumPct: 25,
    turnoutHistory: [
      { proposalId: "P-1", turnoutPct: 31.2, ts: Date.now() - 7 * 86_400_000 },
      { proposalId: "P-2", turnoutPct: 27.4, ts: Date.now() - 30 * 86_400_000 },
    ],
  },
  contract: {
    verified: true,
    upgradeable: true,
    proxyType: "UUPS",
    implementation: "0ximpl",
    proxyAdmin: "0xadmin",
    owner: "0xowner",
    roles: [
      { name: "DEFAULT_ADMIN_ROLE", holder: "0xowner" },
      { name: "PAUSER_ROLE", holder: "0xpauser" },
    ],
    pausable: true,
    timelock: { address: "0xtimelock", delaySec: 172800 },
    asOfBlock: 19_000_000,
  },
  audits: [
    {
      firm: "Trail of Bits",
      reportUrl: "https://example.com/audit.pdf",
      date: 1_704_067_200,
      severitySummary: "No critical issues",
    },
  ],
};

describe("SECTION_TEMPLATES", () => {
  it("registers the expanded section coverage", () => {
    expect(Object.keys(SECTION_TEMPLATES)).toEqual(
      expect.arrayContaining(["tokenFundamentals", "tokenomics", "technologyReview", "marketAnalysis", "riskAnalysis", "communityEcosystem"]),
    );
  });
});

describe("buildPrompt", () => {
  it("includes instructions, objective, and structured data for market analysis", () => {
    const prompt = buildPrompt("marketAnalysis", baseToken, "Highlight catalysts for the next quarter.");
    expect(prompt).toContain('Minimum 220 words');
    expect(prompt).toContain("Objective: Outline how the asset trades today");
    expect(prompt).toMatch(/Market Snapshot:/);
    expect(prompt).toContain("Highlight catalysts for the next quarter.");
    expect(prompt).toContain("Write the section now.");
  });
});

describe("shouldUseCachedSection", () => {
  it("returns true when hashes match and force is not set", () => {
    expect(shouldUseCachedSection({ promptHash: "abc" }, "abc", false)).toBe(true);
  });

  it("returns false when forced regeneration is requested", () => {
    expect(shouldUseCachedSection({ promptHash: "abc" }, "abc", true)).toBe(false);
  });

  it("returns false when hashes differ", () => {
    expect(shouldUseCachedSection({ promptHash: "abc" }, "def", false)).toBe(false);
  });
});

