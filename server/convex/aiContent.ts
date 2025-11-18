import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { generateGeminiContent } from "./providers/gemini";
import { TokenView } from "./assets";
import { caip19 } from "./_internal/normalize";
import { AI_SECTION_LENGTHS, type AiSectionId } from "../../shared/aiSectionConfig";

export type SectionTemplate = {
  title: string;
  instructions: string;
  focus: Array<
    | "name"
    | "symbol"
    | "benchmarkScore"
    | "benchmarkDetails"
    | "risk"
    | "tags"
    | "summary"
    | "marketCapUsd"
    | "liquidityUsd"
    | "marketData"
    | "liquidityDetail"
    | "holdersDetail"
    | "governanceDetail"
    | "development"
    | "projectProfile"
    | "contract"
    | "audits"
  >;
  minWords: number;
  targetWords: number;
  maxWords: number;
  maxTokens: number;
};

export const SECTION_TEMPLATES: Record<AiSectionId, SectionTemplate> = {
  executiveSummary: {
    title: "Executive Summary",
    instructions:
      "Provide a concise executive summary (120-150 words) covering: what the token is, its primary purpose, and the top 2-3 metrics critical for due diligence. Be direct and factual.",
    focus: ["name", "symbol", "benchmarkScore", "marketCapUsd", "liquidityUsd", "risk"],
    ...AI_SECTION_LENGTHS.executiveSummary,
  },
  projectOverview: {
    title: "Mission, Team & Roadmap",
    instructions:
      "Provide a concise summary of the mission, founding story, key team members, and roadmap highlights. Focus on essential facts: what the project does, who built it, and what's coming next. Be factual and evidence-driven.",
    focus: ["tags", "summary", "governanceDetail", "development", "projectProfile"],
    ...AI_SECTION_LENGTHS.projectOverview,
  },
  tokenFundamentals: {
    title: "Utility & Architecture Overview",
    instructions:
      "Explain how the token is used, what roles it plays in the protocol, and highlight any architectural considerations that impact adoption.",
    focus: ["summary", "tags", "projectProfile", "governanceDetail", "holdersDetail"],
    ...AI_SECTION_LENGTHS.tokenFundamentals,
  },
  tokenomics: {
    title: "Tokenomics & Supply Design",
    instructions:
      "Describe the current supply structure, float, concentration, and any known emission mechanics that influence market pressure.",
    focus: ["holdersDetail", "liquidityDetail", "marketData", "benchmarkDetails"],
    ...AI_SECTION_LENGTHS.tokenomics,
  },
  technologyReview: {
    title: "Technology & Security Posture",
    instructions:
      "Assess the quality of engineering, contract security, audit coverage, and development momentum.",
    focus: ["development", "contract", "audits"],
    ...AI_SECTION_LENGTHS.technologyReview,
  },
  marketAnalysis: {
    title: "Market Structure & Liquidity",
    instructions:
      "Outline how the asset trades today, liquidity depth across venues, demand drivers, and any catalysts visible in the data.",
    focus: ["marketData", "liquidityDetail", "marketCapUsd", "liquidityUsd", "benchmarkDetails"],
    ...AI_SECTION_LENGTHS.marketAnalysis,
  },
  reportConclusion: {
    title: "Opportunities & Outlook",
    instructions:
      "Craft a balanced conclusion that calls out the biggest strengths, risks, and opportunities. Close with specific watch items and near-term catalysts.",
    focus: ["benchmarkDetails", "marketData", "development", "liquidityDetail"],
    ...AI_SECTION_LENGTHS.reportConclusion,
  },
  riskAnalysis: {
    title: "Risk Radar",
    instructions:
      "Synthesize technical, market, governance, and regulatory risks with explicit call-outs for concentration or centralization concerns.",
    focus: ["benchmarkDetails", "holdersDetail", "governanceDetail", "contract", "marketData"],
    ...AI_SECTION_LENGTHS.riskAnalysis,
  },
  communityEcosystem: {
    title: "Community & Ecosystem Pulse",
    instructions:
      "Highlight community traction, developer engagement, notable partnerships, and governance participation signals.",
    focus: ["projectProfile", "tags", "summary", "development", "governanceDetail"],
    ...AI_SECTION_LENGTHS.communityEcosystem,
  },
};

