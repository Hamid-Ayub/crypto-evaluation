/**
 * Web Parser Provider
 * 
 * Extracts structured data from project websites, documentation, and social links.
 * Uses Gemini AI to parse and structure information from web content.
 */

import { generateGeminiContent } from "./gemini";

export type ParsedProjectData = {
  foundingTeam?: {
    members?: Array<{
      name: string;
      role?: string;
      bio?: string;
      linkedin?: string;
      twitter?: string;
    }>;
    advisors?: Array<{
      name: string;
      role?: string;
      bio?: string;
    }>;
    organization?: {
      entityType?: string;
      jurisdiction?: string;
      structure?: string;
    };
  };
  roadmap?: {
    completed?: Array<{
      milestone: string;
      date?: string;
      description?: string;
    }>;
    upcoming?: Array<{
      milestone: string;
      targetDate?: string;
      description?: string;
    }>;
  };
  links?: {
    website?: string;
    documentation?: string[];
    whitepaper?: string;
    tokenomics?: string;
    github?: string[];
    twitter?: string;
    discord?: string;
    telegram?: string;
    medium?: string;
    blog?: string;
    other?: Array<{ label: string; url: string }>;
  };
  tokenomics?: {
    totalSupply?: string;
    distribution?: Array<{ category: string; percentage: string; description?: string }>;
    vesting?: Array<{ category: string; schedule: string; description?: string }>;
    emission?: string;
  };
};

/**
 * Parse project website and extract structured data using Gemini
 */
export async function parseProjectWebsite(
  websiteUrl: string,
  projectName: string,
  existingLinks?: {
    website?: string;
    docs?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    githubRepos?: string[];
  },
): Promise<ParsedProjectData> {
  const links = [
    existingLinks?.website || websiteUrl,
    existingLinks?.docs,
    ...(existingLinks?.githubRepos || []),
    existingLinks?.twitter,
    existingLinks?.discord,
    existingLinks?.telegram,
  ]
    .filter(Boolean)
    .join(", ");

  const prompt = `You are a research analyst extracting structured information about a cryptocurrency project.

Project: ${projectName}
Available Links: ${links || "None provided"}

Extract and structure the following information from the project's website, documentation, and public sources:

1. FOUNDING TEAM & ORGANIZATION:
   - Key team members (name, role, brief bio, LinkedIn/Twitter if available)
   - Advisors (name, role, brief bio)
   - Corporate entity structure (entity type, jurisdiction if mentioned)

2. ROADMAP:
   - Completed milestones (milestone name, date if available, brief description)
   - Upcoming milestones (milestone name, target date if available, brief description)

3. PROJECT LINKS:
   - Website URL
   - Documentation URLs (docs, whitepaper, technical docs)
   - Tokenomics document URL
   - GitHub repositories
   - Social media links (Twitter, Discord, Telegram, Medium, Blog)
   - Other relevant links

4. TOKENOMICS (if available):
   - Total supply
   - Distribution breakdown (category, percentage, description)
   - Vesting schedules (category, schedule, description)
   - Emission mechanics

IMPORTANT:
- Only include information that can be verified from public sources
- Use "N/A" or omit fields if information is not available
- Be concise and factual
- Cite sources using [n] references when using Google Search grounding

Return your response as a JSON object matching this structure:
{
  "foundingTeam": {
    "members": [{"name": "...", "role": "...", "bio": "...", "linkedin": "...", "twitter": "..."}],
    "advisors": [{"name": "...", "role": "...", "bio": "..."}],
    "organization": {"entityType": "...", "jurisdiction": "...", "structure": "..."}
  },
  "roadmap": {
    "completed": [{"milestone": "...", "date": "...", "description": "..."}],
    "upcoming": [{"milestone": "...", "targetDate": "...", "description": "..."}]
  },
  "links": {
    "website": "...",
    "documentation": ["..."],
    "whitepaper": "...",
    "tokenomics": "...",
    "github": ["..."],
    "twitter": "...",
    "discord": "...",
    "telegram": "...",
    "medium": "...",
    "blog": "...",
    "other": [{"label": "...", "url": "..."}]
  },
  "tokenomics": {
    "totalSupply": "...",
    "distribution": [{"category": "...", "percentage": "...", "description": "..."}],
    "vesting": [{"category": "...", "schedule": "...", "description": "..."}],
    "emission": "..."
  }
}

If information is not available, use null or empty arrays. Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await generateGeminiContent(prompt, {
      enableGoogleSearch: true,
      temperature: 0.2,
      maxOutputTokens: 4096,
    });

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = result.content.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON object in the text
      const braceMatch = jsonText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonText = braceMatch[0];
      }
    }

    const parsed = JSON.parse(jsonText) as ParsedProjectData;
    return parsed;
  } catch (error) {
    console.error("Failed to parse project website:", error);
    return {};
  }
}

/**
 * Extract links and metadata from project profile
 */
export function extractProjectLinks(projectProfile?: {
  website?: string;
  docs?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  githubRepos?: string[];
}): ParsedProjectData["links"] {
  if (!projectProfile) return undefined;

  return {
    website: projectProfile.website,
    documentation: projectProfile.docs ? [projectProfile.docs] : undefined,
    github: projectProfile.githubRepos,
    twitter: projectProfile.twitter,
    discord: projectProfile.discord,
    telegram: projectProfile.telegram,
  };
}

