import { and, eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { analyses, analysisScores } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse } from "@/lib/ai/server";
import { ANALYSIS_SCORE_MAX, ANALYSIS_SCORE_MIN } from "@/lib/ai/shared";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json()) as { score?: number };

    if (
      body.score == null ||
      !Number.isInteger(body.score) ||
      body.score < ANALYSIS_SCORE_MIN ||
      body.score > ANALYSIS_SCORE_MAX
    ) {
      return Response.json({ error: "Score must be an integer from 1 to 5." }, { status: 400 });
    }

    const analysis = await db.query.analyses.findFirst({
      where: and(eq(analyses.id, id), eq(analyses.userId, user.id)),
    });

    if (!analysis) {
      return Response.json({ error: "Analysis not found." }, { status: 404 });
    }

    await db
      .insert(analysisScores)
      .values({
        analysisId: analysis.id,
        userId: user.id,
        score: body.score,
      })
      .onConflictDoUpdate({
        target: analysisScores.analysisId,
        set: {
          score: body.score,
          updatedAt: new Date(),
        },
      });

    return Response.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
