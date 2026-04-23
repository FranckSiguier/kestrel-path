import { desc, eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { systemPromptVersions } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse, serializePromptVersion } from "@/lib/ai/server";
import { derivePromptTitle } from "@/lib/ai/shared";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const rows = await db
      .select()
      .from(systemPromptVersions)
      .where(eq(systemPromptVersions.userId, user.id))
      .orderBy(desc(systemPromptVersions.createdAt));

    return Response.json({ prompts: rows.map(serializePromptVersion) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as {
      title?: string;
      content?: string;
    };

    const content = body.content?.trim();
    if (!content) {
      return Response.json({ error: "System prompt content is required." }, { status: 400 });
    }

    const promptId = crypto.randomUUID();
    await db.insert(systemPromptVersions).values({
      id: promptId,
      userId: user.id,
      title: body.title?.trim() || derivePromptTitle(content),
      content,
    });

    const prompt = await db.query.systemPromptVersions.findFirst({
      where: eq(systemPromptVersions.id, promptId),
    });

    if (!prompt) {
      return Response.json({ error: "Failed to save system prompt." }, { status: 500 });
    }

    return Response.json({ prompt: serializePromptVersion(prompt) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
