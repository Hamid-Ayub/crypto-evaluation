import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

declare const process: {
  env: Record<string, string | undefined>;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-pro";
const GEMINI_ENABLE_GOOGLE_SEARCH =
  (process.env.GEMINI_ENABLE_GOOGLE_SEARCH ?? "true").toLowerCase() !== "false";

let client: GoogleGenerativeAI | null = null;
let modelInstance: GenerativeModel | null = null;

function ensureModel(): GenerativeModel {
  if (!GEMINI_API_KEY) {
    throw new Error("gemini-missing-api-key");
  }
  if (!client) {
    client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  if (!modelInstance) {
    modelInstance = client.getGenerativeModel({
      model: GEMINI_MODEL,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });
  }
  return modelInstance;
}

export type GeminiGenerationResult = {
  content: string;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  sources?: Array<{
    id: number;
    title?: string;
    url: string;
    snippet?: string;
  }>;
};

export async function generateGeminiContent(
  prompt: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    enableGoogleSearch?: boolean;
    responseMimeType?: string;
    responseSchema?: any;
  },
): Promise<GeminiGenerationResult> {
  const model = ensureModel();
  const enableGoogleSearch =
    options?.enableGoogleSearch ?? GEMINI_ENABLE_GOOGLE_SEARCH;
  const started = Date.now();
  const tools = enableGoogleSearch ? ([{ googleSearch: {} }] as any) : undefined;

  const generationConfig: any = {
    temperature: options?.temperature ?? 0.3,
    maxOutputTokens: 4096,
  };

  if (options?.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }
  if (options?.responseSchema) {
    generationConfig.responseSchema = options.responseSchema;
  }

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
    tools,
  });

  let text = response.response?.text();
  if (!text && response.response?.candidates?.length) {
    text =
      response.response.candidates
        ?.map((candidate) =>
          candidate?.content?.parts
            ?.map((part: any) => part.text ?? part.inlineData ?? "")
            .join("\n"),
        )
        .join("\n")
        .trim() ?? "";
  }
  const promptFeedback = response.response?.promptFeedback;
  if (!text?.trim()) {
    if (promptFeedback?.blockReason) {
      throw new Error(
        `gemini-blocked-${promptFeedback.blockReason}${promptFeedback?.safetyRatings ? `:${JSON.stringify(promptFeedback.safetyRatings)}` : ""
        }`,
      );
    }
    const raw = response.response ?? (response as unknown);
    const snippet = (() => {
      try {
        return JSON.stringify(raw, null, 2).slice(0, 400);
      } catch {
        return "[unserializable]";
      }
    })();
    throw new Error(`gemini-empty-response:${snippet}`);
  }

  const tokensUsed = response.response?.usageMetadata?.totalTokenCount;
  const candidate = response.response?.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata ?? (response.response as any)?.groundingMetadata;
  const { annotatedText, sources } = applyGroundingCitations(text.trim(), groundingMetadata);
  return {
    content: annotatedText,
    model: GEMINI_MODEL,
    tokensUsed,
    latencyMs: Date.now() - started,
    sources: sources.length ? sources : undefined,
  };
}

type GroundingMetadata = {
  groundingSupports?: Array<{
    segment?: { startIndex?: number; endIndex?: number };
    groundingChunkIndices?: number[];
  }>;
  groundingChunks?: Array<{
    web?: {
      uri?: string;
      title?: string;
      snippet?: string;
    };
  }>;
};

function applyGroundingCitations(
  text: string,
  metadata?: GroundingMetadata,
): { annotatedText: string; sources: NonNullable<GeminiGenerationResult["sources"]> } {
  if (!text || !metadata?.groundingSupports?.length || !metadata?.groundingChunks?.length) {
    return {
      annotatedText: text,
      sources: [] as NonNullable<GeminiGenerationResult["sources"]>,
    };
  }

  const chunkIdMap = new Map<number, number>();
  const sources: NonNullable<GeminiGenerationResult["sources"]> = [];

  const getSourceId = (chunkIndex: number) => {
    if (chunkIdMap.has(chunkIndex)) {
      return chunkIdMap.get(chunkIndex)!;
    }
    const chunk = metadata.groundingChunks?.[chunkIndex];
    const url = chunk?.web?.uri;
    if (!url) {
      return null;
    }
    const id = chunkIdMap.size + 1;
    chunkIdMap.set(chunkIndex, id);
    sources.push({
      id,
      title: chunk?.web?.title ?? undefined,
      url,
      snippet: chunk?.web?.snippet ?? chunk?.web?.title ?? undefined,
    });
    return id;
  };

  const supports = [...(metadata.groundingSupports ?? [])].sort(
    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
  );

  let annotatedText = text;
  for (const support of supports) {
    const endIndex = support.segment?.endIndex;
    if (typeof endIndex !== "number" || !support.groundingChunkIndices?.length) {
      continue;
    }
    const ids = Array.from(
      new Set(
        support.groundingChunkIndices
          .map((chunkIdx) => getSourceId(chunkIdx))
          .filter((value): value is number => typeof value === "number"),
      ),
    );
    if (!ids.length) {
      continue;
    }
    const citation = ids.map((id) => `[${id}]`).join("");
    annotatedText = annotatedText.slice(0, endIndex) + citation + annotatedText.slice(endIndex);
  }

  return { annotatedText, sources };
}


