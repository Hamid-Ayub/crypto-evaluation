import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { totalScore, SubScores, ScoreConfidence } from "./_internal/scoring";
import { api, internal } from "./_generated/api";
import { clamp, hhi } from "./_internal/math";

/**
 * Calculate ownership decentralization score (0-100)
 * Uses: top10Pct, HHI, Nakamoto coefficient
 * Higher score = more decentralized
 */
function calculateOwnership(holders: any): number {
  if (!holders) return 45; // Conservative default when data missing

  const asPct = (value: number | undefined, fallback: number) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return clamp(value);
  };

  const safeNakamoto = typeof holders.nakamotoCoeff === "number" && holders.nakamotoCoeff > 0
    ? holders.nakamotoCoeff
    : 1;

  // Base score from top 10% concentration (inverted: lower concentration = higher score)
  const top10Score = clamp(100 - asPct(holders.top10Pct, 100));

  // HHI score: HHI ranges from 0 (perfect distribution) to 10,000 (monopoly)
  // Convert to 0-100 scale where lower HHI = higher score
  // Typical good HHI: < 1,500 (competitive), bad: > 2,500 (concentrated)
  const hhiValue = typeof holders.hhi === "number" && holders.hhi > 0 ? holders.hhi : 10000;
  const hhiScore = clamp(100 - (clamp(hhiValue, 0, 10000) / 100));

  // Nakamoto coefficient: minimum entities needed to control >50%
  // Higher coefficient = more decentralized
  // Typical good: >= 5, excellent: >= 10
  const nakamotoScore = clamp(Math.min(100, (safeNakamoto / 10) * 100));

  // Gini: lower is better (0 = perfect equality)
  const giniValue = typeof holders.gini === "number" ? clamp(holders.gini, 0, 1) : null;
  const giniScore = giniValue !== null ? clamp((1 - giniValue) * 100) : 55;

  // Top holder concentrations provide additional signal
  const top1Score = clamp(100 - asPct(holders.top1Pct ?? holders.top10Pct, 100));
  const top3Score = clamp(100 - asPct(holders.top3Pct ?? holders.top10Pct, 100));

  // Contract-held supply vs EOAs (prefer EOAs / distributed custody)
  const contractShare = asPct(holders.contractSharePct, 50);
  const contractScore = clamp(100 - contractShare * 0.8);

  // Sample coverage rewards fresher, deeper datasets
  const coveragePct = asPct(holders.coveragePct, 60);
  const coverageScore = clamp(50 + coveragePct / 2);

  // Weighted combination to blend concentration, diversity, and data depth
  return clamp(
    top10Score * 0.20 +
    hhiScore * 0.15 +
    nakamotoScore * 0.15 +
    giniScore * 0.15 +
    top1Score * 0.10 +
    top3Score * 0.10 +
    contractScore * 0.10 +
    coverageScore * 0.05
  );
}

/**
 * Check if an address is likely a multisig/DAO (has multiple role holders)
 * Simple heuristic: if multiple addresses hold the same role, likely multisig
 */
function isLikelyMultisig(contracts: any): boolean {
  if (!contracts?.roles || contracts.roles.length === 0) return false;

  // Group roles by holder address
  const holderCounts = new Map<string, number>();
  for (const role of contracts.roles) {
    const addr = role.holder.toLowerCase();
    holderCounts.set(addr, (holderCounts.get(addr) || 0) + 1);
  }

  // If we have multiple distinct holders for admin roles, likely multisig
  const adminRoles = contracts.roles.filter((r: any) =>
    r.name.includes("ADMIN") || r.name.includes("OWNER")
  );
  const uniqueAdminHolders = new Set(adminRoles.map((r: any) => r.holder.toLowerCase()));

  return uniqueAdminHolders.size >= 2;
}

/**
 * Calculate control risk score (0-100)
 * Higher score = lower risk = more decentralized
 * Evaluates: upgradeability, admin controls, timelocks, pausability
 */
