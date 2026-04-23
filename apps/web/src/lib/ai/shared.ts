export const ANALYSIS_SCORE_MIN = 1;
export const ANALYSIS_SCORE_MAX = 5;
export const DECIMAL_SCALE = 1000;
export const COST_SCALE = 1_000_000;
export const MAX_TRANSCRIPT_BYTES = 5 * 1024 * 1024;

export type GatewayModelOption = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  pricing: {
    input: string | null;
    output: string | null;
  };
};

export type AiGatewaySettingsResponse = {
  hasApiKey: boolean;
  updatedAt: string | null;
};

export type AiCreditsResponse = {
  hasApiKey: boolean;
  balance: string | null;
  totalUsed: string | null;
};

export type TranscriptRecord = {
  id: string;
  fileName: string;
  transcriptText: string;
  createdAt: string;
  updatedAt: string;
};

export type PromptVersionRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type AnalysisRecord = {
  id: string;
  status: string;
  modelId: string;
  providerName: string | null;
  temperature: number | null;
  topP: number | null;
  maxOutputTokens: number | null;
  promptTitle: string;
  promptText: string;
  transcriptId: string;
  transcriptFileName: string;
  resultText: string | null;
  errorMessage: string | null;
  generationId: string | null;
  finishReason: string | null;
  totalCostUsd: number | null;
  usageUsd: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  reasoningTokens: number | null;
  cachedTokens: number | null;
  latencyMs: number | null;
  generationTimeMs: number | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PromptRanking = {
  promptVersionId: string;
  title: string;
  contentPreview: string;
  averageScore: number | null;
  scoreCount: number;
  analysisCount: number;
  totalCostUsd: number;
  lastUsedAt: string | null;
};

export type ModelUsage = {
  modelId: string;
  analysisCount: number;
  scoredCount: number;
  totalCostUsd: number;
  lastUsedAt: string | null;
};

export type RankingsResponse = {
  promptRankings: PromptRanking[];
  modelUsage: ModelUsage[];
  analyses: AnalysisRecord[];
  selectedPromptVersionId: string | null;
};

export function derivePromptTitle(content: string) {
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "Untitled system prompt";
  }

  return firstLine.slice(0, 80);
}

export function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function toScaledNumber(value: number | null | undefined, scale = DECIMAL_SCALE) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * scale);
}

export function fromScaledNumber(value: number | null | undefined, scale = DECIMAL_SCALE) {
  if (value == null) {
    return null;
  }

  return value / scale;
}

export function toMicros(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * COST_SCALE);
}

export function fromMicros(value: number | null | undefined) {
  if (value == null) {
    return null;
  }

  return value / COST_SCALE;
}

export function formatUsd(value: number | null | undefined) {
  if (value == null) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 0.01 ? 4 : 2,
    maximumFractionDigits: value < 0.01 ? 6 : 2,
  }).format(value);
}

export function formatPricingPerMillion(value: string | null | undefined) {
  if (!value) {
    return "n/a";
  }

  const perToken = Number(value);
  if (!Number.isFinite(perToken)) {
    return "n/a";
  }

  return `${formatUsd(perToken * 1_000_000)}/1M`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