function normalizeSection(section: string): AiSectionId {
  const key = section.trim();
  if (key in SECTION_TEMPLATES) {
    return key as AiSectionId;
  }
  throw new Error(`unsupported-section-${section}`);
}

function formatUsd(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "unknown";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function describeField(token: TokenView, field: SectionTemplate["focus"][number]): string | null {
  switch (field) {
    case "name":
      return `Token Name: ${token.name}`;
    case "symbol":
      return `Ticker: ${token.symbol}`;
    case "benchmarkScore":
      return `Benchmark Score: ${token.benchmarkScore}/100`;
    case "benchmarkDetails":
      return `Benchmark Breakdown: ownership ${token.benchmarkDetails.ownership}/100, liquidity ${token.benchmarkDetails.liquidity}/100, governance ${token.benchmarkDetails.governance}/100, control risk ${token.benchmarkDetails.controlRisk}/100.`;
    case "risk":
      return `Risk Level: ${token.risk}`;
    case "tags":
      return token.tags?.length ? `Tags: ${token.tags.join(", ")}` : null;
    case "summary":
      return token.summary ? `Summary: ${token.summary}` : null;
    case "marketCapUsd":
      return `Market Cap: ${formatUsd(token.marketCapUsd)}`;
    case "liquidityUsd":
      return `Liquidity Depth: ${formatUsd(token.liquidityUsd)}`;
    case "marketData": {
      const current = token.marketData?.current;
      if (!current) return null;
      return `Market Snapshot: price ${formatUsd(current.priceUsd ?? 0)}, 24h volume ${formatUsd(current.volume24hUsd ?? 0)}, source ${current.source ?? "unknown"}.`;
    }
    case "liquidityDetail": {
      const pools = token.liquidityDetail?.pools;
      if (!pools?.length) return null;
      const topPools = pools.slice(0, 3).map(
        (pool) => `${pool.dex} (${formatUsd(pool.tvlUsd)} / ${pool.sharePct.toFixed(1)}%)`,
      );
      return `Top Liquidity Venues: ${topPools.join("; ")}`;
    }
    case "holdersDetail": {
      const holders = token.holdersDetail;
      if (!holders) return null;
      return `Holder Concentration: top 1% = ${holders.top1Pct?.toFixed?.(2) ?? "n/a"}%, top 10% = ${holders.top10Pct.toFixed(
        2,
      )}%.`;
    }
    case "governanceDetail": {
      const gov = token.governanceDetail;
      if (!gov) return null;
      const history = gov.turnoutHistory?.slice(0, 3).map(
        (row) => `${row.turnoutPct.toFixed(1)}% turnout on ${new Date(row.ts).toLocaleDateString()}`,
      );
      return `Governance: framework ${gov.framework ?? "unknown"}, recent participation ${
        history?.join("; ") ?? "n/a"
      }.`;
    }
    case "development": {
      const repo = token.development?.repos?.[0];
      if (!repo) return null;
      return `Development Activity: ${repo.repo} has ${repo.stars}⭐, ${repo.forks} forks, ${
        repo.commitsLast4Weeks ?? 0
      } commits in the last 4 weeks, ${repo.contributorsCount ?? 0} contributors.`;
    }
    case "projectProfile": {
      const profile = token.projectProfile;
      if (!profile) return null;
      const sites = [
        profile.website ? `website ${profile.website}` : null,
        profile.docs ? `docs ${profile.docs}` : null,
        profile.twitter ? `twitter ${profile.twitter}` : null,
        profile.githubRepos?.length ? `repos ${profile.githubRepos.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("; ");
      return sites ? `Project Links: ${sites}` : null;
    }
    case "contract": {
      const contract = token.contract;
      if (!contract) return null;
      const traits = [
        contract.verified ? "verified" : "unverified",
        contract.upgradeable ? "upgradeable" : "non-upgradeable",
        contract.pausable ? "pausable" : null,
        contract.timelock ? "timelock in place" : null,
      ]
        .filter(Boolean)
        .join(", ");
      const owner = contract.owner ? `owner ${contract.owner}` : "owner undisclosed";
      return `Contract Security: ${traits || "traits unknown"}; ${owner}.`;
    }
    case "audits": {
      const audits = token.audits;
      if (!audits?.length) return null;
      const summaries = audits
        .slice(0, 2)
        .map((audit) => `${audit.firm} (${new Date(audit.date * 1000).toLocaleDateString()})`)
        .join("; ");
      return `Audit Coverage: ${summaries}${audits.length > 2 ? " +" + (audits.length - 2) + " more" : ""}.`;
    }
    default:
      return null;
  }
}

const SECTION_IDS = Object.keys(SECTION_TEMPLATES) as AiSectionId[];

export type AiSectionSource = {
  id: number;
  title?: string;
  url: string;
  snippet?: string;
};

export function shouldUseCachedSection(
  existing: { promptHash?: string } | null | undefined,
  promptHash: string,
  force?: boolean,
): boolean {
  return !force && !!existing && existing.promptHash === promptHash;
}

export function buildPrompt(
  sectionId: keyof typeof SECTION_TEMPLATES,
  token: TokenView,
  context?: string,
  parsedProjectData?: {
    foundingTeam?: any;
    roadmap?: any;
    links?: any;
    tokenomics?: any;
  },
) {
  const template = SECTION_TEMPLATES[sectionId];
  const focusNotes = template.focus
    .map((field) => describeField(token, field))
    .filter(Boolean)
    .join("\n");

  // Build structured data context for projectOverview section
  let structuredDataContext = "";
  if (sectionId === "projectOverview" && parsedProjectData) {
    const teamInfo = parsedProjectData.foundingTeam
      ? `\nFounding Team Data:\n${JSON.stringify(parsedProjectData.foundingTeam, null, 2)}`
      : "";
    const roadmapInfo = parsedProjectData.roadmap
      ? `\nRoadmap Data:\n${JSON.stringify(parsedProjectData.roadmap, null, 2)}`
      : "";
    const linksInfo = parsedProjectData.links
      ? `\nProject Links:\n${JSON.stringify(parsedProjectData.links, null, 2)}`
      : "";
    structuredDataContext = teamInfo + roadmapInfo + linksInfo;
  }

  return [
    `You are an analyst producing section "${template.title}" for a professional crypto asset report.`,
    "Requirements:",
    `- Minimum ${template.minWords} words, target ${template.targetWords} words, maximum ${template.maxWords} words`,
    "- Use a factual, evidence-driven tone (no marketing hype).",
    "- Be concise and direct. Avoid unnecessary elaboration.",
    "- Reference only the provided data or retrieved facts; clearly label unknowns.",
    "- Prefer paragraphs instead of bullet lists unless essential.",
    "- Cite external evidence inline using numbered [n] references.",
    `- Approximate token budget: ${template.maxTokens} tokens`,
    `Objective: ${template.instructions}`,
    context ? `Additional context: ${context}` : "",
    "",
    "Available structured data:",
    focusNotes || "Limited structured data provided.",
    structuredDataContext,
    "",
    "Write the section now. Be concise and factual.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const generateSection = action({
  args: {
    tokenId: v.string(),
    section: v.string(),
    context: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tokenId, section, context, force } = args;
    const sectionId = normalizeSection(section);
    const { token, asset } = await resolveTokenAndAsset(ctx, tokenId);
    return await runSectionGeneration(ctx, {
      token,
      assetId: asset._id,
      sectionId,
      context,
      force,
    });
  },
});

export const generateSectionsForToken = action({
  args: {
    tokenId: v.string(),
    sections: v.optional(v.array(v.string())),
    context: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tokenId, sections, context, force } = args;
    const sectionIds = (sections ?? SECTION_IDS).map(normalizeSection);
    const { token, asset } = await resolveTokenAndAsset(ctx, tokenId);
    const results: GenerateSectionResult[] = [];
    for (const sectionId of sectionIds) {
      const result = await runSectionGeneration(ctx, {
        token,
        assetId: asset._id,
        sectionId,
        context,
        force,
      });
      results.push(result);
    }
    return { sections: results };
  },
});

export const generateFeaturedSections = internalAction({
  args: {
    limit: v.optional(v.number()),
    sections: v.optional(v.array(v.string())),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 25));
    const sectionIds = (args.sections ?? SECTION_IDS).map(normalizeSection);
    let processed = 0;
    
    // Query assets using runQuery since internalAction doesn't have direct db access
    const assets = await ctx.runQuery(api.assets.listEnriched, {
      page: 1,
      pageSize: limit,
      chain: "all",
      risk: "all",
      category: "all",
      sort: "score",
      sortDir: "desc",
    });

    for (const token of assets.tokens) {
      if (processed >= limit) break;
      const asset = await ctx.runQuery(api.assets.getByChainAddress, {
        chainId: token.chain,
        address: token.address.toLowerCase(),
      });
      if (!asset) continue;
      
      for (const sectionId of sectionIds) {
        await runSectionGeneration(ctx, {
          token,
          assetId: asset._id,
          sectionId,
          context: undefined,
          force: args.force,
        });
      }
      processed += 1;
    }

    return { processed, sections: sectionIds.length };
  },
});

type GenerateSectionResult = {
  sectionId: AiSectionId;
  content: string;
  model: string;
  tokensUsed?: number;
  updatedAt: number;
  cached: boolean;
  sources?: AiSectionSource[];
};

async function resolveTokenAndAsset(ctx: any, tokenId: string) {
  const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
  if (!token) throw new Error("token-not-found");
  const asset = await ctx.runQuery(api.assets.getByChainAddress, {
    chainId: token.chain,
    address: token.address.toLowerCase(),
  });
  if (!asset) throw new Error("asset-not-found");
  return { token, asset };
}

async function runSectionGeneration(
  ctx: any,
  {
    token,
    assetId,
    sectionId,
    context,
    force,
  }: {
    token: TokenView;
    assetId: string;
    sectionId: AiSectionId;
    context?: string;
    force?: boolean;
  },
): Promise<GenerateSectionResult> {
  const template = SECTION_TEMPLATES[sectionId];
  
  // Fetch parsed project data for projectOverview section
  let parsedProjectData: any = undefined;
  if (sectionId === "projectOverview") {
    // Use parsedProjectData from token if available (already included in TokenView)
    parsedProjectData = token.parsedProjectData;
  }
  
  const prompt = buildPrompt(sectionId, token, context, parsedProjectData);
  const sourceData = JSON.stringify({
    summary: token.summary,
    benchmark: token.benchmarkDetails,
    updatedAt: token.updatedAt,
    section: sectionId,
  });
  const { promptHash, sourceDataHash } = await ctx.runAction(internal.aiContentNode.hashPayloads, {
    prompt,
    sourceData,
  });

  const existing = await ctx.runQuery(api.assets.getAiSection, {
    assetId,
    sectionId,
  });

  if (shouldUseCachedSection(existing, promptHash, force)) {
    return {
      sectionId,
      content: existing.content,
      model: existing.model,
      tokensUsed: existing.tokensUsed,
      updatedAt: existing.updatedAt,
      cached: true,
      sources: existing.sources,
    };
  }

  try {
    const result = await generateGeminiContent(prompt, {
      enableGoogleSearch: true,
      maxOutputTokens: template.maxTokens,
    });
    await ctx.runMutation(internal.assets.upsertAiSection, {
      assetId,
      sectionId,
      data: {
        content: result.content,
        model: result.model,
        promptHash,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        sourceDataHash,
        sources: result.sources && result.sources.length ? result.sources : undefined,
      },
    });
    await ctx.runMutation(internal.assets.insertAiSectionLog, {
      assetId,
      sectionId,
      status: "success",
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      error: undefined,
    });

    const updated = await ctx.runQuery(api.assets.getAiSection, {
      assetId,
      sectionId,
    });

    return {
      sectionId,
      content: updated?.content ?? result.content,
      model: updated?.model ?? result.model,
      tokensUsed: updated?.tokensUsed ?? result.tokensUsed,
      updatedAt: updated?.updatedAt ?? Date.now(),
      cached: false,
      sources: updated?.sources,
    };
  } catch (error: any) {
    await ctx.runMutation(internal.assets.insertAiSectionLog, {
      assetId,
      sectionId,
      status: "error",
      model: undefined,
      tokensUsed: undefined,
      latencyMs: undefined,
      error: error?.message ?? "unknown-error",
    });
    throw error;
  }
}

