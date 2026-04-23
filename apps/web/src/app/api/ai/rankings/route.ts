import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { analyses, analysisScores, systemPromptVersions } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse, serializeAnalysis } from "@/lib/ai/server";
import { fromMicros, type RankingsResponse } from "@/lib/ai/shared";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const selectedPromptVersionId = searchParams.get("promptVersionId");

    const promptAverageScore = sql<number | null>`avg(${analysisScores.score})`;
    const promptScoreCount = sql<number>`count(${analysisScores.analysisId})`;
    const promptAnalysisCount = sql<number>`count(${analyses.id})`;
    const promptTotalCostMicros = sql<number>`coalesce(sum(${analyses.totalCostMicros}), 0)`;
    const promptLastUsedAt = sql<number | null>`max(${analyses.createdAt})`;

    const promptRows = await db
      .select({
        promptVersionId: systemPromptVersions.id,
        title: systemPromptVersions.title,
        content: systemPromptVersions.content,
        averageScore: promptAverageScore,
        scoreCount: promptScoreCount,
        analysisCount: promptAnalysisCount,
        totalCostMicros: promptTotalCostMicros,
        lastUsedAt: promptLastUsedAt,
      })
      .from(systemPromptVersions)
      .leftJoin(
        analyses,
        and(eq(analyses.promptVersionId, systemPromptVersions.id), eq(analyses.userId, user.id)),
      )
      .leftJoin(analysisScores, eq(analysisScores.analysisId, analyses.id))
      .where(eq(systemPromptVersions.userId, user.id))
      .groupBy(
        systemPromptVersions.id,
        systemPromptVersions.title,
        systemPromptVersions.content,
        systemPromptVersions.createdAt,
      )
      .orderBy(desc(promptAverageScore), desc(promptScoreCount), desc(promptLastUsedAt));

    const modelScoredCount = sql<number>`count(${analysisScores.analysisId})`;
    const modelAnalysisCount = sql<number>`count(${analyses.id})`;
    const modelTotalCostMicros = sql<number>`coalesce(sum(${analyses.totalCostMicros}), 0)`;
    const modelLastUsedAt = sql<number | null>`max(${analyses.createdAt})`;

    const modelRows = await db
      .select({
        modelId: analyses.modelId,
        analysisCount: modelAnalysisCount,
        scoredCount: modelScoredCount,
        totalCostMicros: modelTotalCostMicros,
        lastUsedAt: modelLastUsedAt,
      })
      .from(analyses)
      .leftJoin(analysisScores, eq(analysisScores.analysisId, analyses.id))
      .where(eq(analyses.userId, user.id))
      .groupBy(analyses.modelId)
      .orderBy(desc(modelTotalCostMicros), desc(modelAnalysisCount));

    const selectedPromptId =
      selectedPromptVersionId && promptRows.some((row) => row.promptVersionId === selectedPromptVersionId)
        ? selectedPromptVersionId
        : null;

    const analysisRows = selectedPromptId
      ? await db
          .select({
            analysis: analyses,
            score: analysisScores,
          })
          .from(analyses)
          .leftJoin(analysisScores, eq(analysisScores.analysisId, analyses.id))
          .where(and(eq(analyses.userId, user.id), eq(analyses.promptVersionId, selectedPromptId)))
          .orderBy(desc(analyses.createdAt))
      : [];

    const response: RankingsResponse = {
      promptRankings: promptRows.map((row) => ({
        promptVersionId: row.promptVersionId,
        title: row.title,
        contentPreview: row.content.slice(0, 180),
        averageScore: row.averageScore == null ? null : Number(row.averageScore),
        scoreCount: Number(row.scoreCount),
        analysisCount: Number(row.analysisCount),
        totalCostUsd: fromMicros(Number(row.totalCostMicros)) ?? 0,
        lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
      })),
      modelUsage: modelRows.map((row) => ({
        modelId: row.modelId,
        analysisCount: Number(row.analysisCount),
        scoredCount: Number(row.scoredCount),
        totalCostUsd: fromMicros(Number(row.totalCostMicros)) ?? 0,
        lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
      })),
      analyses: analysisRows.map((row) => serializeAnalysis(row.analysis, row.score)),
      selectedPromptVersionId: selectedPromptId,
    };

    return Response.json(response);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
