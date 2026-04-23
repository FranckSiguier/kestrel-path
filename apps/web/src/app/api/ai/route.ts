import { and, eq } from "drizzle-orm";
import { streamText } from "ai";

import { db } from "@kestrel-path/db";
import { analyses, systemPromptVersions, transcripts } from "@kestrel-path/db/schema/ai";

import {
  createGatewayProvider,
  requireSessionUser,
  requireStoredGatewayKey,
  routeErrorResponse,
} from "@/lib/ai/server";
import { derivePromptTitle, toMicros, toScaledNumber } from "@/lib/ai/shared";

export const maxDuration = 60;

type AnalyzeRequest = {
  transcriptId?: string;
  promptVersionId?: string | null;
  promptTitle?: string;
  systemPrompt?: string;
  modelId?: string;
  temperature?: number | null;
  topP?: number | null;
  maxOutputTokens?: number | null;
};

function getNumericValue(value: number | null | undefined) {
  if (value == null) {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

function buildTranscriptPrompt(fileName: string, transcriptText: string) {
  return [
    "Analyze the following transcript according to the provided system instructions.",
    "",
    `Transcript file: ${fileName}`,
    "",
    "<transcript>",
    transcriptText,
    "</transcript>",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const apiKey = await requireStoredGatewayKey(user.id);
    const body = (await request.json()) as AnalyzeRequest;

    if (!body.transcriptId) {
      return Response.json({ error: "Select a transcript first." }, { status: 400 });
    }

    if (!body.modelId?.trim()) {
      return Response.json({ error: "Select a model first." }, { status: 400 });
    }

    const transcript = await db.query.transcripts.findFirst({
      where: and(eq(transcripts.id, body.transcriptId), eq(transcripts.userId, user.id)),
    });

    if (!transcript) {
      return Response.json({ error: "Transcript not found." }, { status: 404 });
    }

    const existingPrompt = body.promptVersionId
      ? await db.query.systemPromptVersions.findFirst({
          where: and(
            eq(systemPromptVersions.id, body.promptVersionId),
            eq(systemPromptVersions.userId, user.id),
          ),
        })
      : null;

    if (body.promptVersionId && !existingPrompt) {
      return Response.json({ error: "System prompt not found." }, { status: 404 });
    }

    const promptText = body.systemPrompt?.trim() || existingPrompt?.content || "";
    if (!promptText) {
      return Response.json({ error: "System prompt is required." }, { status: 400 });
    }

    const promptTitle = body.promptTitle?.trim() || existingPrompt?.title || derivePromptTitle(promptText);
    const shouldCreateNewPromptVersion =
      !existingPrompt ||
      existingPrompt.content !== promptText ||
      existingPrompt.title !== promptTitle;

    const promptVersionId = shouldCreateNewPromptVersion
      ? crypto.randomUUID()
      : existingPrompt?.id ?? crypto.randomUUID();

    if (shouldCreateNewPromptVersion) {
      await db.insert(systemPromptVersions).values({
        id: promptVersionId,
        userId: user.id,
        title: promptTitle,
        content: promptText,
      });
    }

    const promptVersion =
      shouldCreateNewPromptVersion || !existingPrompt
        ? {
            id: promptVersionId,
            userId: user.id,
            title: promptTitle,
            content: promptText,
            createdAt: new Date(),
          }
        : existingPrompt;

    const analysisId = crypto.randomUUID();
    const temperature = getNumericValue(body.temperature);
    const topP = getNumericValue(body.topP);
    const maxOutputTokens = getNumericValue(body.maxOutputTokens);

    await db.insert(analyses).values({
      id: analysisId,
      userId: user.id,
      transcriptId: transcript.id,
      promptVersionId: promptVersion.id,
      status: "streaming",
      modelId: body.modelId.trim(),
      temperatureMilli: toScaledNumber(temperature),
      topPMilli: toScaledNumber(topP),
      maxOutputTokens,
      settingsJson: JSON.stringify({
        temperature,
        topP,
        maxOutputTokens,
      }),
      promptTitleSnapshot: promptVersion.title,
      promptTextSnapshot: promptVersion.content,
      transcriptFileNameSnapshot: transcript.fileName,
      streamed: true,
    });

    const gateway = createGatewayProvider(apiKey);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let resultText = "";
        let generationId: string | null = null;

        try {
          const result = streamText({
            model: gateway(body.modelId!.trim()),
            system: promptVersion.content,
            prompt: buildTranscriptPrompt(transcript.fileName, transcript.transcriptText),
            temperature: temperature ?? undefined,
            topP: topP ?? undefined,
            maxOutputTokens: maxOutputTokens ?? undefined,
          });

          for await (const part of result.fullStream) {
            if (!generationId && "providerMetadata" in part) {
              const gatewayMetadata = part.providerMetadata?.gateway;
              if (
                gatewayMetadata &&
                typeof gatewayMetadata === "object" &&
                "generationId" in gatewayMetadata &&
                typeof gatewayMetadata.generationId === "string"
              ) {
                generationId = gatewayMetadata.generationId;
              }
            }

            if (part.type === "text-delta") {
              resultText += part.text;
              controller.enqueue(encoder.encode(part.text));
            }
          }

          let generationInfo: Awaited<ReturnType<typeof gateway.getGenerationInfo>> | null = null;
          if (generationId) {
            try {
              generationInfo = await gateway.getGenerationInfo({ id: generationId });
            } catch (generationError) {
              console.error(generationError);
            }
          }

          await db
            .update(analyses)
            .set({
              status: "completed",
              resultText,
              generationId,
              providerName: generationInfo?.providerName ?? null,
              finishReason: generationInfo?.finishReason ?? null,
              totalCostMicros: toMicros(generationInfo?.totalCost ?? null),
              usageMicros: toMicros(generationInfo?.usage ?? null),
              promptTokens: generationInfo?.promptTokens ?? null,
              completionTokens: generationInfo?.completionTokens ?? null,
              reasoningTokens: generationInfo?.reasoningTokens ?? null,
              cachedTokens: generationInfo?.cachedTokens ?? null,
              cacheCreationTokens: generationInfo?.cacheCreationTokens ?? null,
              latencyMs: generationInfo?.latency ?? null,
              generationTimeMs: generationInfo?.generationTime ?? null,
              updatedAt: new Date(),
            })
            .where(eq(analyses.id, analysisId));

          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Analysis failed.";
          await db
            .update(analyses)
            .set({
              status: "error",
              resultText: resultText || null,
              errorMessage: message,
              generationId,
              updatedAt: new Date(),
            })
            .where(eq(analyses.id, analysisId));

          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Analysis-Id": analysisId,
        "X-Prompt-Version-Id": promptVersion.id,
      },
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
