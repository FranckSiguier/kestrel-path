import { eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { transcripts } from "@kestrel-path/db/schema/ai";
import { put } from "@vercel/blob";

import { buildTranscriptPathname, requireSessionUser, routeErrorResponse, serializeTranscript } from "@/lib/ai/server";
import { isSupportedTranscriptFile, MAX_TRANSCRIPT_BYTES } from "@/lib/ai/shared";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Upload a transcript file." }, { status: 400 });
    }

    if (!isSupportedTranscriptFile(file.name)) {
      return Response.json(
        { error: "Unsupported transcript file type. Use a text-based file such as .txt, .md, .json, .srt, or .vtt." },
        { status: 400 },
      );
    }

    if (file.size > MAX_TRANSCRIPT_BYTES) {
      return Response.json({ error: "Transcript file is too large." }, { status: 400 });
    }

    const transcriptText = (await file.text()).trim();
    if (!transcriptText) {
      return Response.json({ error: "Transcript file is empty." }, { status: 400 });
    }

    const pathname = buildTranscriptPathname(user.id, file.name);
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "text/plain",
    });

    const transcriptId = crypto.randomUUID();
    await db.insert(transcripts).values({
      id: transcriptId,
      userId: user.id,
      fileName: file.name,
      blobPathname: blob.pathname,
      blobUrl: blob.url,
      contentType: file.type || "text/plain",
      sizeBytes: file.size,
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