function calculateControlRisk(contracts: any): number {
  if (!contracts) return 45; // Conservative default

  let score = 0;

  // Upgradeability: non-upgradeable is better (60 vs 30)
  score += contracts.upgradeable ? 30 : 60;

  // Admin presence: penalize centralized control, reward multisig/DAO
  const adminEntity = (contracts.proxyAdmin ?? contracts.owner ?? "").toLowerCase();
  const hasAdmin = adminEntity.startsWith("0x") && !adminEntity.startsWith("0x000000000000000000000000000000000000");

  if (hasAdmin) {
    // Check if likely multisig/DAO
    if (isLikelyMultisig(contracts)) {
      // Multisig/DAO is better than single EOA
      score += 20;
    } else {
      // Single EOA admin is centralized control - penalize
      score -= 15;
    }
  } else {
    // No admin or zero address = more decentralized
    score += 10;
  }

  // Timelock: longer delay = better (up to +25 points)
  if (contracts.timelock?.delaySec) {
    const delayDays = contracts.timelock.delaySec / 86400;
    // Scale: 1 day = +5, 7 days = +15, 30 days = +25
    score += Math.min(25, 5 + (delayDays / 30) * 20);
  }

  // Pausability: penalize, but less if timelocked
  if (contracts.pausable) {
    if (contracts.timelock?.delaySec) {
      // Timelocked pause is less risky
      score -= 5;
    } else {
      // Immediate pause capability is risky
      score -= 15;
    }
  }

  return clamp(score);
}

/**
 * Calculate liquidity decentralization score (0-100)
 * Uses: pool concentration, DEX/CEX split
 * Higher score = more decentralized
 */
function calculateLiquidity(liq: any): number {
  if (!liq || !liq.pools || liq.pools.length === 0) return 45;

  // Pool concentration: max pool share (inverted)
  const maxPoolShare = Math.max(...liq.pools.map((p: any) => p.sharePct || 0));
  const concentrationScore = Math.max(0, Math.min(100, 100 - maxPoolShare));

  // DEX/CEX split: prefer DEX liquidity (more decentralized)
  // If cexSharePct is available, use it; otherwise assume all DEX
  const cexShare = liq.cexSharePct ?? 0;
  const dexShare = 100 - cexShare;
  // Score: 100% DEX = 100, 50/50 = 75, 100% CEX = 50
  const dexScore = 50 + (dexShare / 100) * 50;

  // Pool HHI: measure concentration across all pools
  const poolShares = liq.pools.map((p: any) => p.sharePct || 0);
  const poolHHI = hhi(poolShares);
  const poolHHIScore = Math.max(0, Math.min(100, 100 - (poolHHI / 100)));

  // Weighted: concentration (40%), DEX/CEX (35%), pool HHI (25%)
  return clamp(
    concentrationScore * 0.40 + dexScore * 0.35 + poolHHIScore * 0.25
  );
}

/**
 * Calculate governance decentralization score (0-100)
 * Uses: quorum, turnout history, framework detection
 * Higher score = more decentralized
 */
function calculateGovernance(gov: any): number {
  if (!gov) return 40;

  let score = 0;

  // Quorum: higher quorum = more decentralized (harder to pass proposals)
  // Scale: 1% quorum = 10 points, 10% = 100 points (capped)
  if (gov.quorumPct) {
    score += Math.min(100, (gov.quorumPct / 10) * 100);
  } else {
    score += 40; // Default assumption
  }

  // Turnout history: higher turnout = more engaged = more decentralized
  if (gov.turnoutHistory && gov.turnoutHistory.length > 0) {
    const avgTurnout = gov.turnoutHistory.reduce((sum: number, h: any) => sum + h.turnoutPct, 0) / gov.turnoutHistory.length;
    // Scale: 10% avg turnout = 20 points, 50% = 100 points
    const turnoutScore = Math.min(100, (avgTurnout / 50) * 100);
    // Blend with quorum score (60% quorum, 40% turnout)
    score = score * 0.60 + turnoutScore * 0.40;
  }

  // Framework detection: on-chain governance (Tally) is better than off-chain (Snapshot)
  if (gov.framework) {
    if (gov.framework.toLowerCase().includes("tally") || gov.framework.toLowerCase().includes("onchain")) {
      score += 5; // Bonus for on-chain execution
    }
  }

  return clamp(score);
}

/**
 * Calculate chain-level decentralization score (0-100)
 * Uses: Nakamoto coefficient for validators
 * Higher score = more decentralized chain
 */
