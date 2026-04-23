import { and, eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { transcripts } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse, serializeTranscript } from "@/lib/ai/server";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;

    const transcript = await db.query.transcripts.findFirst({
      where: and(eq(transcripts.id, id), eq(transcripts.userId, user.id)),
    });

    if (!transcript) {
      return Response.json({ error: "Transcript not found." }, { status: 404 });
    }

    return Response.json({ transcript: serializeTranscript(transcript) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
