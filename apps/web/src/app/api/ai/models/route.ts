import type { GatewayModelOption } from "@/lib/ai/shared";

type GatewayModelsResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    description?: string;
    type?: string;
    context_window?: number;
    max_tokens?: number;
    pricing?: {
      input?: string;
      output?: string;
      prompt?: string;
      completion?: string;
      input_tiers?: Array<{ cost?: string }>;
      output_tiers?: Array<{ cost?: string }>;
      prompt_tiers?: Array<{ cost?: string }>;
      completion_tiers?: Array<{ cost?: string }>;
    };
  }>;
};

export async function GET() {
  const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
    cache: "no-store",
  });

  if (!response.ok) {
    return Response.json({ error: "Unable to fetch AI Gateway models." }, { status: response.status });
  }

  const payload = (await response.json()) as GatewayModelsResponse;
  const models: GatewayModelOption[] = (payload.data ?? [])
    .map((model) => {
      const inputPrice =
        model.pricing?.input ??
        model.pricing?.prompt ??
        model.pricing?.input_tiers?.[0]?.cost ??
        model.pricing?.prompt_tiers?.[0]?.cost ??
        null;
      const outputPrice =
        model.pricing?.output ??
        model.pricing?.completion ??
        model.pricing?.output_tiers?.[0]?.cost ??
        model.pricing?.completion_tiers?.[0]?.cost ??
        null;

      return {
        id: model.id ?? "",
        name: model.name ?? model.id ?? "",
        description: model.description ?? null,
        type: model.type ?? null,
        contextWindow: model.context_window ?? null,
        maxOutputTokens: model.max_tokens ?? null,
        pricing: {
          input: inputPrice,
          output: outputPrice,
        },
      };
    })
    .filter((model) => model.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return Response.json({ models });
}
