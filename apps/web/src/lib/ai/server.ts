import { auth } from "@kestrel-path/auth";
import { db } from "@kestrel-path/db";
import {
  aiGatewaySettings,
  analyses,
  analysisScores,
  systemPromptVersions,
  transcripts,
} from "@kestrel-path/db/schema/ai";
import { createGateway } from "ai";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import {
  type AnalysisRecord,
  type PromptVersionRecord,
  type TranscriptRecord,
  fromMicros,
  fromScaledNumber,
} from "./shared";

export class RouteError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new RouteError(401, "Unauthorized");
  }

  return user;
}

export function routeErrorResponse(error: unknown) {
  if (error instanceof RouteError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export async function getStoredGatewayKey(userId: string) {
  const setting = await db.query.aiGatewaySettings.findFirst({
    where: eq(aiGatewaySettings.userId, userId),
  });

  return setting?.apiKey ?? null;
}

export async function requireStoredGatewayKey(userId: string) {
  const apiKey = await getStoredGatewayKey(userId);
  if (!apiKey) {
    throw new RouteError(400, "Save a Vercel AI Gateway API key first.");
  }

  return apiKey;
}

export function createGatewayProvider(apiKey: string) {
  return createGateway({ apiKey });
}

export async function fetchGatewayCredits(apiKey: string) {
  const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new RouteError(response.status, "Unable to fetch AI Gateway credits.");
  }

  return (await response.json()) as {
    balance?: string;
    total_used?: string;
  };
}

export function toIsoString(value: Date | number) {
  return new Date(value).toISOString();
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function buildTranscriptPathname(userId: string, fileName: string) {
  return `transcripts/${userId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function serializeTranscript(
  row: typeof transcripts.$inferSelect,
): TranscriptRecord {
  return {
    id: row.id,
    fileName: row.fileName,
    blobPathname: row.blobPathname,
    blobUrl: row.blobUrl,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    transcriptText: row.transcriptText,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function serializePromptVersion(
  row: typeof systemPromptVersions.$inferSelect,
): PromptVersionRecord {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: toIsoString(row.createdAt),
  };
}

export function serializeAnalysis(
  row: typeof analyses.$inferSelect,
  scoreRow?: typeof analysisScores.$inferSelect | null,
): AnalysisRecord {
  return {
    id: row.id,
    status: row.status,
    modelId: row.modelId,
    providerName: row.providerName,
    temperature: fromScaledNumber(row.temperatureMilli),
    topP: fromScaledNumber(row.topPMilli),
    maxOutputTokens: row.maxOutputTokens,
    promptTitle: row.promptTitleSnapshot,
    promptText: row.promptTextSnapshot,
    transcriptId: row.transcriptId,
    transcriptFileName: row.transcriptFileNameSnapshot,
    resultText: row.resultText,
    errorMessage: row.errorMessage,
    generationId: row.generationId,
    finishReason: row.finishReason,
    totalCostUsd: fromMicros(row.totalCostMicros),
    usageUsd: fromMicros(row.usageMicros),
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    reasoningTokens: row.reasoningTokens,
    cachedTokens: row.cachedTokens,
    latencyMs: row.latencyMs,
    generationTimeMs: row.generationTimeMs,
    score: scoreRow?.score ?? null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}
