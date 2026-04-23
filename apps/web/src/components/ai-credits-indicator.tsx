"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { formatUsd, type AiCreditsResponse } from "@/lib/ai/shared";

export default function AiCreditsIndicator() {
  const { data: session, isPending } = authClient.useSession();
  const [credits, setCredits] = useState<AiCreditsResponse | null>(null);

  useEffect(() => {
    if (!session) {
      setCredits(null);
      return;
    }

    let cancelled = false;

    const loadCredits = async () => {
      const response = await fetch("/api/ai/credits", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as AiCreditsResponse;
      if (!cancelled) {
        setCredits(payload);
      }
    };

    void loadCredits();
    const intervalId = window.setInterval(() => {
      void loadCredits();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [session]);

  if (isPending || !session) {
    return null;
  }

  if (!credits?.hasApiKey) {
    return <span className="text-xs text-muted-foreground">Credits: set AI key</span>;
  }

  return (
    <span className="text-xs text-muted-foreground">
      Credits: {credits.balance ? formatUsd(Number(credits.balance)) : "n/a"}
    </span>
  );
}
