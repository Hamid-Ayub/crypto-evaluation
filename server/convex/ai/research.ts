import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { generateGeminiContent } from "../providers/gemini";
import { TokenView } from "../assets";

export const generateFullReport = action({
  args: {
    tokenId: v.string(),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tokenId, force } = args;

    // 1. Resolve Token and Asset
    const token = await ctx.runQuery(api.assets.getEnriched, { tokenId });
    if (!token) throw new Error("token-not-found");

    const asset = await ctx.runQuery(api.assets.getByChainAddress, {
      chainId: token.chain,
      address: token.address.toLowerCase(),
    });
    if (!asset) throw new Error("asset-not-found");

    // 2. Check if report exists and is fresh (unless forced)
    if (!force) {
      const existing = await ctx.runQuery(api.assets.getAiReport, {
        assetId: asset._id,
      });
      if (existing && Date.now() - existing.updatedAt < 24 * 60 * 60 * 1000) {
        // Less than 24 hours old
        return { status: "cached", reportId: existing._id };
      }
    }

    // 3. Build Context for AI
    const context = buildContext(token);

    // 4. Build Prompt
    const prompt = `
You are a Senior Crypto Research Analyst. Your goal is to audit the token "${token.name}" ($${token.symbol}) on ${token.chainLabel} for an institutional investor report.
Your core focus is "Decentralization & Risk".

Available Data:
${context}

Instructions:
1. **Research**: Analyze the provided data and ACTIVELY use Google Search to visit the project's website, social media, and governance forums.
2. **Verify**: Check for recent governance proposals, social sentiment, and any security incidents (hacks, rugs).
3. **Cite**: When making specific claims (especially about risks or news), try to cite sources using the grounding tools or mention the source.
4. **Critique**: Be extremely critical. Do not shill. Highlight centralization vectors (e.g., distinct admin keys, low holder count).
5. **Format**: Output strictly valid JSON matching the schema below. Do not add markdown formatting (no \`\`\`json blocks). Keep text concise (bullet points preferred where applicable).

JSON Schema:
{
  "executive_summary": {
    "verdict": "Bullish" | "Bearish" | "Neutral" | "High Risk",
    "one_liner": "A concise, punchy summary of the investment thesis (max 2 sentences).",
    "key_strengths": ["strength 1", "strength 2"],
    "key_weaknesses": ["weakness 1", "weakness 2"]
  },
  "decentralization_analysis": {
    "owner_influence": "Analysis of top holders and whale dominance. Mention specific percentages if available.",
    "governance_health": "Assessment of proposal activity and participation. Is it active or a ghost town?",
    "centralization_vectors": ["vector 1 (e.g., admin key)", "vector 2"]
  },
  "market_intelligence": {
    "catalysts": ["catalyst 1", "catalyst 2"],
    "competitor_comparison": "How it compares to rivals in 1-2 sentences.",
    "liquidity_commentary": "Depth analysis. Is it sufficient for institutional size?"
  },
  "security_audit": {
    "contract_risks": ["risk 1", "risk 2"],
    "audit_coverage": "Summary of audits. Mention firms and dates if found."
  }
}
`;

    const sourceDataHash = JSON.stringify({
      updatedAt: token.updatedAt,
      benchmark: token.benchmarkScore,
    }); // Simple hash for now

    try {
      // 5. Call Gemini
      const result = await generateGeminiContent(prompt, {
        enableGoogleSearch: true,
        temperature: 0.4, // Lower temperature for structured data
      });

      // 6. Parse JSON (handle potential markdown blocks)
      let jsonContent = result.content.trim();
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      let parsedReport;
      try {
        parsedReport = JSON.parse(jsonContent);
      } catch (e) {
        console.error("Failed to parse Gemini JSON output", jsonContent);
        throw new Error("ai-json-parse-error");
      }

      // 7. Save Report
      const reportId = await ctx.runMutation(internal.assets.upsertAiReport, {
        assetId: asset._id,
        report: parsedReport,
        summary: parsedReport.executive_summary.one_liner,
        model: result.model,
        promptHash: "dynamic-prompt", // TODO: real hash
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        sourceDataHash,
        sources: result.sources,
      });

      return { status: "success", reportId };

    } catch (error: any) {
        console.error("Gemini Report Generation Failed", error);
        // Log error (optional)
        throw error;
    }
  },
});

function buildContext(token: TokenView): string {
  let parsedContext = "";
  if (token.parsedProjectData) {
      parsedContext = `
- Founding Team: ${JSON.stringify(token.parsedProjectData.foundingTeam || "N/A")}
- Roadmap: ${JSON.stringify(token.parsedProjectData.roadmap || "N/A")}
- Tokenomics (Parsed): ${JSON.stringify(token.parsedProjectData.tokenomics || "N/A")}
      `;
  }

  return `
- Name: ${token.name} (${token.symbol})
- Chain: ${token.chainLabel}
- Address: ${token.address}
- Category: ${token.category}
- Decentralization Score: ${token.benchmarkScore}/100
- Benchmark Breakdown:
  - Ownership: ${token.benchmarkDetails.ownership}/100
  - Control Risk: ${token.benchmarkDetails.controlRisk}/100
  - Liquidity: ${token.benchmarkDetails.liquidity}/100
  - Governance: ${token.benchmarkDetails.governance}/100
- Market Cap: ${formatUsd(token.marketCapUsd)}
- Liquidity: ${formatUsd(token.liquidityUsd)}
- Holders: ${token.holders}
- Contract Verified: ${token.contract?.verified}
- Contract Upgradeable: ${token.contract?.upgradeable}
- Project Links:
  - Website: ${token.projectProfile?.website || "N/A"}
  - Twitter: ${token.projectProfile?.twitter || "N/A"}
  - Github: ${token.projectProfile?.githubRepos?.join(", ") || "N/A"}
- Description: ${token.summary}
${parsedContext}
`;
}

function formatUsd(val: number) {
    return `$${val.toLocaleString()}`;
}

