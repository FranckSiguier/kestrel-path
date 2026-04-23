import { desc, eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { transcripts } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse, serializeTranscript } from "@/lib/ai/server";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const rows = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.userId, user.id))
      .orderBy(desc(transcripts.createdAt));

    return Response.json({ transcripts: rows.map(serializeTranscript) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