function calculateChainLevel(chain: any): number {
  if (!chain?.nakamotoCoeff) return 55; // Slightly above neutral default

  const nakamoto = chain.nakamotoCoeff;

  // Normalize Nakamoto coefficient to 0-100 scale
  // Typical ranges: Bitcoin ~10,000, Ethereum ~30, smaller chains ~5-50
  // For scoring: >= 20 is excellent (100), >= 10 is good (80), >= 5 is fair (60), < 5 is poor
  if (nakamoto >= 20) return 100;
  if (nakamoto >= 10) return 80;
  if (nakamoto >= 5) return 60;
  if (nakamoto >= 2) return 40;
  return 20;
}

/**
 * Calculate code assurance score (0-100)
 * Uses: verification status, audit history
 * Higher score = more assurance
 */
function calculateCodeAssurance(contracts: any, audits: any[]): number {
  let score = 0;

  // Base score from verification
  if (contracts?.verified) {
    score = 50; // Verified is baseline
  } else {
    score = 20; // Unverified is low
  }

  // Audit bonus: more audits = higher score
  if (audits && audits.length > 0) {
    // Recent audits (within 2 years) are more valuable
    const now = Date.now();
    const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);

    const recentAudits = audits.filter(a => a.date * 1000 >= twoYearsAgo);
    const auditCount = audits.length;
    const recentCount = recentAudits.length;

    // Bonus: 1 audit = +10, 2-3 = +20, 4+ = +30
    // Recent audits get 1.5x weight
    const auditBonus = Math.min(30, (recentCount * 15) + ((auditCount - recentCount) * 10));
    score += auditBonus;

    // Multiple firms = better (diversity of review)
    const uniqueFirms = new Set(audits.map(a => a.firm?.toLowerCase() || ""));
    if (uniqueFirms.size >= 2) {
      score += 5; // Bonus for multiple audit firms
    }
  }

  return clamp(score);
}

export const computeAndStore = internalAction({
  args: { assetId: v.id("assets"), asOfBlock: v.number() },
  handler: async (ctx, { assetId, asOfBlock }) => {
    const asset = await ctx.runQuery(api.assets.getAssetInternal, { assetId });
    if (!asset) throw new Error("Asset not found");

    const [holders, contracts, liq, gov, chain, audits, config] = await Promise.all([
      ctx.runQuery(api.assets.latestHolders, { assetId }),
      ctx.runQuery(api.assets.latestContract, { assetId }),
      ctx.runQuery(api.assets.latestLiquidity, { assetId }),
      ctx.runQuery(api.assets.governanceByAsset, { assetId }),
      ctx.runQuery(api.assets.chainStatsByChainId, { chainId: asset.chainId }),
      ctx.runQuery(api.assets.auditsByAsset, { assetId }),
      ctx.runQuery(api.scoring_config.get, {}),
    ]);

    const ownership = calculateOwnership(holders);
    const controlRisk = calculateControlRisk(contracts);
    const liquidity = calculateLiquidity(liq);
    const governance = calculateGovernance(gov);
    const chainLevel = calculateChainLevel(chain);
    const codeAssurance = calculateCodeAssurance(contracts, audits);

    const sub: SubScores = { ownership, controlRisk, liquidity, governance, chainLevel, codeAssurance };
    const confidence = buildConfidenceMap(holders, contracts, liq, gov, chain, audits);
    const { total, weights } = totalScore(sub, { confidence, weights: config });

    const scoreId = await ctx.runMutation(internal.assets.insertScore, { assetId, asOfBlock, subScores: sub, total, weights, confidence });
    const jsonld = await ctx.runAction(internal.assets.materializeJsonLd, { assetId, scoreId });
    return { scoreId, jsonldStorageId: jsonld.jsonldStorageId, url: jsonld.url };
  },
});

function buildConfidenceMap(
  holders: any,
  contracts: any,
  liq: any,
  governance: any,
  chain: any,
  audits: any[]
): ScoreConfidence {
  return {
    ownership: confidenceOwnershipMeta(holders),
    controlRisk: confidenceControlMeta(contracts),
    liquidity: confidenceLiquidityMeta(liq),
    governance: confidenceGovernanceMeta(governance),
    chainLevel: confidenceChainMeta(chain),
    codeAssurance: confidenceCodeMeta(contracts, audits),
  };
}

function toUnixSeconds(value?: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  if (value > 1_000_000_000_000) return Math.floor(value / 1000);
  if (value > 1_000_000_000) return Math.floor(value);
  return null;
}

