import { and, desc, eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { analyses, analysisScores } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse, serializeAnalysis } from "@/lib/ai/server";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get("transcriptId");

    const rows = await db
      .select({
        analysis: analyses,
        score: analysisScores,
      })
      .from(analyses)
      .leftJoin(analysisScores, eq(analysisScores.analysisId, analyses.id))
      .where(
        transcriptId
          ? and(eq(analyses.userId, user.id), eq(analyses.transcriptId, transcriptId))
          : eq(analyses.userId, user.id),
      )
      .orderBy(desc(analyses.createdAt));

    return Response.json({ analyses: rows.map((row) => serializeAnalysis(row.analysis, row.score)) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
