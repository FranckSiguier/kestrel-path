import { fetchGatewayCredits, getStoredGatewayKey, requireSessionUser, routeErrorResponse } from "@/lib/ai/server";
import type { AiCreditsResponse } from "@/lib/ai/shared";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const apiKey = await getStoredGatewayKey(user.id);

    if (!apiKey) {
      const emptyResponse: AiCreditsResponse = {
        hasApiKey: false,
        balance: null,
        totalUsed: null,
      };

      return Response.json(emptyResponse);
    }

    const credits = await fetchGatewayCredits(apiKey);
    const response: AiCreditsResponse = {
      hasApiKey: true,
      balance: credits.balance ?? null,
      totalUsed: credits.total_used ?? null,
    };

    return Response.json(response);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
