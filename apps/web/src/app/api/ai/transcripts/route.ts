import { desc, eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { transcripts } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse, serializeTranscript } from "@/lib/ai/server";
import { getUtf8ByteLength, MAX_TRANSCRIPT_BYTES } from "@/lib/ai/shared";

type CreateTranscriptRequest = {
  title?: string;
  transcriptText?: string;
};

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

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as CreateTranscriptRequest;
    const title = body.title?.trim() ?? "";
    const transcriptText = body.transcriptText?.trim() ?? "";

    if (!title) {
      return Response.json({ error: "Enter a transcript title." }, { status: 400 });
    }

    if (!transcriptText) {
      return Response.json({ error: "Paste a transcript first." }, { status: 400 });
    }

    if (getUtf8ByteLength(transcriptText) > MAX_TRANSCRIPT_BYTES) {
      return Response.json({ error: "Transcript is too large." }, { status: 400 });
    }

    const transcriptId = crypto.randomUUID();
    await db.insert(transcripts).values({
      id: transcriptId,
      userId: user.id,
      fileName: title,
      transcriptText,
    });

    const transcript = await db.query.transcripts.findFirst({
      where: eq(transcripts.id, transcriptId),
    });

    if (!transcript) {
      return Response.json({ error: "Failed to save transcript." }, { status: 500 });
    }

    return Response.json({ transcript: serializeTranscript(transcript) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
