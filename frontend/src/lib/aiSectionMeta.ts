import type { AiSectionId } from "../../../shared/aiSectionConfig";
import { AI_SECTION_LENGTHS } from "../../../shared/aiSectionConfig";

export { AI_SECTION_LENGTHS };
export type { AiSectionId };

export function getAiSectionLengthHint(sectionId: AiSectionId): string {
  const config = AI_SECTION_LENGTHS[sectionId];
  if (!config) {
    return "Grounded AI narrative.";
  }
  return `Target ${config.targetWords} words (min ${config.minWords}, max ${config.maxWords}, ~${config.maxTokens} tokens).`;
}

