import { eq } from "drizzle-orm";

import { db } from "@kestrel-path/db";
import { aiGatewaySettings } from "@kestrel-path/db/schema/ai";

import { requireSessionUser, routeErrorResponse } from "@/lib/ai/server";
import type { AiGatewaySettingsResponse } from "@/lib/ai/shared";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const setting = await db.query.aiGatewaySettings.findFirst({
      where: eq(aiGatewaySettings.userId, user.id),
    });

    const response: AiGatewaySettingsResponse = {
      hasApiKey: Boolean(setting?.apiKey),
      updatedAt: setting ? new Date(setting.updatedAt).toISOString() : null,
    };

    return Response.json(response);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as { apiKey?: string };
    const apiKey = body.apiKey?.trim();

    if (!apiKey) {
      return Response.json({ error: "API key is required." }, { status: 400 });
    }

    await db
      .insert(aiGatewaySettings)
      .values({
        userId: user.id,
        apiKey,
      })
      .onConflictDoUpdate({
        target: aiGatewaySettings.userId,
        set: {
          apiKey,
          updatedAt: new Date(),
        },
      });

    return Response.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireSessionUser();
    await db.delete(aiGatewaySettings).where(eq(aiGatewaySettings.userId, user.id));
    return Response.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