function recencyContribution(asOf?: number | null): number {
  const seconds = toUnixSeconds(asOf);
  if (!seconds) return 0;
  const ageDays = Math.max(0, (Date.now() / 1000 - seconds) / 86400);
  if (ageDays <= 3) return 0.25;
  if (ageDays <= 7) return 0.18;
  if (ageDays <= 30) return 0.08;
  if (ageDays <= 90) return 0.0;
  if (ageDays <= 180) return -0.05;
  return -0.1;
}

function confidenceOwnershipMeta(holders: any): number {
  if (!holders) return 0.3;
  let score = 0.4;
  const coverage = typeof holders.coveragePct === "number" ? clamp(holders.coveragePct, 0, 100) : 0;
  if (coverage >= 85) score += 0.35;
  else if (coverage >= 60) score += 0.25;
  else if (coverage >= 40) score += 0.15;
  else score += 0.05;

  const sampleSize = holders.sampleSize ?? holders.topHolders?.length ?? 0;
  if (sampleSize >= 25) score += 0.2;
  else if (sampleSize >= 15) score += 0.1;
  else if (sampleSize >= 5) score += 0.05;

  score += recencyContribution(holders.asOfBlock);
  return clamp(score, 0.2, 1);
}

function confidenceControlMeta(contracts: any): number {
  if (!contracts) return 0.35;
  let score = 0.45;
  if (contracts.verified) score += 0.15;
  if (Array.isArray(contracts.roles) && contracts.roles.length > 0) score += 0.1;
  if (contracts.timelock) score += 0.05;
  if (contracts.proxyAdmin || contracts.owner) score += 0.05;
  score += recencyContribution(contracts.asOfBlock);
  return clamp(score, 0.25, 1);
}

function confidenceLiquidityMeta(liq: any): number {
  if (!liq) return 0.3;
  let score = 0.4;
  const pools = Array.isArray(liq.pools) ? liq.pools.length : 0;
  if (pools >= 5) score += 0.25;
  else if (pools >= 2) score += 0.15;
  else if (pools >= 1) score += 0.05;
  if (typeof liq.cexSharePct === "number") score += 0.1;
  score += recencyContribution(liq.asOfBlock);
  return clamp(score, 0.2, 1);
}

function confidenceGovernanceMeta(gov: any): number {
  if (!gov) return 0.25;
  let score = 0.35;
  if (typeof gov.quorumPct === "number") score += 0.2;
  const turnoutHistory = Array.isArray(gov.turnoutHistory) ? gov.turnoutHistory.length : 0;
  if (turnoutHistory >= 8) score += 0.25;
  else if (turnoutHistory >= 3) score += 0.15;
  else if (turnoutHistory >= 1) score += 0.08;
  if (typeof gov.framework === "string") {
    const fw = gov.framework.toLowerCase();
    if (fw.includes("tally") || fw.includes("onchain")) score += 0.1;
    else score += 0.05;
  }
  score += recencyContribution(gov.updatedAt);
  return clamp(score, 0.2, 1);
}

function confidenceChainMeta(chain: any): number {
  if (!chain) return 0.3;
  let score = 0.45;
  if (typeof chain.nakamotoCoeff === "number") score += 0.3;
  if (typeof chain.validators === "number") score += 0.15;
  if (typeof chain.topValidatorsPct === "number") score += 0.1;
  score += recencyContribution(chain.updatedAt);
  return clamp(score, 0.25, 1);
}

function confidenceCodeMeta(contracts: any, audits: any[]): number {
  const auditList = Array.isArray(audits) ? audits : [];
  let score = contracts ? 0.4 : 0.3;
  if (contracts?.verified) score += 0.15;
  if (auditList.length > 0) {
    score += 0.25;
    const now = Date.now();
    const recentThreshold = now - 365 * 24 * 60 * 60 * 1000;
    const recentAudits = auditList.filter(a => typeof a.date === "number" && a.date * 1000 >= recentThreshold);
    if (recentAudits.length > 0) score += 0.15;
    if (auditList.length >= 3) score += 0.05;
    const latestAudit = Math.max(...auditList.map(a => (typeof a.date === "number" ? a.date : 0)));
    if (latestAudit > 0) score += recencyContribution(latestAudit);
  } else {
    score += recencyContribution(contracts?.asOfBlock);
  }
  return clamp(score, 0.2, 1);
}
